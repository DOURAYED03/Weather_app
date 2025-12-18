import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SavedLocation {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  addedAt: Date;
  isFavorite?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LocationsService {
  private readonly STORAGE_KEY = 'weather-app-saved-locations';
  private locationsSubject = new BehaviorSubject<SavedLocation[]>([]);
  public locations$ = this.locationsSubject.asObservable();

  constructor() {
    this.loadLocations();
  }

  // CREATE: Add new location
  addLocation(location: Omit<SavedLocation, 'id' | 'addedAt'>): void {
    const newLocation: SavedLocation = {
      ...location,
      id: this.generateId(),
      addedAt: new Date()
    };

    const currentLocations = this.locationsSubject.value;
    const updatedLocations = [...currentLocations, newLocation];

    this.saveLocations(updatedLocations);
    this.locationsSubject.next(updatedLocations);
  }

  // READ: Get all locations
  getLocations(): Observable<SavedLocation[]> {
    return this.locations$;
  }

  // READ: Get location by ID
  getLocationById(id: string): SavedLocation | undefined {
    return this.locationsSubject.value.find(loc => loc.id === id);
  }

  // UPDATE: Modify existing location
  updateLocation(id: string, updates: Partial<Omit<SavedLocation, 'id' | 'addedAt'>>): void {
    const currentLocations = this.locationsSubject.value;
    const locationIndex = currentLocations.findIndex(loc => loc.id === id);

    if (locationIndex !== -1) {
      const updatedLocation = { ...currentLocations[locationIndex], ...updates };
      const updatedLocations = [...currentLocations];
      updatedLocations[locationIndex] = updatedLocation;

      this.saveLocations(updatedLocations);
      this.locationsSubject.next(updatedLocations);
    }
  }

  // DELETE: Remove location
  removeLocation(id: string): void {
    const currentLocations = this.locationsSubject.value;
    const updatedLocations = currentLocations.filter(loc => loc.id !== id);

    this.saveLocations(updatedLocations);
    this.locationsSubject.next(updatedLocations);
  }

  // DELETE: Clear all locations
  clearAllLocations(): void {
    this.saveLocations([]);
    this.locationsSubject.next([]);
  }

  private loadLocations(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const locations = JSON.parse(stored);
        // Convert addedAt back to Date objects
        const locationsWithDates = locations.map((loc: any) => ({
          ...loc,
          addedAt: new Date(loc.addedAt)
        }));
        this.locationsSubject.next(locationsWithDates);
      }
    } catch (error) {
      console.error('Error loading locations from localStorage:', error);
      this.locationsSubject.next([]);
    }
  }

  private saveLocations(locations: SavedLocation[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(locations));
    } catch (error) {
      console.error('Error saving locations to localStorage:', error);
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
