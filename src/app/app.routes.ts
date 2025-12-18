import { Routes } from '@angular/router';
import { SavedLocationsComponent } from './saved-locations/saved-locations';

export const routes: Routes = [
  { path: 'saved-locations', component: SavedLocationsComponent },
  { path: '', redirectTo: '/', pathMatch: 'full' }
];
