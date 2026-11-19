import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from '../../ui/button/button';
import { ProgressBar } from '../../ui/progress-bar/progress-bar';
import { StreakBadge } from '../../ui/streak-badge/streak-badge';
import { Icon, IconName } from '../../ui/icon/icon';
import { PianoKeyboard, KeyState } from '../../ui/piano-keyboard/piano-keyboard';
import { Staff } from '../../ui/staff/staff';
import { NoteInputService } from '../../core/note-input.service';
import { SynthService } from '../../core/synth.service';
import { C4, D4, E4, G4, C5, A4 } from '../../core/notes';

type ThemeMode = 'auto' | 'light' | 'dark';

@Component({
  selector: 'app-estilos',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Button, ProgressBar, StreakBadge, Icon, PianoKeyboard, Staff],
  templateUrl: './estilos.html',
  styleUrl: './estilos.scss',
})
export class Estilos {
  private notes = inject(NoteInputService);
  private synth = inject(SynthService);

  protected theme = signal<ThemeMode>('auto');
  protected progress = signal(0.4);
  protected kbLabels = signal(true);
  protected readonly kbStates: Record<number, KeyState> = {
    [C4]: 'hint', [D4]: 'ok', [E4]: 'bad', [G4]: 'hint',
  };

  constructor() {
    // En el demo, cualquier nota tocada suena (en la app real lo hace el reproductor).
    this.notes.notes$.pipe(takeUntilDestroyed()).subscribe((e) => this.synth.play(e.midi, 0.7));
  }

  protected readonly colors: { token: string; label: string }[] = [
    { token: '--bg', label: 'Fondo' },
    { token: '--bg-sunken', label: 'Hundido' },
    { token: '--surface', label: 'Superficie' },
    { token: '--border', label: 'Borde' },
    { token: '--text', label: 'Texto' },
    { token: '--text-soft', label: 'Texto suave' },
    { token: '--accent', label: 'Acento' },
    { token: '--accent-strong', label: 'Acento fuerte' },
    { token: '--accent-soft', label: 'Acento suave' },
    { token: '--ok', label: 'Acierto' },
    { token: '--bad', label: 'Error' },
    { token: '--star', label: 'Estrella' },
  ];

  protected readonly typeScale: { token: string; label: string; sample: string }[] = [
    { token: '--fs-3xl', label: 'Número gigante', sample: '7' },
    { token: '--fs-2xl', label: 'Título de pantalla', sample: 'Conoce Do' },
    { token: '--fs-xl', label: 'Título', sample: 'Posición de Do' },
    { token: '--fs-lg', label: 'Subtítulo', sample: 'Tu primera nota' },
    { token: '--fs-base', label: 'Cuerpo (base ≥17px)', sample: 'Busca Do a la izquierda de las dos teclas negras.' },
    { token: '--fs-sm', label: 'Secundario', sample: 'Dedo 1 · pulgar' },
    { token: '--fs-xs', label: 'Etiqueta', sample: 'UNIDAD 1' },
  ];

  protected readonly icons: IconName[] = [
    'note', 'mic', 'midi', 'screen', 'keyboard', 'check', 'close', 'flame',
    'star', 'star-fill', 'bolt', 'play', 'ear', 'staff', 'left', 'right',
    'settings', 'lock', 'heart', 'volume', 'repeat', 'sparkle',
  ];

  protected readonly staffNotes = [C4, E4, G4, A4, C5];
  protected readonly spacing = ['--sp-1', '--sp-2', '--sp-3', '--sp-4', '--sp-5', '--sp-6', '--sp-7', '--sp-8'];
  protected readonly radii = ['--r-sm', '--r-md', '--r-lg', '--r-xl', '--r-pill'];

  protected setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
    const root = document.documentElement;
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
  }

  protected bump(): void {
    this.progress.update((v) => (v >= 1 ? 0 : Math.round((v + 0.2) * 10) / 10));
  }
}
