import { A4, B4, C4, C5, D4, E4, F4, G4 } from '../core/notes';

/**
 * Tipos de ejercicio:
 *  learn          -> presenta una nota nueva (se ilumina) y hay que tocarla
 *  play           -> toca la nota que se pide (con o sin pista)
 *  melody         -> toca una secuencia en orden
 *  listen-repeat  -> la app toca, tú repites de oído/memoria
 *  quiz-name      -> se ilumina una tecla y eliges su nombre (no requiere piano)
 *  read-staff     -> la nota aparece en el pentagrama y la tocas (desde Unidad 2)
 */
export type StepType = 'learn' | 'play' | 'melody' | 'listen-repeat' | 'quiz-name' | 'read-staff';

export interface Step {
  type: StepType;
  notes: number[];
  text?: string;
  /** Mostrar la tecla iluminada como pista */
  hint?: boolean;
  /** read-staff: mostrar también el nombre debajo de la nota */
  showName?: boolean;
  /** Opciones para quiz-name */
  options?: number[];
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  range: [number, number];
  steps: Step[];
}

export interface Unit { id: string; title: string; description: string; lessons: Lesson[]; }

const R1: [number, number] = [C4, C5];

// Helper: repetir "toca X" varias veces, mezclando
const plays = (notes: number[], hint = true): Step[] => notes.map((n) => ({ type: 'play' as const, notes: [n], hint }));

export const UNITS: Unit[] = [
  {
    id: 'u1',
    title: 'Unidad 1 · Posición de Do',
    description: 'Tus primeras 5 notas con la mano derecha',
    lessons: [
      {
        id: 'u1-l1', title: 'Conoce Do', emoji: '🎹', range: R1,
        steps: [
          { type: 'learn', notes: [C4], text: 'Esta es Do. Búscala a la izquierda de las dos teclas negras. Tócala con el pulgar (dedo 1).' },
          ...plays([C4, C4, C4]),
          { type: 'quiz-name', notes: [C4], options: [C4, D4, G4] },
          ...plays([C4, C4], false),
        ],
      },
      {
        id: 'u1-l2', title: 'Re', emoji: '🎵', range: R1,
        steps: [
          { type: 'learn', notes: [D4], text: 'Re está justo a la derecha de Do, entre las dos teclas negras. Dedo 2.' },
          ...plays([D4, C4, D4, D4, C4]),
          { type: 'quiz-name', notes: [D4], options: [C4, D4, E4] },
          { type: 'melody', notes: [C4, D4, C4, D4], hint: true, text: 'Alterna Do y Re' },
        ],
      },
      {
        id: 'u1-l3', title: 'Mi', emoji: '✨', range: R1,
        steps: [
          { type: 'learn', notes: [E4], text: 'Mi está a la derecha de las dos teclas negras. Dedo 3.' },
          ...plays([E4, D4, E4, C4, E4]),
          { type: 'quiz-name', notes: [E4], options: [D4, E4, F4] },
          { type: 'melody', notes: [C4, D4, E4], hint: true, text: 'Sube: Do, Re, Mi' },
        ],
      },
      {
        id: 'u1-l4', title: 'Repaso Do-Re-Mi', emoji: '🧠', range: R1,
        steps: [
          { type: 'quiz-name', notes: [D4], options: [C4, D4, E4] },
          { type: 'quiz-name', notes: [C4], options: [C4, D4, E4] },
          { type: 'quiz-name', notes: [E4], options: [C4, D4, E4] },
          ...plays([E4, C4, D4], false),
          { type: 'melody', notes: [E4, D4, C4], hint: false, text: 'Baja: Mi, Re, Do' },
          { type: 'listen-repeat', notes: [C4, D4, E4, D4, C4] },
        ],
      },
      {
        id: 'u1-l5', title: 'Fa', emoji: '🌱', range: R1,
        steps: [
          { type: 'learn', notes: [F4], text: 'Fa está a la izquierda de las tres teclas negras. Dedo 4.' },
          ...plays([F4, E4, F4, D4, F4]),
          { type: 'quiz-name', notes: [F4], options: [E4, F4, G4] },
          { type: 'melody', notes: [C4, D4, E4, F4], hint: true },
        ],
      },
      {
        id: 'u1-l6', title: 'Sol', emoji: '☀️', range: R1,
        steps: [
          { type: 'learn', notes: [G4], text: 'Sol va después de Fa. Dedo 5 (meñique). ¡Ya tienes la mano completa!' },
          ...plays([G4, F4, G4, C4, G4]),
          { type: 'quiz-name', notes: [G4], options: [F4, G4, A4] },
          { type: 'melody', notes: [C4, D4, E4, F4, G4], hint: true, text: 'La escalera completa' },
          { type: 'melody', notes: [G4, F4, E4, D4, C4], hint: true, text: 'Y de bajada' },
        ],
      },
      {
        id: 'u1-l7', title: 'Repaso de la mano', emoji: '🖐️', range: R1,
        steps: [
          { type: 'quiz-name', notes: [F4], options: [D4, F4, G4] },
          { type: 'quiz-name', notes: [D4], options: [C4, D4, E4] },
          { type: 'quiz-name', notes: [G4], options: [E4, F4, G4] },
          ...plays([G4, D4, F4, C4, E4], false),
          { type: 'melody', notes: [C4, E4, G4], hint: false, text: 'Saltando: Do, Mi, Sol' },
        ],
      },
      {
        id: 'u1-l8', title: 'Escucha y repite', emoji: '👂', range: R1,
        steps: [
          { type: 'listen-repeat', notes: [C4, D4, E4] },
          { type: 'listen-repeat', notes: [E4, F4, G4] },
          { type: 'listen-repeat', notes: [G4, E4, C4] },
          { type: 'listen-repeat', notes: [C4, C4, G4, G4] },
        ],
      },
      {
        id: 'u1-l9', title: 'Himno de la alegría (1)', emoji: '🎶', range: R1,
        steps: [
          { type: 'listen-repeat', notes: [E4, E4, F4, G4] },
          { type: 'melody', notes: [E4, E4, F4, G4, G4, F4, E4, D4], hint: true, text: 'Primera frase' },
          { type: 'melody', notes: [C4, C4, D4, E4, E4, D4, D4], hint: true, text: 'Segunda frase' },
        ],
      },
      {
        id: 'u1-l10', title: 'Himno de la alegría (2)', emoji: '🏆', range: R1,
        steps: [
          { type: 'melody', notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, E4, D4, D4], hint: true, text: 'Todo junto, con pista' },
          { type: 'melody', notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, D4, C4, C4], hint: false, text: 'Ahora sin pista. ¡Tú puedes!' },
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: 'Unidad 2 · Toda la octava y el pentagrama',
    description: 'La, Si, Do agudo y tus primeras notas escritas',
    lessons: [
      {
        id: 'u2-l0', title: 'Conoce el pentagrama', emoji: '📜', range: R1,
        steps: [
          { type: 'read-staff', notes: [C4], showName: true, text: 'Las notas se escriben en 5 líneas. Do central va en una rayita abajo del pentagrama.' },
          { type: 'read-staff', notes: [E4], showName: true, text: 'Mi va sobre la primera línea.' },
          { type: 'read-staff', notes: [G4], showName: true, text: 'Sol va sobre la segunda línea.' },
          { type: 'read-staff', notes: [D4], showName: true },
          { type: 'read-staff', notes: [F4], showName: true },
          { type: 'read-staff', notes: [C4] },
          { type: 'read-staff', notes: [E4] },
          { type: 'read-staff', notes: [G4] },
        ],
      },
      {
        id: 'u2-l1', title: 'La', emoji: '🎼', range: R1,
        steps: [
          { type: 'learn', notes: [A4], text: 'La está entre la 2ª y 3ª tecla negra del grupo de tres.' },
          ...plays([A4, G4, A4, F4, A4]),
          { type: 'quiz-name', notes: [A4], options: [G4, A4, B4] },
          { type: 'read-staff', notes: [A4], showName: true, text: 'La va en el segundo espacio.' },
          { type: 'read-staff', notes: [F4] },
          { type: 'read-staff', notes: [A4] },
        ],
      },
      {
        id: 'u2-l2', title: 'Si y Do agudo', emoji: '🔝', range: R1,
        steps: [
          { type: 'learn', notes: [B4], text: 'Si está a la derecha de las tres teclas negras.' },
          { type: 'learn', notes: [C5], text: 'Y luego viene otra vez Do, pero más agudo. ¡Las notas se repiten!' },
          ...plays([B4, C5, A4, B4]),
          { type: 'melody', notes: [C4, D4, E4, F4, G4, A4, B4, C5], hint: true, text: 'La escala de Do completa' },
          { type: 'read-staff', notes: [B4], showName: true, text: 'Si va sobre la tercera línea, justo a la mitad.' },
          { type: 'read-staff', notes: [C5], showName: true },
          { type: 'read-staff', notes: [G4] },
          { type: 'read-staff', notes: [B4] },
        ],
      },
      {
        id: 'u2-l3', title: 'Estrellita', emoji: '⭐', range: R1,
        steps: [
          { type: 'listen-repeat', notes: [C4, C4, G4, G4, A4, A4, G4] },
          { type: 'melody', notes: [C4, C4, G4, G4, A4, A4, G4, F4, F4, E4, E4, D4, D4, C4], hint: true },
        ],
      },
    ],
  },
];

export const ALL_LESSONS = UNITS.flatMap((u) => u.lessons);
export const findLesson = (id: string) => ALL_LESSONS.find((l) => l.id === id);
