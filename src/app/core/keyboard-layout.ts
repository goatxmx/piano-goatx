import { isBlack, noteName } from './notes';

export interface KeyGeo {
  midi: number;
  label: string;
  aria: string;
  leftPct: number;   // borde izquierdo en % del ancho total
  widthPct: number;  // ancho en %
  black: boolean;
}

export interface KeyboardLayout {
  keys: KeyGeo[];           // blancas + negras
  whites: KeyGeo[];
  blacks: KeyGeo[];
  byMidi: Record<number, KeyGeo>;
  whiteCount: number;
}

function ariaName(midi: number): string {
  return noteName(midi).replace('♯', ' sostenido');
}

/**
 * Geometría compartida del teclado (posición en %). La usan tanto el
 * componente `piano-keyboard` como el modo libre (notas que caen), para que
 * las notas queden perfectamente alineadas con las teclas.
 */
export function keyboardLayout([lo, hi]: [number, number]): KeyboardLayout {
  const whitesMidi: number[] = [];
  const all: number[] = [];
  for (let m = lo; m <= hi; m++) {
    all.push(m);
    if (!isBlack(m)) whitesMidi.push(m);
  }
  const n = Math.max(1, whitesMidi.length);
  const wPct = 100 / n;
  const bPct = wPct * 0.62;

  const whites: KeyGeo[] = whitesMidi.map((midi, i) => ({
    midi, label: noteName(midi), aria: ariaName(midi),
    leftPct: i * wPct, widthPct: wPct, black: false,
  }));

  const blacks: KeyGeo[] = [];
  for (const midi of all) {
    if (!isBlack(midi)) continue;
    const leftWhite = whitesMidi.findIndex((w) => w === midi - 1);
    const center = (leftWhite + 1) * wPct;
    blacks.push({
      midi, label: noteName(midi), aria: ariaName(midi),
      leftPct: center - bPct / 2, widthPct: bPct, black: true,
    });
  }

  const keys = [...whites, ...blacks];
  const byMidi: Record<number, KeyGeo> = {};
  for (const k of keys) byMidi[k.midi] = k;

  return { keys, whites, blacks, byMidi, whiteCount: n };
}
