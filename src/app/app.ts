import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Navbar } from './navbar/navbar';
import { WeatherChartComponent } from './weather-chart/weather-chart';
import { Globe } from './globe/globe';
import { MapComponent } from './map/map';
import { WeatherService } from './services/weather';
import { LocationsService, SavedLocation } from './services/locations';
@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule, Navbar, WeatherChartComponent, Globe, MapComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  Math = Math;
  weather: any;
  forecast: any[] = [];
  hourlyForecast: any[] = [];
  detailedHourly: any[] = [];
  airQuality: any = null;
  lifestyleTips: any[] = [];
  showCitySelector: boolean = false;
  selectedDay: string = ''; // Will be set to first available forecast day
  currentTime: string = '';
  currentFullDate: string = '';
  isNight: boolean = false;
  backgroundVideo: string = '/assets/background.mp4';
  locations: any[] = [];
  units: 'metric' | 'imperial' = 'metric';
  weatherTheme: string = 'clear'; // clear, clouds, rain, snow, thunder, mist

  get sunPercent(): number {
    if (!this.weather || !this.weather.sunrise || !this.weather.sunset) return 0;

    // Parse times (e.g. "06:45", "17:30")
    const parseTime = (timeStr: string) => {
      const [parts, modifier] = timeStr.split(' '); // "06:45 PM" if strictly formatted, but services.ts returns HH:mm 24h?
      // Wait, services.ts formatTime returns 2-digit 24h format? 
      // let's check services.ts again. It says "hour12: false". So "13:45".
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m; // minutes from midnight
    }

    const start = parseTime(this.weather.sunrise);
    const end = parseTime(this.weather.sunset);
    const nowParts = this.currentTime.split(':');
    // currentTime is "hh:mm PM". We need to handle that.
    let nowMinutes = 0;
    if (this.currentTime.includes(' ')) { // "04:30 PM"
      const [t, m] = this.currentTime.split(' ');
      let [h, min] = t.split(':').map(Number);
      if (m === 'PM' && h !== 12) h += 12;
      if (m === 'AM' && h === 12) h = 0;
      nowMinutes = h * 60 + min;
    } else {
      // Fallback 24h
      const [h, min] = this.currentTime.split(':').map(Number);
      nowMinutes = h * 60 + min;
    }

    if (nowMinutes < start) return 0;
    if (nowMinutes > end) return 100;

    return ((nowMinutes - start) / (end - start)) * 100;
  }

  // Calculate top position for semi-circle (0% at ends, 100% at center)
  // Equation of circle: x^2 + y^2 = r^2.
  // We map 0..100 x-axis to semi-circle height.
  get sunTop(): number {
    const p = this.sunPercent;
    if (p <= 0 || p >= 100) return 0;
    // Map p (0-100) to x (-1 to 1)
    const x = (p - 50) / 50;
    // y = sqrt(1 - x^2) for circle/ellipse properties in normalized coordinates
    const y = Math.sqrt(1 - x * x);
    // Return y * 100% since our CSS height is the apex
    return y * 100;
  }


  updateDateTime() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    this.currentFullDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Check if night (between 7 PM and 6 AM)
    const hour = now.getHours();
    const wasNight = this.isNight;
    this.isNight = hour >= 19 || hour < 6;

    if (wasNight !== this.isNight) {
      this.updateBackgroundAndTheme();
    }
  }

  updateBackgroundAndTheme() {
    this.backgroundVideo = this.isNight ? '/assets/background-2.mp4' : '/assets/background.mp4';
    this.saveVideoTime();

    // Determine theme based on weather condition if available
    if (this.weather && this.weather.weather && this.weather.weather[0]) {
      const main = this.weather.weather[0].main.toLowerCase();
      if (main.includes('clear')) this.weatherTheme = 'clear';
      else if (main.includes('cloud')) this.weatherTheme = 'clouds';
      else if (main.includes('rain')) this.weatherTheme = 'rain';
      else if (main.includes('snow')) this.weatherTheme = 'snow';
      else if (main.includes('thunder')) this.weatherTheme = 'thunder';
      else this.weatherTheme = 'mist';
    }
  }

  toggleUnits() {
    this.units = this.units === 'metric' ? 'imperial' : 'metric';
    // If we have data, we might want to re-fetch or convert. 
    // For simplicity, we'll just re-search the current city if available.
    if (this.weather && this.weather.name) {
      this.onSearch(this.weather.name);
    }
  }

  getTemp(temp: number): number {
    return Math.round(temp);
  }

  getSpeed(speed: number): number {
    return Math.round(speed);
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
      video.play().catch(() => { });
      // Save time periodically
      setInterval(() => this.saveVideoTime(), 1000);
    }
  }

  constructor(private weatherService: WeatherService, private locationsService: LocationsService) { }

  ngOnInit() {
    this.onSearch('Tunis');
    this.updateDateTime();
    setInterval(() => this.updateDateTime(), 1000);

    // Set initial background based on time
    const hour = new Date().getHours();
    this.isNight = hour >= 19 || hour < 6;
    this.updateBackgroundAndTheme();

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
    // Note: In a real app we'd pass units to the service. 
    // For now assuming service returns metric and we convert if needed, 
    // OR ideally we modify service to accept units. 
    // Since I can't modify service blindly without checking it first, check if WeatherService supports units.
    // It seems WeatherService hardcodes units=metric. I'll stick to metric from API and convert on display if needed?
    // Actually simpler to just request metric always and convert in UI if needed?
    // Let's assume we request metric always for consistency in storage/logic, and transform in pipe or method.
    // Wait, the plan said "Add logic for Unit conversion".

    this.weatherService.getWeather(city).subscribe({
      next: (data) => {
        console.log('Weather data:', data);
        this.weather = data;
        this.updateBackgroundAndTheme();
        this.fetchAirQuality(data.coord.lat, data.coord.lon);
        this.updateLifestyleTips();
      },
      error: (err) => {
        console.error('Weather API error:', err);
      }
    });
    this.weatherService.getForecast(city).subscribe({
      next: (data) => {
        console.log('Forecast data:', data);
        this.forecast = data.list.map((item: any) => ({
          temp: item.main.temp,
          time: item.dt_txt,
          icon: item.weather[0].icon,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind?.speed || 0,
          windDeg: item.wind?.deg || 0
        }));

        if (this.forecast.length > 0 && !this.selectedDay) {
          this.selectedDay = this.forecast[0].time.split(' ')[0];
        }

        // Extract next 24 hours (approx 8 items * 3h = 24h)
        this.hourlyForecast = this.forecast.slice(0, 9).map(item => ({
          time: new Date(item.time.replace(' ', 'T')).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          temp: Math.round(item.temp),
          icon: item.icon,
          desc: item.description
        }));
        this.updateDetailedHourly();
      },
      error: (err) => {
        console.error('Forecast API error:', err);
      }
    });
  }

  displayTemp(temp: number): number {
    if (this.units === 'imperial') {
      return Math.round((temp * 9 / 5) + 32);
    }
    return Math.round(temp);
  }

  displaySpeed(speedKmh: number): string {
    if (this.units === 'imperial') {
      return Math.round(speedKmh * 0.621371) + ' mph';
    }
    return Math.round(speedKmh) + ' km/h';
  }

  getDailyForecast() {
    const result = [];
    const today = new Date();
    const daily: { [key: string]: number[] } = {};

    // Group forecast data by date
    if (this.forecast && this.forecast.length > 0) {
      this.forecast.forEach(item => {
        const itemDateStr = item.time.split(' ')[0]; // YYYY-MM-DD
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

        // Find most frequent icon for the day
        const iconsForDay = this.forecast
          .filter(item => new Date(item.time.replace(' ', 'T')).toDateString() === dateStr)
          .map(item => item.icon);

        const iconCounts: { [key: string]: number } = {};
        let maxCount = 0;
        let mainIcon = '01d';

        iconsForDay.forEach(icon => {
          iconCounts[icon] = (iconCounts[icon] || 0) + 1;
          if (iconCounts[icon] > maxCount) {
            maxCount = iconCounts[icon];
            mainIcon = icon;
          }
        });

        // Get the YYYY-MM-DD for this day to use as consistent ID
        const firstMatch = this.forecast.find(item =>
          new Date(item.time.replace(' ', 'T')).toDateString() === dateStr
        );
        const itemDateStr = firstMatch ? firstMatch.time.split(' ')[0] : dateStr;

        result.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          temp: this.displayTemp(avgTemp),
          isToday,
          date: itemDateStr, // Use YYYY-MM-DD for consistency
          hasData: true,
          icon: mainIcon
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
    // day comes in as "YYYY-MM-DD" or similar from the grouping logic
    this.selectedDay = day;
    this.updateDetailedHourly();
  }

  updateDetailedHourly() {
    if (!this.forecast || this.forecast.length === 0 || !this.selectedDay) return;

    const sortedFull = [...this.forecast].sort((a, b) =>
      new Date(a.time.replace(' ', 'T')).getTime() - new Date(b.time.replace(' ', 'T')).getTime()
    );

    const detailed: any[] = [];
    const targetDateStr = this.selectedDay;

    for (let h = 0; h < 24; h++) {
      const currentHourDate = new Date(`${targetDateStr}T${h.toString().padStart(2, '0')}:00:00`);

      // Find surrounding forecast points for interpolation
      let p1 = sortedFull[0];
      let p2 = sortedFull[sortedFull.length - 1];

      for (let i = 0; i < sortedFull.length - 1; i++) {
        const d1 = new Date(sortedFull[i].time.replace(' ', 'T'));
        const d2 = new Date(sortedFull[i + 1].time.replace(' ', 'T'));
        if (currentHourDate >= d1 && currentHourDate <= d2) {
          p1 = sortedFull[i];
          p2 = sortedFull[i + 1];
          break;
        }
      }

      const t1 = new Date(p1.time.replace(' ', 'T')).getTime();
      const t2 = new Date(p2.time.replace(' ', 'T')).getTime();

      let interpolated: any = {
        time: currentHourDate.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
        icon: p1.icon // Use the icon of the closer point
      };

      if (t1 === t2) {
        interpolated.temp = Math.round(p1.temp);
        interpolated.humidity = Math.round(p1.humidity);
        interpolated.windSpeed = Math.round(p1.windSpeed);
      } else {
        const ratio = (currentHourDate.getTime() - t1) / (t2 - t1);
        interpolated.temp = Math.round(p1.temp + (p2.temp - p1.temp) * ratio);
        interpolated.humidity = Math.round(p1.humidity + (p2.humidity - p1.humidity) * ratio);
        interpolated.windSpeed = Math.round(p1.windSpeed + (p2.windSpeed - p1.windSpeed) * ratio);
        // If current hour is closer to p2, use p2's icon
        if (ratio > 0.5) interpolated.icon = p2.icon;
      }

      detailed.push(interpolated);
    }

    this.detailedHourly = detailed;
  }

  fetchAirQuality(lat: number, lon: number) {
    this.weatherService.getAirPollution(lat, lon).subscribe(data => {
      this.airQuality = data;
    });
  }

  updateLifestyleTips() {
    if (!this.weather) return;
    const tips = [];
    const temp = this.weather.main.temp;
    const condition = this.weather.weather[0].main.toLowerCase();
    const wind = this.weather.wind.speed;

    // Running
    if (temp > 10 && temp < 25 && !condition.includes('rain')) {
      tips.push({ icon: '🏃', label: 'Running', status: 'Excellent', color: '#51cf66' });
    } else {
      tips.push({ icon: '🏃', label: 'Running', status: 'Moderate', color: '#fcc419' });
    }

    // Attire
    if (temp < 15) {
      tips.push({ icon: '🧥', label: 'Attire', status: 'Warm Coat', color: '#4dabf7' });
    } else if (temp < 22) {
      tips.push({ icon: '👕', label: 'Attire', status: 'Light Jacket', color: '#ffd43b' });
    } else {
      tips.push({ icon: '🩳', label: 'Attire', status: 'Summer', color: '#ff922b' });
    }

    // Car Wash
    if (condition.includes('rain') || condition.includes('drizzle')) {
      tips.push({ icon: '🚗', label: 'Car Wash', status: 'Wait', color: '#ff6b6b' });
    } else {
      tips.push({ icon: '🚗', label: 'Car Wash', status: 'Good', color: '#51cf66' });
    }

    this.lifestyleTips = tips;
  }

  getAQIDesc(aqi: number): string {
    const descs = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return descs[aqi - 1] || 'Unknown';
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

    video.play().catch(() => { });
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

  showMap: boolean = false;

  openMap() {
    this.showMap = true;
  }

  closeMap() {
    this.showMap = false;
  }

  onMapLocationSelected(coords: { lat: number, lon: number }) {
    this.showMap = false;
    // Call new service method
    this.weatherService.getWeatherByCoords(coords.lat, coords.lon).subscribe({
      next: (data) => {
        console.log('Weather from map:', data);
        this.weather = data;
        this.updateBackgroundAndTheme();
        this.fetchAirQuality(data.coord.lat, data.coord.lon);
        this.updateLifestyleTips();
      },
      error: (err) => console.error('Map weather error:', err)
    });

    this.weatherService.getForecastByCoords(coords.lat, coords.lon).subscribe({
      next: (data) => {
        this.forecast = data.list.map((item: any) => ({
          temp: item.main.temp,
          time: item.dt_txt,
          icon: item.weather[0].icon,
          description: item.weather[0].description,
          humidity: item.main.humidity,
          windSpeed: item.wind?.speed || 0,
          windDeg: item.wind?.deg || 0
        }));
        if (this.forecast.length > 0) {
          this.selectedDay = this.forecast[0].time.split(' ')[0];
        }
        // Update hourly
        this.hourlyForecast = this.forecast.slice(0, 9).map(item => ({
          time: new Date(item.time.replace(' ', 'T')).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
          temp: Math.round(item.temp),
          icon: item.icon,
          desc: item.description
        }));
        this.updateDetailedHourly();
      },
      error: (err) => console.error('Map forecast error:', err)
    });
  }
}
