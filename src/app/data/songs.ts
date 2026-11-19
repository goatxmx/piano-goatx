import { A4, B4, C4, C5, D4, E4, F4, G4 } from '../core/notes';

/**
 * Canciones para el "modo libre" (notas que caen, estilo Artie/Synthesia).
 * Autoguiado: la canción te espera, tocas a tu ritmo. Solo dominio público.
 * `range`: rango de teclado a mostrar. `notes`: melodía mano derecha.
 */
export interface Song {
  id: string;
  title: string;
  subtitle: string;
  range: [number, number];
  notes: number[];
}

export const SONGS: Song[] = [
  {
    id: 'estrellita',
    title: 'Estrellita',
    subtitle: 'La más fácil para empezar',
    range: [C4, C5],
    notes: [C4, C4, G4, G4, A4, A4, G4, F4, F4, E4, E4, D4, D4, C4],
  },
  {
    id: 'alegria',
    title: 'Himno de la alegría',
    subtitle: 'Beethoven',
    range: [C4, C5],
    notes: [E4, E4, F4, G4, G4, F4, E4, D4, C4, C4, D4, E4, E4, D4, D4, C4],
  },
  {
    id: 'escala-do',
    title: 'Escala de Do',
    subtitle: 'Sube y baja toda la octava',
    range: [C4, C5],
    notes: [C4, D4, E4, F4, G4, A4, B4, C5, B4, A4, G4, F4, E4, D4, C4],
  },
];

export const findSong = (id: string) => SONGS.find((s) => s.id === id);
