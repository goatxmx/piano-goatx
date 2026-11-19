import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { NoteInputService } from '../../core/note-input.service';
import { noteNameOctave } from '../../core/notes';

/**
 * Indicador y control de la entrada activa (micrófono / MIDI). Permite
 * activar el micrófono con un toque (necesario en iOS: requiere gesto del
 * usuario para pedir permiso y arrancar el audio).
 */
@Component({
  selector: 'ui-input-status',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './input-status.html',
  styleUrl: './input-status.scss',
})
export class InputStatus {
  protected input = inject(NoteInputService);

  protected midiSupported = typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator;

  /** Nivel del micro (0..1) para el punto que late. */
  protected level = computed(() => this.input.micLevel());
  protected levelPct = computed(() => Math.round(this.input.micLevel() * 100));
  /** Nota que el micro escucha ahora mismo (diagnóstico). */
  protected heard = computed(() => {
    const p = this.input.micPitch();
    return p ? noteNameOctave(p.midi) : null;
  });

  protected startMic(): void { this.input.startMic(); }
  protected startMidi(): void { this.input.startMidi(); }
}
