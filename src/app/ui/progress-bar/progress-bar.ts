import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Barra de progreso de la lección (avanza con easing suave). */
@Component({
  selector: 'ui-progress-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    '[attr.aria-valuenow]': 'pct()',
    '[attr.aria-label]': 'label()',
  },
  template: `<span class="track"><span class="fill" [style.width.%]="pct()"></span></span>`,
  styleUrl: './progress-bar.scss',
})
export class ProgressBar {
  /** 0..1 */
  readonly value = input(0);
  readonly label = input('Progreso de la lección');
  protected pct = computed(() => Math.round(Math.max(0, Math.min(1, this.value())) * 100));
}
