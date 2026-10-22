import { Routes } from '@angular/router';

import { TabsPage } from './tabs.page';

/**
 * Defines the routes for the tabs component.
 */
export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'main',
        loadComponent: () =>
          import('../main/main.page').then(
            (m) => m.MainPage
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../settings/settings.page').then(
            (m) => m.SettingsPage
          ),
      },
      {
        path: '',
        redirectTo: 'main',
        pathMatch: 'full',
      },
    ],
  },
    {
    path: '',
    redirectTo: '/tabs/main',
    pathMatch: 'full',
  },
];