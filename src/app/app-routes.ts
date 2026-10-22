import { Routes } from '@angular/router';

/**
 * Defines the application routes.
 */
export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./tabs/tabs-routes').then(m => m.routes)
  },
];
