import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/article-list/article-list.component').then(m => m.ArticleListComponent)
  },
  {
    path: 'article/:id',
    loadComponent: () => import('./components/article-viewer/article-viewer.component').then(m => m.ArticleViewerComponent)
  },
  {
    path: 'help',
    loadComponent: () => import('./components/help/help.component').then(m => m.HelpComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
