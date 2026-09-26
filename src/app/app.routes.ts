import { Routes } from '@angular/router';

// La interfaz vive en AppComponent; esta ruta declara la URL usada por el
// botón «Abrir sistema» para que Angular SSR también pueda resolver /app.
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    children: [],
  },
  {
    path: 'app',
    children: [],
  },
];
