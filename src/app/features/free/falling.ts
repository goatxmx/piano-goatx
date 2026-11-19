import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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

/** Distancia vertical entre notas que caen (px). */
const SPACING = 72;

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

  protected cursor = signal(0);
  protected finished = signal(false);
  protected demoPlaying = signal(false);
  private okFlash = signal<number | null>(null);
  private badFlash = signal<number | null>(null);

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
  }

  // Desplazamiento vertical de cada nota (cae hacia la línea de toque).
  protected translateFor(i: number): number {
    return (this.cursor() - i) * SPACING;
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
      // No castiga: solo marca suave y sigues esperando la nota correcta.
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

  protected listen(): void {
    if (this.demoPlaying()) return;
    this.demoPlaying.set(true);
    this.synth.playSequence(this.song.notes, 0.5).then(() => this.demoPlaying.set(false));
  }

  protected restart(): void {
    this.finished.set(false);
    this.cursor.set(0);
  }

  protected leave(): void {
    this.router.navigate(['/libre']);
  }
}
