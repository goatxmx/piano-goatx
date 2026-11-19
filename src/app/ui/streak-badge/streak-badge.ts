import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';

/** Insignia de racha diaria. Con orgullo, sin culpa. */
@Component({
  selector: 'ui-streak-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  host: { '[class.active]': 'active()', '[attr.aria-label]': 'aria()' },
  template: `
    <ui-icon name="flame" [size]="size()" />
    <span class="n tnum">{{ days() }}</span>
  `,
  styleUrl: './streak-badge.scss',
})
export class StreakBadge {
  readonly days = input(0);
  readonly size = input(20);
  protected active = computed(() => this.days() > 0);
  protected aria = computed(() =>
    this.days() > 0 ? `Racha de ${this.days()} ${this.days() === 1 ? 'día' : 'días'}` : 'Aún sin racha',
  );
}
