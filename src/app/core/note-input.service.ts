import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { PitchDetector } from 'pitchy';
import { freqToMidi } from './notes';

export type NoteSource = 'mic' | 'midi' | 'screen';
export interface NoteEvent { midi: number; source: NoteSource; time: number; }
export type DeviceStatus = 'off' | 'starting' | 'on' | 'denied' | 'unsupported' | 'no-device';

/**
 * Une las tres formas de tocar en un solo flujo de notas:
 *  - Micrófono (cualquier piano/teclado real, detección de tono)
 *  - MIDI por USB (precisión total, ej. Casio LK-280)
 *  - Teclado en pantalla (para quien aún no tiene instrumento)
 */
@Injectable({ providedIn: 'root' })
export class NoteInputService {
  readonly notes$ = new Subject<NoteEvent>();

  readonly micStatus = signal<DeviceStatus>('off');
  readonly midiStatus = signal<DeviceStatus>('off');
  readonly midiDevices = signal<string[]>([]);
  /** Lo que el micrófono escucha ahora (para la pantalla de prueba) */
  readonly micLevel = signal(0);
  readonly micPitch = signal<{ midi: number; cents: number } | null>(null);
  readonly lastNote = signal<NoteEvent | null>(null);

  private mutedUntil = 0;

  // ---------- API común ----------
  emit(midi: number, source: NoteSource): void {
    if (source === 'mic' && performance.now() < this.mutedUntil) return;
    const ev = { midi, source, time: performance.now() };
    this.lastNote.set(ev);
    this.notes$.next(ev);
  }

  /** Ignora el micrófono un rato (cuando la app está sonando) */
  muteFor(ms: number): void {
    this.mutedUntil = Math.max(this.mutedUntil, performance.now() + ms);
  }

  // ---------- Micrófono ----------
  private audioCtx?: AudioContext;
  private stream?: MediaStream;
  private rafId = 0;

  /** Sensibilidad: nivel RMS mínimo para considerar que hay sonido */
  readonly micThreshold = signal(0.01);

  async startMic(): Promise<void> {
    if (this.micStatus() === 'on' || this.micStatus() === 'starting') return;
    if (!navigator.mediaDevices?.getUserMedia) { this.micStatus.set('unsupported'); return; }
    this.micStatus.set('starting');
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        // Sin "mejoras" de voz: arruinan la detección de notas
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
    } catch {
      this.micStatus.set('denied');
      return;
    }
    this.audioCtx = new AudioContext();
    const source = this.audioCtx.createMediaStreamSource(this.stream);
    const analyser = this.audioCtx.createAnalyser();
    analyser.fftSize = 4096; // ventana suficiente para notas graves (~Do2)
    source.connect(analyser);
    this.micStatus.set('on');
    this.listen(analyser, this.audioCtx.sampleRate);
  }

  stopMic(): void {
    cancelAnimationFrame(this.rafId);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioCtx?.close();
    this.audioCtx = undefined;
    this.micStatus.set('off');
    this.micPitch.set(null);
    this.micLevel.set(0);
  }

  /**
   * Bucle de detección. Lógica de "ataque":
   * una nota se emite cuando el tono se mantiene estable unos cuadros y
   * (a) es distinta a la anterior, (b) venimos de silencio, o
   * (c) el volumen da un salto (volviste a presionar la misma tecla).
   */
  private listen(analyser: AnalyserNode, sampleRate: number): void {
    const buf = new Float32Array(analyser.fftSize);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    let candidate = -1, stableFrames = 0, lastEmitted = -1;
    let armed = true, prevRms = 0;

    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      this.micLevel.set(Math.min(1, rms * 8));

      const threshold = this.micThreshold();
      if (rms < threshold) {
        armed = true; candidate = -1; stableFrames = 0;
        this.micPitch.set(null);
      } else {
        const [freq, clarity] = detector.findPitch(buf, sampleRate);
        if (clarity > 0.88 && freq > 25 && freq < 4500) {
          const exact = freqToMidi(freq);
          const midi = Math.round(exact);
          this.micPitch.set({ midi, cents: Math.round((exact - midi) * 100) });

          const reattack = rms > prevRms * 1.8 && rms > threshold * 2;
          if (midi === candidate) stableFrames++;
          else { candidate = midi; stableFrames = 1; }

          if (reattack) armed = true;
          if (stableFrames >= 3 && (armed || midi !== lastEmitted)) {
            this.emit(midi, 'mic');
            lastEmitted = midi;
            armed = false;
          }
        }
      }
      prevRms = prevRms * 0.6 + rms * 0.4;
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
  }

  // ---------- MIDI ----------
  async startMidi(): Promise<void> {
    if (!('requestMIDIAccess' in navigator)) { this.midiStatus.set('unsupported'); return; }
    this.midiStatus.set('starting');
    try {
      const access = await navigator.requestMIDIAccess();
      const bind = () => {
        const names: string[] = [];
        access.inputs.forEach((input) => {
          names.push(input.name ?? 'Teclado MIDI');
          input.onmidimessage = (e) => {
            const [status, note, vel] = e.data ?? [];
            if ((status & 0xf0) === 0x90 && vel > 0) this.emit(note, 'midi');
          };
        });
        this.midiDevices.set(names);
        this.midiStatus.set(names.length ? 'on' : 'no-device');
      };
      access.onstatechange = bind; // conectar/desconectar en caliente
      bind();
    } catch {
      this.midiStatus.set('denied');
    }
  }
}
