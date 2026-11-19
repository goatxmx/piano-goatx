import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { NoteInputService } from '../../core/note-input.service';
import { keyboardLayout } from '../../core/keyboard-layout';

export type KeyState = 'hint' | 'press' | 'ok' | 'bad';

// Teclas del piano físico de la compu -> teclas blancas (de izquierda a derecha)
const HOTKEYS = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'];

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

  protected layout = computed(() => keyboardLayout(this.range()));
  private hotkeyMap = computed(() => {
    const whites = this.layout().whites;
    const map: Record<string, number> = {};
    whites.forEach((w, i) => { if (HOTKEYS[i]) map[HOTKEYS[i]] = w.midi; });
    return map;
  });
  protected hotkeyFor(midi: number): string | null {
    const whites = this.layout().whites;
    const i = whites.findIndex((w) => w.midi === midi);
    return i >= 0 ? HOTKEYS[i] ?? null : null;
  }

  /** Estado visual efectivo de una tecla. */
  protected stateOf(midi: number): KeyState | null {
    if (this.pressed().has(midi)) return 'press';
    return this.states()[midi] ?? null;
  }

  protected press(midi: number, ev?: Event): void {
    if (this.disabled()) return;
    ev?.preventDefault();
    const cur = this.pressed();
    if (cur.has(midi)) return;
    const next = new Set(cur);
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
    const midi = this.hotkeyMap()[e.key.toLowerCase()];
    if (midi !== undefined) this.press(midi);
  }

  protected onKeyUp(e: KeyboardEvent): void {
    if (!this.keyboardControl()) return;
    const midi = this.hotkeyMap()[e.key.toLowerCase()];
    if (midi !== undefined) this.release(midi);
  }
}
