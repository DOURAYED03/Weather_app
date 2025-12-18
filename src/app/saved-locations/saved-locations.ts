import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { LocationsService, SavedLocation } from '../services/locations';
import { WeatherService } from '../services/weather';

@Component({
  selector: 'app-saved-locations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './saved-locations.html',
  styleUrls: ['./saved-locations.css']
})
export class SavedLocationsComponent implements OnInit, OnDestroy {
  locations: SavedLocation[] = [];
  favoriteLocations: SavedLocation[] = [];
  newLocationName = '';
  newLocationCountry = '';
  newFavoriteName = '';
  newFavoriteCountry = '';
  editingLocation: SavedLocation | null = null;
  weatherCache: { [locationId: string]: any } = {};
  private subscriptions: Subscription[] = [];

  constructor(
    private locationsService: LocationsService,
    private weatherService: WeatherService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.locationsService.getLocations().subscribe(locations => {
        // Separate favorites and regular locations
        this.favoriteLocations = locations.filter(loc => loc.isFavorite);
        this.locations = locations.filter(loc => !loc.isFavorite);
        // Load weather data for new locations
        locations.forEach(location => {
          if (!this.weatherCache[location.id]) {
            this.loadWeatherForLocation(location);
          }
        });
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  addLocation(): void {
    if (!this.newLocationName.trim() || !this.newLocationCountry.trim()) {
      return;
    }

    // For simplicity, we'll use the city name to get coordinates
    // In a real app, you'd use a geocoding service
    this.weatherService.getWeather(this.newLocationName).subscribe({
      next: (weatherData) => {
        this.locationsService.addLocation({
          name: this.newLocationName.trim(),
          country: this.newLocationCountry.trim(),
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon
        });
        this.newLocationName = '';
        this.newLocationCountry = '';
      },
      error: (error) => {
        console.error('Error adding location:', error);
        // You could show an error message to the user here
      }
    });
  }

  removeLocation(id: string): void {
    this.locationsService.removeLocation(id);
    delete this.weatherCache[id];
  }

  clearAllLocations(): void {
    if (confirm('Are you sure you want to clear all saved locations?')) {
      this.locationsService.clearAllLocations();
      this.weatherCache = {};
    }
  }

  startEditing(location: SavedLocation): void {
    this.editingLocation = { ...location };
  }

  saveEdit(): void {
    if (this.editingLocation) {
      this.locationsService.updateLocation(this.editingLocation.id, {
        name: this.editingLocation.name,
        country: this.editingLocation.country
      });
      this.editingLocation = null;
    }
  }

  cancelEdit(): void {
    this.editingLocation = null;
  }

  isEditing(location: SavedLocation): boolean {
    return this.editingLocation?.id === location.id;
  }

  getWeatherForLocation(locationId: string): any {
    return this.weatherCache[locationId];
  }

  private loadWeatherForLocation(location: SavedLocation): void {
    this.weatherService.getWeather(location.name).subscribe({
      next: (weatherData) => {
        this.weatherCache[location.id] = weatherData;
      },
      error: (error) => {
        console.error('Error loading weather for location:', location.name, error);
      }
    });
  }

  trackByLocationId(index: number, location: SavedLocation): string {
    return location.id;
  }
  toggleFavorite(location: SavedLocation): void {
    this.locationsService.updateLocation(location.id, {
      isFavorite: !location.isFavorite
    });
  }

  addToFavorites(): void {
    if (!this.newFavoriteName.trim() || !this.newFavoriteCountry.trim()) {
      return;
    }

    // For simplicity, we'll use the city name to get coordinates
    // In a real app, you'd use a geocoding service
    this.weatherService.getWeather(this.newFavoriteName).subscribe({
      next: (weatherData) => {
        this.locationsService.addLocation({
          name: this.newFavoriteName.trim(),
          country: this.newFavoriteCountry.trim(),
          lat: weatherData.coord.lat,
          lon: weatherData.coord.lon,
          isFavorite: true
        });
        this.newFavoriteName = '';
        this.newFavoriteCountry = '';
      },
      error: (error) => {
        console.error('Error adding favorite location:', error);
        // You could show an error message to the user here
      }
    });
  }

  removeFromFavorites(location: SavedLocation): void {
    if (confirm(`Are you sure you want to remove ${location.name}, ${location.country} from favorites?`)) {
      this.locationsService.removeLocation(location.id);
      delete this.weatherCache[location.id];
    }
  }
}
