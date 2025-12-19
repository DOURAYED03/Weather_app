import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(private http: HttpClient) { }

  getWeather(city: string): Observable<any> {
    const url = `${this.baseUrl}/weather?q=${city}&appid=${environment.openWeatherMapApiKey}&units=metric`;
    return this.http.get(url).pipe(
      map((data: any) => ({
        name: data.name,
        country: data.sys.country,
        coord: data.coord,
        main: {
          temp: Math.round(data.main.temp),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          feels_like: Math.round(data.main.feels_like)
        },
        weather: data.weather,
        wind: {
          speed: Math.round(data.wind.speed * 3.6),
          gust: data.wind.gust ? Math.round(data.wind.gust * 3.6) : null
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
    const url = `${this.baseUrl}/forecast?q=${city}&appid=${environment.openWeatherMapApiKey}&units=metric`;
    return this.http.get(url).pipe(
      map((data: any) => ({
        ...data,
        list: data.list.map((item: any) => ({
          dt_txt: item.dt_txt,
          main: {
            temp: Math.round(item.main.temp),
            humidity: item.main.humidity,
            pressure: item.main.pressure,
            feels_like: Math.round(item.main.feels_like)
          },
          weather: item.weather,
          wind: {
            speed: Math.round(item.wind.speed * 3.6),
            deg: item.wind.deg
          },
          visibility: item.visibility,
          clouds: item.clouds,
          pop: item.pop // Probability of precipitation
        }))
      })),
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
      coord: { lat: 36.8065, lon: 10.1815 },
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
  getWeatherByCoords(lat: number, lon: number): Observable<any> {
    const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${environment.openWeatherMapApiKey}&units=metric`;
    return this.http.get(url).pipe(
      map((data: any) => ({
        name: data.name || 'Unknown Location',
        country: data.sys.country,
        coord: data.coord,
        main: {
          temp: Math.round(data.main.temp),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          feels_like: Math.round(data.main.feels_like)
        },
        weather: data.weather,
        wind: {
          speed: Math.round(data.wind.speed * 3.6),
          deg: data.wind.deg
        },
        visibility: data.visibility,
        uv: 5, // Mock UV as standard API doesn't allow it without OneCall
        sunrise: this.formatTime(data.sys.sunrise, data.timezone),
        sunset: this.formatTime(data.sys.sunset, data.timezone)
      })),
      catchError(() => this.getMockWeather('Unknown'))
    );
  }

  getForecastByCoords(lat: number, lon: number): Observable<any> {
    const url = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${environment.openWeatherMapApiKey}&units=metric`;
    return this.http.get(url).pipe(
      catchError(() => this.getMockForecast())
    );
  }

  getAirPollution(lat: number, lon: number): Observable<any> {
    const url = `${this.baseUrl}/air_pollution?lat=${lat}&lon=${lon}&appid=${environment.openWeatherMapApiKey}`;
    return this.http.get(url).pipe(
      map((data: any) => ({
        aqi: data.list[0].main.aqi,
        components: data.list[0].components
      })),
      catchError(() => of({ aqi: 2, components: {} }))
    );
  }
}
