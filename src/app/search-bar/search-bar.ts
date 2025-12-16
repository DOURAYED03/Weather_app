import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { debounceTime, Subject } from 'rxjs';

interface CitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule, CommonModule],
  templateUrl: './search-bar.html',
  styleUrl: './search-bar.css',
})
export class SearchBar {
  city: string = '';
  showSuggestions: boolean = false;
  suggestions: CitySuggestion[] = [];
  isLoading: boolean = false;
  showError: boolean = false;
  
  private apiKey = 'daa82813cba09f141a7d265aad49ee8b';
  private searchSubject = new Subject<string>();

  // Fallback cities when API is not available
  private fallbackCities: CitySuggestion[] = [
    { name: 'Tunis', country: 'TN', lat: 36.8, lon: 10.18 },
    { name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 },
    { name: 'London', country: 'GB', lat: 51.51, lon: -0.13 },
    { name: 'New York', country: 'US', state: 'NY', lat: 40.71, lon: -74.01 },
    { name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69 },
    { name: 'Dubai', country: 'AE', lat: 25.27, lon: 55.29 },
    { name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21 },
    { name: 'Berlin', country: 'DE', lat: 52.52, lon: 13.41 },
    { name: 'Rome', country: 'IT', lat: 41.9, lon: 12.5 },
    { name: 'Madrid', country: 'ES', lat: 40.42, lon: -3.7 },
    { name: 'Cairo', country: 'EG', lat: 30.04, lon: 31.24 },
    { name: 'Moscow', country: 'RU', lat: 55.75, lon: 37.62 },
    { name: 'Bangkok', country: 'TH', lat: 13.75, lon: 100.5 },
    { name: 'Seoul', country: 'KR', lat: 37.57, lon: 126.98 },
    { name: 'Mumbai', country: 'IN', lat: 19.08, lon: 72.88 },
    { name: 'Istanbul', country: 'TR', lat: 41.01, lon: 28.98 },
  ];

  @Output() search = new EventEmitter<string>();

  constructor(private http: HttpClient) {
    this.searchSubject.pipe(debounceTime(300)).subscribe(query => {
      this.fetchCitySuggestions(query);
    });
  }

  onSearch() {
    if (!this.city.trim() || this.city.trim().length < 2) return;
    
    this.isLoading = true;
    this.showSuggestions = false;
    
    // Validate city exists via geocoding API
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${this.city}&limit=1&appid=${this.apiKey}`;
    
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.isLoading = false;
        if (data && data.length > 0) {
          // City exists - use the correct name from API
          this.city = data[0].name;
          this.search.emit(data[0].name);
        } else {
          this.showError = true;
          setTimeout(() => this.showError = false, 2000);
        }
      },
      error: () => {
        this.isLoading = false;
        // Fallback: check if it's in our local list
        const fallback = this.fallbackCities.find(c => 
          c.name.toLowerCase() === this.city.toLowerCase()
        );
        if (fallback) {
          this.search.emit(fallback.name);
        } else {
          this.showError = true;
          setTimeout(() => this.showError = false, 2000);
        }
      }
    });
  }

  onInputChange() {
    if (this.city.length >= 2) {
      this.isLoading = true;
      this.searchSubject.next(this.city);
    } else {
      this.showSuggestions = false;
      this.suggestions = [];
    }
  }

  fetchCitySuggestions(query: string) {
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${this.apiKey}`;
    
    this.http.get<any[]>(url).subscribe({
      next: (data) => {
        this.suggestions = data.map(item => ({
          name: item.name,
          country: item.country,
          state: item.state,
          lat: item.lat,
          lon: item.lon
        }));
        this.showSuggestions = this.suggestions.length > 0;
        this.isLoading = false;
      },
      error: () => {
        // Fallback to local filtering
        this.suggestions = this.fallbackCities.filter(c =>
          c.name.toLowerCase().startsWith(query.toLowerCase())
        );
        this.showSuggestions = this.suggestions.length > 0;
        this.isLoading = false;
      }
    });
  }

  onFocus() {
    if (this.city.length === 0) {
      this.suggestions = this.fallbackCities.slice(0, 6);
      this.showSuggestions = true;
    } else if (this.city.length >= 2) {
      this.onInputChange();
    }
  }

  onBlur() {
    setTimeout(() => this.showSuggestions = false, 200);
  }

  selectCity(suggestion: CitySuggestion) {
    this.city = suggestion.name;
    this.showSuggestions = false;
    this.search.emit(suggestion.name);
  }

  getDisplayName(suggestion: CitySuggestion): string {
    if (suggestion.state) {
      return `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`;
    }
    return `${suggestion.name}, ${suggestion.country}`;
  }
}
