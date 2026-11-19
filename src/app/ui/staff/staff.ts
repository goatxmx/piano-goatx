import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { noteName } from '../../core/notes';

// Índice diatónico (Do=0..Si=6) desde la clase de tono.
const PC_TO_DIATONIC: Record<number, number> = { 0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6 };

// Geometría del pentagrama (clave de Sol).
const STAFF_TOP = 40;      // y de la línea superior (Fa5)
const LINE_GAP = 15;       // separación entre líneas
const STAFF_BOTTOM = STAFF_TOP + LINE_GAP * 4; // 100 = línea inferior (Mi4)
const HALF = LINE_GAP / 2; // un paso diatónico = media línea

/**
 * Pentagrama SVG propio (provisional, sin VexFlow). Muestra una nota en
 * clave de Sol. Rango pensado para Do4–Do5 al inicio (Unidad 2).
 */
@Component({
  selector: 'ui-staff',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 180 150" class="staff" [attr.aria-label]="aria()" role="img">
      <!-- Líneas -->
      @for (ly of lines; track ly) {
        <line [attr.x1]="14" [attr.y1]="ly" [attr.x2]="168" [attr.y2]="ly" class="ln" />
      }
      <!-- Clave de Sol (glifo musical) -->
      <text x="18" y="108" class="clef">𝄞</text>

      <!-- Líneas adicionales (ledger) para Do central, etc. -->
      @for (ly of ledgers(); track ly) {
        <line [attr.x1]="note().cx - 14" [attr.y1]="ly" [attr.x2]="note().cx + 14" [attr.y2]="ly" class="ln" />
      }

      <!-- Nota -->
      <ellipse [attr.cx]="note().cx" [attr.cy]="note().cy" rx="9.5" ry="7"
        [attr.transform]="'rotate(-18 ' + note().cx + ' ' + note().cy + ')'" class="head" />

      @if (showName()) {
        <text [attr.x]="note().cx" y="140" class="name">{{ label() }}</text>
      }
    </svg>
  `,
  styleUrl: './staff.scss',
})
export class Staff {
  readonly midi = input.required<number>();
  readonly showName = input(false);

  protected readonly lines = [40, 55, 70, 85, 100];

  protected label = computed(() => noteName(this.midi()));
  protected aria = computed(() => `Nota ${noteName(this.midi())} en el pentagrama`);

  protected note = computed(() => {
    const m = this.midi();
    const pc = ((m % 12) + 12) % 12;
    const octave = Math.floor(m / 12) - 1;
    const diatonic = (octave - 4) * 7 + (PC_TO_DIATONIC[pc] ?? 0);
    // Mi4 (diatónico 2) está en la línea inferior (y=100).
    const cy = STAFF_BOTTOM - (diatonic - 2) * HALF;
    return { cx: 112, cy };
  });

  protected ledgers = computed(() => {
    const { cy } = this.note();
    const out: number[] = [];
    // Por debajo del pentagrama (p. ej. Do central en y=115).
    for (let y = STAFF_BOTTOM + LINE_GAP; y <= cy + 0.1; y += LINE_GAP) out.push(y);
    // Por arriba.
    for (let y = STAFF_TOP - LINE_GAP; y >= cy - 0.1; y -= LINE_GAP) out.push(y);
    return out;
  });
}
