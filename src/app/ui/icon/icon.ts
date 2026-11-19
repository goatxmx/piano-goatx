import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export type IconName =
  | 'note' | 'mic' | 'midi' | 'screen' | 'keyboard'
  | 'check' | 'close' | 'flame' | 'star' | 'star-fill' | 'bolt'
  | 'play' | 'ear' | 'staff' | 'left' | 'right' | 'settings'
  | 'lock' | 'heart' | 'volume' | 'repeat' | 'sparkle';

// Trazo consistente (2px sobre viewBox 24, caps/uniones redondeadas).
// Iconos de relleno marcan su propio fill.
const ICONS: Record<IconName, string> = {
  note: '<path d="M9 18V6l10-2v10"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="14" r="2.5"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  midi: '<rect x="3" y="7" width="18" height="12" rx="3"/><path d="M8 7V4h8v3M7 13h.01M17 13h.01"/><circle cx="12" cy="13" r="1.4"/>',
  screen: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M3 12h18M9 5v12M15 5v12M8 21h8"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 6v8M13 6v8M18 6v8"/>',
  check: '<path d="M5 13l4 4L19 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  flame: '<path fill="currentColor" stroke="none" d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c2 1 4 3 4 6a6 6 0 0 1-12 0c0-4 4-6 6-13z"/>',
  star: '<path d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8z"/>',
  'star-fill': '<path fill="currentColor" stroke="none" d="M12 3l2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.3l6-.8z"/>',
  bolt: '<path fill="currentColor" stroke="none" d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  play: '<path fill="currentColor" stroke="none" d="M7 4.5v15l12-7.5z"/>',
  ear: '<path d="M7 9a5 5 0 0 1 10 0c0 3-3 3.5-3 6a2.5 2.5 0 0 1-5 0M9 9a3 3 0 0 1 6 0"/>',
  staff: '<path d="M3 6h18M3 10h18M3 14h18M3 18h18"/><circle cx="16" cy="14" r="2" fill="currentColor" stroke="none"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  heart: '<path fill="currentColor" stroke="none" d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9H4zM17 9a4 4 0 0 1 0 6"/>',
  repeat: '<path d="M4 9a5 5 0 0 1 5-5h8l-2-2m2 2l-2 2M20 15a5 5 0 0 1-5 5H7l2 2m-2-2l2-2"/>',
  sparkle: '<path fill="currentColor" stroke="none" d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z"/><path fill="currentColor" stroke="none" d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8z"/>',
};

@Component({
  selector: 'ui-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
    [style.width.px]="size()" [style.height.px]="size()" [innerHTML]="svg()"></svg>`,
  styles: `:host { display: inline-flex; line-height: 0; }`,
})
export class Icon {
  private san = inject(DomSanitizer);
  readonly name = input.required<IconName>();
  readonly size = input(24);
  protected svg = computed<SafeHtml>(() =>
    this.san.bypassSecurityTrustHtml(ICONS[this.name()] ?? ''),
  );
}
