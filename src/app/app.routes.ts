import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
    title: 'Piano GoatX · Aprende piano',
  },
  {
    path: 'setup',
    loadComponent: () => import('./features/setup/setup').then((m) => m.Setup),
    title: 'Elige cómo tocar · Piano GoatX',
  },
  {
    path: 'leccion/:id',
    loadComponent: () => import('./features/lesson/lesson').then((m) => m.LessonPlayer),
    title: 'Lección · Piano GoatX',
  },
  {
    path: 'completado',
    loadComponent: () => import('./features/complete/complete').then((m) => m.Complete),
    title: '¡Lección terminada! · Piano GoatX',
  },
  {
    path: 'estilos',
    loadComponent: () => import('./features/estilos/estilos').then((m) => m.Estilos),
    title: 'Estilos · Piano GoatX',
  },
  { path: '**', redirectTo: '' },
];
