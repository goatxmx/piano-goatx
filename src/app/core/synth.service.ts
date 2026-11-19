import { Injectable, inject } from '@angular/core';
import { midiToFreq } from './notes';
import { NoteInputService } from './note-input.service';

/**
 * Sintetizador simple con Web Audio (sin dependencias).
 * Mientras suena, avisa al servicio de entrada para que el micrófono
 * no "escuche" a la propia app y lo cuente como si tú tocaras.
 */
@Injectable({ providedIn: 'root' })
export class SynthService {
  private ctx?: AudioContext;
  private input = inject(NoteInputService);

  private context(): AudioContext {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  /** Toca una nota con sonido tipo piano eléctrico suave */
  play(midi: number, duration = 0.9, when = 0): void {
    const ctx = this.context();
    const t = ctx.currentTime + when;
    const f = midiToFreq(midi);

    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    out.connect(ctx.destination);

    const partials: [OscillatorType, number, number][] = [
      ['triangle', 1, 1],
      ['sine', 2, 0.25],
      ['sine', 3, 0.08],
    ];
    for (const [type, mult, gain] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = f * mult;
      g.gain.value = gain;
      osc.connect(g).connect(out);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    }
    this.input.muteFor((when + duration) * 1000 + 250);
  }

  /** Toca una secuencia. Devuelve una promesa que termina al acabar. */
  playSequence(notes: number[], gap = 0.6): Promise<void> {
    notes.forEach((n, i) => this.play(n, gap * 0.95, i * gap));
    return new Promise((r) => setTimeout(r, notes.length * gap * 1000 + 200));
  }
}
