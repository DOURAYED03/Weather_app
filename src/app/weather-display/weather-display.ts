import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-weather-display',
  imports: [CommonModule],
  templateUrl: './weather-display.html',
  styleUrl: './weather-display.css',
})
export class WeatherDisplay {
  @Input() weather: any;

  getWeatherEmoji(main: string): string {
    if (!main) return '❓';
    switch (main.toLowerCase()) {
      case 'clear': return '☀️';
      case 'clouds': return '☁️';
      case 'rain': return '🌧️';
      case 'drizzle': return '🌦️';
      case 'thunderstorm': return '⛈️';
      case 'snow': return '❄️';
      case 'mist': return '🌫️';
      default: return '🌤️';
    }
  }
}
