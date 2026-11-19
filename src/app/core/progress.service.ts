import { Injectable, computed, signal } from '@angular/core';

interface ProgressData {
  xp: number;
  completed: Record<string, { stars: number; best: number }>;
  streak: number;
  lastDay: string | null; // YYYY-MM-DD
  settings: { anyOctave: boolean; showLabels: boolean; unlockAll: boolean };
}

const KEY = 'piano-goat-progress-v1';

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

/** Progreso guardado en el navegador (sin cuentas, sin servidor). */
@Injectable({ providedIn: 'root' })
export class ProgressService {
  private data = signal<ProgressData>(this.load());

  readonly xp = computed(() => this.data().xp);
  readonly completed = computed(() => this.data().completed);
  readonly settings = computed(() => this.data().settings);
  /** Racha visible: si faltaste más de un día, ya se perdió */
  readonly streak = computed(() => {
    const { streak, lastDay } = this.data();
    if (!lastDay) return 0;
    return daysBetween(lastDay, today()) <= 1 ? streak : 0;
  });
  readonly practicedToday = computed(() => this.data().lastDay === today());

  isDone(id: string): boolean { return !!this.data().completed[id]; }

  completeLesson(id: string, accuracy: number): { xp: number; stars: number } {
    const stars = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : 1;
    const xp = 10 + (stars === 3 ? 5 : 0);
    this.update((d) => {
      const prev = d.completed[id];
      d.completed[id] = { stars: Math.max(stars, prev?.stars ?? 0), best: Math.max(accuracy, prev?.best ?? 0) };
      d.xp += xp;
      const t = today();
      if (d.lastDay !== t) {
        d.streak = d.lastDay && daysBetween(d.lastDay, t) === 1 ? d.streak + 1 : 1;
        d.lastDay = t;
      }
    });
    return { xp, stars };
  }

  setSetting<K extends keyof ProgressData['settings']>(key: K, value: ProgressData['settings'][K]): void {
    this.update((d) => { d.settings[key] = value; });
  }

  reset(): void {
    localStorage.removeItem(KEY);
    this.data.set(this.load());
  }

  private update(fn: (d: ProgressData) => void): void {
    const copy: ProgressData = structuredClone(this.data());
    fn(copy);
    this.data.set(copy);
    try { localStorage.setItem(KEY, JSON.stringify(copy)); } catch { /* modo privado */ }
  }

  private load(): ProgressData {
    const fallback: ProgressData = {
      xp: 0, completed: {}, streak: 0, lastDay: null,
      // unlockAll en true durante pruebas (ver §10). Antes del lanzamiento: false.
      settings: { anyOctave: true, showLabels: true, unlockAll: true },
    };
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<ProgressData>;
      return {
        ...fallback,
        ...parsed,
        settings: { ...fallback.settings, ...(parsed.settings ?? {}) },
      };
    } catch { return fallback; }
  }
}
