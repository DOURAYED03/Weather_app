import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = 'daa82813cba09f141a7d265aad49ee8b';
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) { }

  getWeather(city: string): Observable<any> {
    const url = `${this.baseUrl}/weather?q=${city}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url).pipe(
      map((data: any) => ({
        name: data.name,
        country: data.sys.country,
        main: {
          temp: Math.round(data.main.temp),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity
        },
        weather: data.weather,
        wind: {
          speed: Math.round(data.wind.speed * 3.6)
        },
        visibility: data.visibility,
        uv: 5,
        sunrise: this.formatTime(data.sys.sunrise, data.timezone),
        sunset: this.formatTime(data.sys.sunset, data.timezone)
      })),
      catchError(() => this.getMockWeather(city))
    );
  }

  getForecast(city: string): Observable<any> {
    const url = `${this.baseUrl}/forecast?q=${city}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url).pipe(
      catchError(() => this.getMockForecast())
    );
  }

  private formatTime(timestamp: number, timezone: number): string {
    const date = new Date((timestamp + timezone) * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
  }

  // Fallback mock data when API is not available
  private getMockWeather(city: string): Observable<any> {
    return of({
      name: city,
      country: 'TN',
      main: {
        temp: 18,
        temp_min: 14,
        temp_max: 22,
        humidity: 65
      },
      weather: [{
        main: 'Clear',
        description: 'clear sky',
        icon: '01n'
      }],
      wind: { speed: 12 },
      visibility: 10000,
      uv: 3,
      sunrise: '06:45',
      sunset: '17:30'
    });
  }

  private getMockForecast(): Observable<any> {
    const list = [];
    const now = new Date();
    // Start from beginning of today
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    // Generate 5 days of data, every 3 hours
    for (let i = 0; i < 40; i++) {
      const date = new Date(startOfDay.getTime() + i * 3 * 3600000);
      const hour = date.getHours();
      // Temperature varies by time of day
      const baseTemp = 16;
      const variation = Math.sin((hour - 6) * Math.PI / 12) * 6; // Peak at noon
      list.push({
        dt_txt: date.toISOString().replace('T', ' ').substring(0, 19),
        main: { temp: baseTemp + variation + Math.random() * 2 }
      });
    }
    return of({ list });
  }
}
