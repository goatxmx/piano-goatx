import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { ProgressService } from '../../core/progress.service';
import { findLesson } from '../../data/lessons';

interface CompleteState {
  lessonId?: string;
  nextId?: string | null;
  xp?: number;
  stars?: number;
  accuracy?: number;
  perfect?: boolean;
}

@Component({
  selector: 'app-complete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, RouterLink],
  templateUrl: './complete.html',
  styleUrl: './complete.scss',
})
export class Complete {
  private router = inject(Router);
  protected progress = inject(ProgressService);

  protected state: CompleteState = (history.state ?? {}) as CompleteState;
  protected stars = this.state.stars ?? 1;
  protected xp = this.state.xp ?? 10;
  protected accuracyPct = Math.round((this.state.accuracy ?? 1) * 100);
  protected nextId = this.state.nextId ?? null;
  protected lessonTitle = this.state.lessonId ? findLesson(this.state.lessonId)?.title ?? '' : '';
  protected nextTitle = this.nextId ? findLesson(this.nextId)?.title ?? '' : '';

  protected starSlots = [1, 2, 3];
  protected revealed = signal(false);

  constructor() {
    // Celebración breve; se revela y queda (saltar = ignorarla, no estorba).
    requestAnimationFrame(() => this.revealed.set(true));
  }

  protected goNext(): void {
    if (this.nextId) this.router.navigate(['/leccion', this.nextId]);
    else this.router.navigate(['/']);
  }

  protected repeat(): void {
    if (this.state.lessonId) this.router.navigate(['/leccion', this.state.lessonId]);
  }
}
