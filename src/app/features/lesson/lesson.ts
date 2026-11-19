import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { ProgressBar } from '../../ui/progress-bar/progress-bar';
import { PianoKeyboard, KeyState } from '../../ui/piano-keyboard/piano-keyboard';
import { InputStatus } from '../../ui/input-status/input-status';
import { Staff } from '../../ui/staff/staff';
import { NoteInputService } from '../../core/note-input.service';
import { SynthService } from '../../core/synth.service';
import { ProgressService } from '../../core/progress.service';
import { noteName, samePitchClass } from '../../core/notes';
import { ALL_LESSONS, findLesson, Lesson, Step } from '../../data/lessons';

type Feedback = { kind: 'idle' | 'ok' | 'bad'; msg: string };

@Component({
  selector: 'app-lesson',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, ProgressBar, PianoKeyboard, InputStatus, Staff],
  templateUrl: './lesson.html',
  styleUrl: './lesson.scss',
})
export class LessonPlayer {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notes = inject(NoteInputService);
  private synth = inject(SynthService);
  protected progressSvc = inject(ProgressService);

  protected lesson!: Lesson;
  protected idx = signal(0);
  protected seqPos = signal(0);
  protected demoPlaying = signal(false);
  protected finished = signal(false);
  protected feedback = signal<Feedback>({ kind: 'idle', msg: '' });
  protected keyStates = signal<Record<number, KeyState>>({});
  protected quizResult = signal<Record<number, 'ok' | 'bad'>>({});

  private totalTargets = 0;
  private correctTargets = 0;
  private erroredCurrent = false;

  protected step = computed<Step>(() => this.lesson.steps[this.idx()]);
  protected progressPct = computed(() => this.idx() / this.lesson.steps.length);

  protected prompt = computed(() => {
    const s = this.step();
    if (s.text) return s.text;
    switch (s.type) {
      case 'learn': return 'Escucha y toca esta nota.';
      case 'play': return s.hint ? `Toca ${noteName(s.notes[0])}.` : `Toca ${noteName(s.notes[0])} de memoria.`;
      case 'melody': return 'Toca la melodía, una nota a la vez.';
      case 'listen-repeat': return 'Escucha y repite lo que oíste.';
      case 'quiz-name': return '¿Qué nota es la tecla que brilla?';
      case 'read-staff': return 'Lee la nota del pentagrama y tócala.';
    }
  });

  protected quizOptions = computed(() =>
    (this.step().options ?? []).map((m) => ({ midi: m, name: noteName(m) })),
  );

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const found = findLesson(id);
    if (!found) { this.router.navigate(['/']); return; }
    this.lesson = found;

    this.notes.notes$.pipe(takeUntilDestroyed()).subscribe((e) => this.onNote(e.midi));
    this.setupStep();
  }

  // ---------- Flujo ----------
  private setupStep(): void {
    const s = this.step();
    this.seqPos.set(0);
    this.erroredCurrent = false;
    this.quizResult.set({});
    this.totalTargets += s.type === 'melody' || s.type === 'listen-repeat' ? s.notes.length : 1;
    this.feedback.set({ kind: 'idle', msg: '' });
    this.applyHints();
    if (s.type === 'learn') this.playDemo(s.notes.slice(0, 1));
    else if (s.type === 'listen-repeat') this.playDemo(s.notes);
  }

  private applyHints(): void {
    const s = this.step();
    const st: Record<number, KeyState> = {};
    if (s.type === 'learn' || s.type === 'quiz-name') st[s.notes[0]] = 'hint';
    else if (s.type === 'play' && s.hint) st[s.notes[0]] = 'hint';
    else if (s.type === 'melody' && s.hint) st[s.notes[this.seqPos()]] = 'hint';
    this.keyStates.set(st);
  }

  protected playDemo(seq: number[]): void {
    if (this.finished()) return;
    this.demoPlaying.set(true);
    this.synth.playSequence(seq, 0.6).then(() => {
      this.demoPlaying.set(false);
      this.applyHints();
    });
  }

  private onNote(incoming: number): void {
    if (this.finished() || this.demoPlaying()) return;
    const s = this.step();
    if (s.type === 'melody' || s.type === 'listen-repeat') this.handleSeq(incoming);
    else if (s.type === 'quiz-name') { /* se responde con botones */ }
    else this.handleSingle(incoming);
  }

  private handleSingle(incoming: number): void {
    const target = this.step().notes[0];
    if (this.matches(incoming, target)) {
      if (!this.erroredCurrent) this.correctTargets++;
      this.keyStates.set({ [target]: 'ok' });
      this.synth.play(target, 0.7);
      this.feedback.set({ kind: 'ok', msg: '¡Correcto!' });
      this.advanceSoon();
    } else {
      this.erroredCurrent = true;
      this.keyStates.set({ [incoming]: 'bad', [target]: 'hint' });
      this.feedback.set({ kind: 'bad', msg: this.hintMsg(incoming, target) });
    }
  }

  private handleSeq(incoming: number): void {
    const s = this.step();
    const pos = this.seqPos();
    const target = s.notes[pos];
    const ok = this.matches(incoming, target);
    if (ok) this.correctTargets++;
    this.synth.play(ok ? target : incoming, 0.5);

    const last = pos + 1 >= s.notes.length;
    const st: Record<number, KeyState> = { [target]: ok ? 'ok' : 'bad' };
    if (!last && s.type === 'melody' && s.hint) st[s.notes[pos + 1]] = 'hint';
    this.keyStates.set(st);

    if (last) {
      // La melodía no se reinicia al fallar: se marca y termina el paso.
      this.feedback.set({ kind: ok ? 'ok' : 'bad', msg: ok ? '¡Bien hecho!' : 'Lo intentaste, ¡sigamos!' });
      this.advanceSoon();
    } else {
      this.seqPos.set(pos + 1);
    }
  }

  protected choose(optionMidi: number): void {
    if (this.finished() || this.demoPlaying()) return;
    if (this.quizResult()[optionMidi]) return;
    const target = this.step().notes[0];
    if (samePitchClass(optionMidi, target)) {
      if (!this.erroredCurrent) this.correctTargets++;
      this.synth.play(target, 0.6);
      this.quizResult.set({ [optionMidi]: 'ok' });
      this.feedback.set({ kind: 'ok', msg: '¡Correcto!' });
      this.advanceSoon();
    } else {
      this.erroredCurrent = true;
      this.quizResult.set({ ...this.quizResult(), [optionMidi]: 'bad' });
      this.feedback.set({ kind: 'bad', msg: `Esa es ${noteName(optionMidi)}. Fíjate en la tecla que brilla.` });
    }
  }

  private advanceSoon(): void {
    setTimeout(() => this.next(), 680);
  }

  private next(): void {
    const n = this.idx() + 1;
    if (n >= this.lesson.steps.length) this.finish();
    else { this.idx.set(n); this.setupStep(); }
  }

  private finish(): void {
    this.finished.set(true);
    const accuracy = this.totalTargets ? this.correctTargets / this.totalTargets : 1;
    const { xp, stars } = this.progressSvc.completeLesson(this.lesson.id, accuracy);
    const gi = ALL_LESSONS.findIndex((l) => l.id === this.lesson.id);
    const nextId = gi >= 0 && gi < ALL_LESSONS.length - 1 ? ALL_LESSONS[gi + 1].id : null;
    this.router.navigate(['/completado'], {
      state: { lessonId: this.lesson.id, nextId, xp, stars, accuracy },
    });
  }

  // ---------- Helpers ----------
  private matches(a: number, target: number): boolean {
    return this.progressSvc.settings().anyOctave ? samePitchClass(a, target) : a === target;
  }

  private hintMsg(incoming: number, target: number): string {
    const dir = incoming > target ? 'a la izquierda' : 'a la derecha';
    return `Esa fue ${noteName(incoming)}. Busca ${noteName(target)}, ${dir}.`;
  }

  protected leave(): void {
    this.router.navigate(['/']);
  }
}
