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

  constructor() {
    this.applySensitivity(this.sensitivity());
  }

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
  readonly micThreshold = signal(0.006);
  /** Claridad mínima del detector de tono (McLeod). Más bajo = detecta más fácil. */
  readonly micClarity = signal(0.8);

  /** Sensibilidad general 0..1 (sube ambos: umbral + claridad). Se guarda por dispositivo. */
  private readonly SENS_KEY = 'piano-goat-mic-sens';
  readonly sensitivity = signal(this.loadSensitivity());

  /** 0 = estricto (poco sensible) … 1 = muy sensible. Útil para iPads con micro débil. */
  setSensitivity(v: number): void {
    const c = Math.max(0, Math.min(1, v));
    this.sensitivity.set(c);
    this.applySensitivity(c);
    try { localStorage.setItem(this.SENS_KEY, String(c)); } catch { /* modo privado */ }
  }

  private applySensitivity(v: number): void {
    const lerp = (a: number, b: number) => a + (b - a) * v;
    this.micThreshold.set(lerp(0.02, 0.0025)); // más sensible => umbral más bajo
    this.micClarity.set(lerp(0.90, 0.68));     // más sensible => exige menos claridad
  }

  private loadSensitivity(): number {
    try { const r = localStorage.getItem(this.SENS_KEY); return r ? Number(r) : 0.55; }
    catch { return 0.55; }
  }

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
    // iOS/Safari crea el contexto "suspended": sin resume() no llega audio.
    try { await this.audioCtx.resume(); } catch { /* ignora */ }
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
   * Bucle de detección con detector de "inicio de nota" (onset).
   * Una nota se emite cuando el tono es estable unos cuadros y:
   *  (a) es distinta a la anterior,
   *  (b) venimos de silencio, o
   *  (c) hay un nuevo ataque: el volumen salta por encima de una envolvente
   *      lenta (así detecta Sol-Sol seguidos sin necesidad de pausa).
   * Un anti-rebote de 90 ms evita duplicar una nota sostenida.
   */
  private listen(analyser: AnalyserNode, sampleRate: number): void {
    const buf = new Float32Array(analyser.fftSize);
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    let candidate = -1, stableFrames = 0, lastEmitted = -1, lastEmitTime = 0;
    let armed = true, env = 0;

    const STABLE = 2;          // cuadros de tono estable
    const ONSET_FACTOR = 1.5;  // salto de volumen que cuenta como nuevo ataque
    const MIN_REPEAT_MS = 90;  // anti-rebote para la MISMA nota

    const tick = () => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      this.micLevel.set(Math.min(1, rms * 8));

      const threshold = this.micThreshold();
      if (rms < threshold) {
        armed = true; candidate = -1; stableFrames = 0;
        env *= 0.8;
        this.micPitch.set(null);
      } else {
        // Onset: ataque claro por encima de la envolvente lenta.
        const onset = rms > env * ONSET_FACTOR && rms > threshold * 1.5;
        // La envolvente sube rápido y baja lento (no sigue de cerca al rms).
        env += (rms - env) * (rms > env ? 0.25 : 0.08);

        const [freq, clarity] = detector.findPitch(buf, sampleRate);
        if (clarity > this.micClarity() && freq > 25 && freq < 4500) {
          const exact = freqToMidi(freq);
          const midi = Math.round(exact);
          this.micPitch.set({ midi, cents: Math.round((exact - midi) * 100) });

          if (midi === candidate) stableFrames++;
          else { candidate = midi; stableFrames = 1; }

          if (onset) armed = true;

          const now = performance.now();
          const isNew = midi !== lastEmitted;
          const repeatOk = isNew || now - lastEmitTime > MIN_REPEAT_MS;
          if (stableFrames >= STABLE && (isNew || armed) && repeatOk) {
            this.emit(midi, 'mic');
            lastEmitted = midi;
            lastEmitTime = now;
            armed = false;
          }
        }
      }
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
