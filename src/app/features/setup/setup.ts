import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';
import { PianoKeyboard } from '../../ui/piano-keyboard/piano-keyboard';
import { NoteInputService } from '../../core/note-input.service';
import { ProgressService } from '../../core/progress.service';
import { noteNameOctave } from '../../core/notes';

type InputChoice = 'mic' | 'midi' | 'screen';

@Component({
  selector: 'app-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, Icon, PianoKeyboard, RouterLink],
  templateUrl: './setup.html',
  styleUrl: './setup.scss',
})
export class Setup {
  protected input = inject(NoteInputService);
  protected progress = inject(ProgressService);
  private router = inject(Router);

  protected choice = signal<InputChoice | null>(null);

  protected detected = computed(() => {
    const p = this.input.micPitch();
    return p ? noteNameOctave(p.midi) : null;
  });
  protected levelPct = computed(() => Math.round(this.input.micLevel() * 100));
  protected thresholdPct = computed(() => Math.round(this.input.micThreshold() * 1000));

  protected choose(c: InputChoice): void {
    this.choice.set(c);
    if (c === 'mic') this.input.startMic();
    if (c === 'midi') this.input.startMidi();
  }

  protected onThreshold(e: Event): void {
    const v = Number((e.target as HTMLInputElement).value);
    this.input.micThreshold.set(v / 1000);
  }

  protected toggleAnyOctave(): void {
    this.progress.setSetting('anyOctave', !this.progress.settings().anyOctave);
  }
  protected toggleLabels(): void {
    this.progress.setSetting('showLabels', !this.progress.settings().showLabels);
  }
  protected toggleUnlockAll(): void {
    this.progress.setSetting('unlockAll', !this.progress.settings().unlockAll);
  }

  protected finish(): void {
    this.router.navigate(['/']);
  }
}
