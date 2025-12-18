import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { WeatherChart } from './weather-chart/weather-chart';
import { WeatherService } from './services/weather';
import { LocationsService, SavedLocation } from './services/locations';
@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, Navbar, WeatherChart],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  weather: any;
  forecast: any[] = [];
  showCitySelector: boolean = false;
  selectedDay: string = new Date().toDateString();
  currentTime: string = '';
  currentFullDate: string = '';
  isNight: boolean = false;
  backgroundVideo: string = '/assets/background.mp4';
  locations: any[] = [];

  updateDateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.currentFullDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Check if night (between 7 PM and 6 AM)
    const hour = now.getHours();
    const wasNight = this.isNight;
    this.isNight = hour >= 19 || hour < 6;
    
    if (wasNight !== this.isNight) {
      this.backgroundVideo = this.isNight ? '/assets/background-2.mp4' : '/assets/background.mp4';
      this.saveVideoTime();
    }
  }

  saveVideoTime() {
    const video = document.querySelector('.background-video') as HTMLVideoElement;
    if (video && !video.paused) {
      const key = this.isNight ? 'videoTime_night' : 'videoTime_day';
      localStorage.setItem(key, video.currentTime.toString());
    }
  }

  restoreVideoTime() {
    const video = document.querySelector('.background-video') as HTMLVideoElement;
    if (video) {
      const savedTime = localStorage.getItem('videoTime_' + (this.isNight ? 'night' : 'day'));
      if (savedTime) {
        video.currentTime = parseFloat(savedTime);
      }
      // Ensure video plays
      video.play().catch(() => {});
      // Save time periodically
      setInterval(() => this.saveVideoTime(), 1000);
    }
  }

  constructor(private weatherService: WeatherService, private locationsService: LocationsService) {}

  ngOnInit() {
    this.onSearch('Tunis');
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);

    // Set initial background based on time
    const hour = new Date().getHours();
    this.isNight = hour >= 19 || hour < 6;
    this.backgroundVideo = this.isNight ? '/assets/background-2.mp4' : '/assets/background.mp4';

    // Restore video position after a small delay
    setTimeout(() => this.restoreVideoTime(), 500);

    // Save video time before page unload
    window.addEventListener('beforeunload', () => this.saveVideoTime());

    // Save when tab becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.saveVideoTime();
      }
    });

    // Subscribe to locations
    this.locationsService.getLocations().subscribe(locations => {
      this.locations = locations.filter(loc => loc.isFavorite);
    });
  }

  onSearch(city: string) {
    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        console.log('Weather data:', data);
        this.weather = data;
      },
      error: (err) => {
        console.error('Weather API error:', err);
      }
    });
    this.weatherService.getForecast(city).subscribe({
      next: (data) => {
        console.log('Forecast data:', data);
        this.forecast = data.list.map((item: any) => ({
          temp: Math.round(item.main.temp),
          time: item.dt_txt
        }));
      },
      error: (err) => {
        console.error('Forecast API error:', err);
      }
    });
  }

  getDailyForecast() {
    const result = [];
    const today = new Date();
    const daily: { [key: string]: number[] } = {};
    
    // Group forecast data by date
    if (this.forecast && this.forecast.length > 0) {
      this.forecast.forEach(item => {
        const date = new Date(item.time.replace(' ', 'T')).toDateString();
        if (!daily[date]) daily[date] = [];
        daily[date].push(item.temp);
      });
    }
    
    // Generate 7 days starting from today
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toDateString();
      const isToday = i === 0;
      
      if (daily[dateStr] && daily[dateStr].length > 0) {
        const temps = daily[dateStr];
        const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length;
        result.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: Math.round(avgTemp),
          isToday,
          date: dateStr,
          hasData: true
        });
      } else {
        result.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: null,
          isToday,
          date: dateStr,
          hasData: false
        });
      }
    }
    
    return result;
  }

  toggleCitySelector() {
    this.showCitySelector = !this.showCitySelector;
  }

  onCitySelect(event: any) {
    const city = event.target.value;
    if (city) {
      this.onSearch(city);
      this.showCitySelector = false;
    }
  }

  selectDay(day: string) {
    this.selectedDay = day;
  }

  onVideoLoaded(event: Event) {
    const video = event.target as HTMLVideoElement;
    const key = this.isNight ? 'videoTime_night' : 'videoTime_day';
    const savedTime = localStorage.getItem(key);
    console.log('Restoring video time:', savedTime);

    if (savedTime) {
      const time = parseFloat(savedTime);
      // Wait for video to be ready, then set time
      video.addEventListener('canplay', () => {
        if (video.currentTime < 1) { // Only set if not already set
          video.currentTime = time;
        }
      }, { once: true });
      video.currentTime = time;
    }

    video.play().catch(() => {});
  }

  addCurrentLocationToFavorites() {
    if (this.weather) {
      // Check if this location is already in favorites
      const isAlreadyFavorite = this.locations.some(loc =>
        loc.name === this.weather.name && loc.country === this.weather.country && loc.isFavorite
      );

      if (isAlreadyFavorite) {
        alert('This location is already in favorites');
        return;
      }

      this.locationsService.addLocation({
        name: this.weather.name,
        country: this.weather.country,
        lat: this.weather.coord.lat,
        lon: this.weather.coord.lon,
        isFavorite: true
      });
    }
  }

  selectFavoriteLocation(location: any) {
    this.onSearch(location.name);
  }

  removeFavoriteLocation(location: any) {
    if (confirm(`Are you sure you want to remove ${location.name}, ${location.country} from favorites?`)) {
      this.locationsService.removeLocation(location.id);
    }
  }

  get isCurrentLocationFavorite(): boolean {
    if (!this.weather) return false;
    return this.locations.some(loc =>
      loc.name === this.weather.name &&
      loc.country === this.weather.country &&
      loc.isFavorite
    );
  }
}
