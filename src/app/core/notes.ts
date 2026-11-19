// Utilidades de notas musicales (MIDI <-> nombre en solfeo)

export const NOTE_NAMES = ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];

/** Nombre sin octava: 60 -> "Do" */
export function noteName(midi: number): string {
  return NOTE_NAMES[((midi % 12) + 12) % 12];
}

/** Nombre con octava (Do central = Do4): 60 -> "Do4" */
export function noteNameOctave(midi: number): string {
  return `${noteName(midi)}${Math.floor(midi / 12) - 1}`;
}

export function isBlack(midi: number): boolean {
  return [1, 3, 6, 8, 10].includes(((midi % 12) + 12) % 12);
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Frecuencia -> número MIDI (con decimales; redondea tú) */
export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function samePitchClass(a: number, b: number): boolean {
  return ((a - b) % 12 + 12) % 12 === 0;
}

// Atajos legibles para escribir lecciones
export const C4 = 60, D4 = 62, E4 = 64, F4 = 65, G4 = 67, A4 = 69, B4 = 71, C5 = 72;
