import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../../ui/icon/icon';
import { StreakBadge } from '../../ui/streak-badge/streak-badge';
import { ProgressService } from '../../core/progress.service';
import { ALL_LESSONS, UNITS } from '../../data/lessons';

interface LessonNode {
  id: string; title: string;
  done: boolean; stars: number; unlocked: boolean; current: boolean;
}
interface UnitView { id: string; title: string; description: string; lessons: LessonNode[]; }

@Component({
  selector: 'app-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, StreakBadge, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected progress = inject(ProgressService);

  protected units = computed<UnitView[]>(() => {
    const completed = this.progress.completed();
    const unlockAll = this.progress.settings().unlockAll;
    // Primera lección no hecha y desbloqueada = "actual".
    let currentFound = false;
    const order = ALL_LESSONS;

    return UNITS.map((u) => ({
      id: u.id,
      title: u.title,
      description: u.description,
      lessons: u.lessons.map((l): LessonNode => {
        const globalIdx = order.findIndex((x) => x.id === l.id);
        const prev = globalIdx > 0 ? order[globalIdx - 1] : null;
        const done = !!completed[l.id];
        const unlocked = unlockAll || globalIdx === 0 || !!(prev && completed[prev.id]);
        const current = !currentFound && unlocked && !done;
        if (current) currentFound = true;
        return { id: l.id, title: l.title, done, stars: completed[l.id]?.stars ?? 0, unlocked, current };
      }),
    }));
  });

  protected stars3 = [1, 2, 3];
}
