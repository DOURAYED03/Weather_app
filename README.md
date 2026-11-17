# Weather App

Angular weather dashboard for searching cities, viewing current conditions and forecasts, checking air quality, saving locations, exploring a Leaflet map, and visualizing forecast data with Chart.js.

## Features

- City search with OpenWeatherMap geocoding suggestions.
- Current weather details, wind, visibility, sunrise, and sunset.
- Multi-day forecast visualization.
- Air-quality information when the OpenWeatherMap endpoint is available.
- Saved locations persisted in browser `localStorage`.
- Leaflet map integration.
- Chart.js forecast charts.
- Local mock fallback data when weather requests fail.

## Technology

- Angular 21 and TypeScript
- RxJS
- Leaflet
- Chart.js and `ng2-charts`
- OpenWeatherMap Weather, Forecast, Geocoding, and Air Pollution APIs

## Architecture

The application is a standalone Angular application. `src/app/app.ts` coordinates the main dashboard, `src/app/services/weather.ts` wraps OpenWeatherMap requests and fallback data, and `src/app/services/locations.ts` manages saved locations. Feature components under `src/app/` render search, navigation, weather details, maps, saved locations, and charts.

## Project structure

```text
src/app/
  services/             OpenWeatherMap and saved-location services
  search-bar/           Search and geocoding suggestions
  weather-display/      Current weather presentation
  weather-chart/        Forecast chart
  map/                  Leaflet map
  saved-locations/      Saved-location UI
  app.ts                Dashboard orchestration
src/environments/       Build-time configuration placeholders
public/                 Static assets
```

## Prerequisites

- Node.js and npm.
- An OpenWeatherMap API key for live data.

## Installation

```bash
npm ci
```

## Configuration

Use the example configuration as a reference and replace the placeholder in `src/environments/environment.ts` with your own key:

```bash
cat src/environments/environment.example.ts
```

`environment.ts` is intentionally committed with an empty key so a clean checkout remains buildable; do not commit a real key.

OpenWeatherMap keys are necessarily exposed in a browser application. Treat the key as public, restrict it in the provider dashboard, and rotate it if it is exposed or abused.

## Development

```bash
npm start
```

Open `http://localhost:4200/`.

## Production build

```bash
npm run build
```

## Tests

```bash
npm test
```

The repository currently contains component tests using Angular's configured Vitest runner.

## Data fallback behavior

When an OpenWeatherMap request fails, the UI uses local mock values so the interface remains usable. These values are not live weather data; production deployments should monitor API failures and make the fallback state visible to users.

## Security considerations

- Never commit a real API key.
- Restrict the OpenWeatherMap key by application and endpoint where supported.
- Keep third-party asset requests on HTTPS.
- Saved locations are stored only in the visitor's browser and are not an account-backed data store.

## Known limitations and future improvements

- The current UV value is a placeholder because the configured OpenWeatherMap endpoints do not provide it.
- Mock fallback data can look like a successful response.
- Add explicit loading/error states for live-data failures and environment-specific Angular file replacement for production deployments.
