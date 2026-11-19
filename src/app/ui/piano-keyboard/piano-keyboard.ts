import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NoteInputService } from '../../core/note-input.service';
import { isBlack, noteName } from '../../core/notes';

export type KeyState = 'hint' | 'press' | 'ok' | 'bad';

interface WhiteKey { midi: number; label: string; aria: string; hotkey?: string; }
interface BlackKey { midi: number; label: string; aria: string; leftPct: number; }

// Teclas del piano físico de la compu -> teclas blancas (de izquierda a derecha)
const HOTKEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'];

function ariaName(midi: number): string {
  return noteName(midi).replace('♯', ' sostenido');
}

/**
 * Teclado en pantalla. Rango configurable, estados visuales por tecla
 * (pista / presionada / correcta / incorrecta) y entrada por toque, ratón
 * o teclado físico. Toca -> NoteInputService.emit(midi, 'screen').
 */
@Component({
  selector: 'ui-piano-keyboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './piano-keyboard.html',
  styleUrl: './piano-keyboard.scss',
  host: {
    '(window:keydown)': 'onKeyDown($event)',
    '(window:keyup)': 'onKeyUp($event)',
  },
})
export class PianoKeyboard {
  private input = inject(NoteInputService);

  /** Rango [midiGrave, midiAgudo] inclusivo. */
  readonly range = input<[number, number]>([60, 72]);
  readonly showLabels = input(true);
  readonly disabled = input(false);
  /** Habilita el control por teclado físico (solo donde tenga sentido). */
  readonly keyboardControl = input(false);
  /** Estados pintados por el padre: { [midi]: 'hint' | 'ok' | 'bad' } */
  readonly states = input<Record<number, KeyState>>({});

  /** Teclas presionadas localmente (toque/tecla) para feedback inmediato. */
  private pressed = signal<ReadonlySet<number>>(new Set());

  protected layout = computed(() => {
    const [lo, hi] = this.range();
    const whites: WhiteKey[] = [];
    const blacks: Omit<BlackKey, 'leftPct'>[] = [];
    for (let m = lo; m <= hi; m++) {
      if (isBlack(m)) blacks.push({ midi: m, label: noteName(m), aria: ariaName(m) });
      else whites.push({ midi: m, label: noteName(m), aria: ariaName(m) });
    }
    whites.forEach((w, i) => (w.hotkey = HOTKEYS[i]));

    const n = whites.length;
    const wPct = 100 / Math.max(1, n);
    const bPct = wPct * 0.62;
    const positioned: BlackKey[] = blacks.map((b) => {
      const leftWhite = whites.findIndex((w) => w.midi === b.midi - 1);
      const center = (leftWhite + 1) * wPct;
      return { ...b, leftPct: center - bPct / 2 };
    });

    return { whites, blacks: positioned, whiteWidthPct: wPct, blackWidthPct: bPct };
  });

  /** Estado visual efectivo de una tecla. */
  protected stateOf(midi: number): KeyState | null {
    if (this.pressed().has(midi)) return 'press';
    return this.states()[midi] ?? null;
  }

  protected press(midi: number, ev?: Event): void {
    if (this.disabled()) return;
    ev?.preventDefault();
    const next = new Set(this.pressed());
    if (next.has(midi)) return;
    next.add(midi);
    this.pressed.set(next);
    this.input.emit(midi, 'screen');
  }

  protected release(midi: number): void {
    if (!this.pressed().has(midi)) return;
    const next = new Set(this.pressed());
    next.delete(midi);
    this.pressed.set(next);
  }

  protected onKeyDown(e: KeyboardEvent): void {
    if (!this.keyboardControl() || this.disabled() || e.repeat || e.metaKey || e.ctrlKey) return;
    const idx = HOTKEYS.indexOf(e.key.toLowerCase());
    if (idx < 0) return;
    const w = this.layout().whites[idx];
    if (w) this.press(w.midi);
  }

  protected onKeyUp(e: KeyboardEvent): void {
    if (!this.keyboardControl()) return;
    const idx = HOTKEYS.indexOf(e.key.toLowerCase());
    if (idx < 0) return;
    const w = this.layout().whites[idx];
    if (w) this.release(w.midi);
  }
}
