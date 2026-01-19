import { Routes } from '@angular/router';
import { Ask } from './pages/ask/ask';

export const routes: Routes = [
  { path: '', component: Ask },
  { path: '**', redirectTo: '' }
];
