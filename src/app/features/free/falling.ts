import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { ProgressBar } from '../../ui/progress-bar/progress-bar';
import { PianoKeyboard, KeyState } from '../../ui/piano-keyboard/piano-keyboard';
import { InputStatus } from '../../ui/input-status/input-status';
import { NoteInputService } from '../../core/note-input.service';
import { SynthService } from '../../core/synth.service';
import { ProgressService } from '../../core/progress.service';
import { keyboardLayout, KeyGeo } from '../../core/keyboard-layout';
import { noteName, samePitchClass } from '../../core/notes';
import { findSong, Song } from '../../data/songs';

interface Bar { i: number; midi: number; name: string; geo: KeyGeo; }

/** Píxeles por tiempo entre notas (separación vertical de la caída). */
const SPACING = 76;

@Component({
  selector: 'app-falling',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, ProgressBar, PianoKeyboard, InputStatus],
  templateUrl: './falling.html',
  styleUrl: './falling.scss',
  host: { '[style.--spacing.px]': 'spacing', '[style.--lanes]': 'whiteCount' },
})
export class Falling {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notes = inject(NoteInputService);
  private synth = inject(SynthService);
  protected progressSvc = inject(ProgressService);

  protected readonly spacing = SPACING;
  protected song!: Song;
  protected bars: Bar[] = [];
  protected whiteCount = 7;

  protected cursor = signal(0);       // siguiente nota por tocar
  protected head = signal(0);         // posición continua de la caída (en "tiempos")
  protected bpm = signal(70);         // tempo (notas por minuto)
  protected finished = signal(false);
  protected demoPlaying = signal(false);
  private okFlash = signal<number | null>(null);
  private badFlash = signal<number | null>(null);

  private raf = 0;
  private lastTs = 0;

  protected progressPct = computed(() =>
    this.bars.length ? this.cursor() / this.bars.length : 0,
  );

  protected keyStates = computed<Record<number, KeyState>>(() => {
    const st: Record<number, KeyState> = {};
    const target = this.bars[this.cursor()]?.midi;
    if (target !== undefined && !this.finished()) st[target] = 'hint';
    const ok = this.okFlash();
    if (ok !== null) st[ok] = 'ok';
    const bad = this.badFlash();
    if (bad !== null) st[bad] = 'bad';
    return st;
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const s = findSong(id);
    if (!s) { this.router.navigate(['/libre']); return; }
    this.song = s;
    const layout = keyboardLayout(s.range);
    this.whiteCount = layout.whiteCount;
    this.bars = s.notes.map((midi, i) => ({
      i, midi, name: noteName(midi), geo: layout.byMidi[midi],
    }));
    this.notes.notes$.pipe(takeUntilDestroyed()).subscribe((e) => this.onNote(e.midi));

    this.lastTs = performance.now();
    inject(DestroyRef).onDestroy(() => cancelAnimationFrame(this.raf));
    this.raf = requestAnimationFrame(this.loop);
  }

  /**
   * Bucle de caída (estilo Artie): la cabeza avanza con el tempo, PERO nunca
   * pasa de la próxima nota sin tocar → "wait mode": la nota se espera en la
   * línea hasta que la tocas, y entonces sigue cayendo hacia la siguiente.
   */
  private loop = (ts: number = performance.now()): void => {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0);
    this.lastTs = ts;
    if (!this.finished() && !this.demoPlaying()) {
      const speed = this.bpm() / 60;          // tiempos por segundo
      const cap = this.cursor();              // no rebasar la nota por tocar
      const next = Math.min(this.head() + speed * dt, cap);
      if (next !== this.head()) this.head.set(next);
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  protected translateFor(i: number): number {
    return (this.head() - i) * SPACING;
  }
  protected stateFor(i: number): 'done' | 'current' | 'next' {
    const c = this.cursor();
    return i < c ? 'done' : i === c ? 'current' : 'next';
  }

  private onNote(incoming: number): void {
    if (this.finished() || this.demoPlaying()) return;
    const target = this.bars[this.cursor()]?.midi;
    if (target === undefined) return;

    if (this.matches(incoming, target)) {
      this.synth.play(target, 0.5);
      this.flashOk(target);
      const next = this.cursor() + 1;
      this.cursor.set(next);
      if (next >= this.bars.length) this.finish();
    } else {
      this.flashBad(incoming);
    }
  }

  private flashOk(midi: number): void {
    this.okFlash.set(midi);
    setTimeout(() => { if (this.okFlash() === midi) this.okFlash.set(null); }, 260);
  }
  private flashBad(midi: number): void {
    this.badFlash.set(midi);
    setTimeout(() => { if (this.badFlash() === midi) this.badFlash.set(null); }, 260);
  }

  private matches(a: number, target: number): boolean {
    return this.progressSvc.settings().anyOctave ? samePitchClass(a, target) : a === target;
  }

  private finish(): void {
    this.finished.set(true);
  }

  protected slower(): void { this.bpm.update((b) => Math.max(40, b - 10)); }
  protected faster(): void { this.bpm.update((b) => Math.min(140, b + 10)); }

  protected listen(): void {
    if (this.demoPlaying()) return;
    this.demoPlaying.set(true);
    this.synth.playSequence(this.song.notes, 60 / this.bpm()).then(() => this.demoPlaying.set(false));
  }

  protected restart(): void {
    this.finished.set(false);
    this.cursor.set(0);
    this.head.set(0);
    this.lastTs = performance.now();
  }

  protected leave(): void {
    this.router.navigate(['/libre']);
  }
}
