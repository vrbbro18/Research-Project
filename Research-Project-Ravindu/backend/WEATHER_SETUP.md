# Weather API Setup Guide

## Overview

The dashboard now includes live weather information fetched from OpenWeatherMap API.

## Setup Instructions

### Option 1: Use Free OpenWeatherMap API (Recommended)

1. **Get API Key:**
   - Visit: https://openweathermap.org/api
   - Sign up for a free account
   - Get your API key from the dashboard

2. **Configure Environment:**
   - Add to `backend/.env` file:
   ```
   WEATHER_API_KEY=your_api_key_here
   WEATHER_CITY=Colombo
   WEATHER_COUNTRY=LK
   ```

3. **Restart Server:**
   ```bash
   cd backend
   npm start
   ```

### Option 2: Use Demo Data (Default)

If no API key is configured, the system will use demo weather data. This is useful for testing without an API key.

## API Endpoints

### GET /api/weather/current

Get current weather information.

**Query Parameters:**
- `city` (optional): City name (defaults to configured city)
- `country` (optional): Country code (defaults to configured country)

**Example:**
```
GET http://localhost:3001/api/weather/current
GET http://localhost:3001/api/weather/current?city=Kandy&country=LK
```

**Response:**
```json
{
  "success": true,
  "weather": {
    "location": "Colombo, LK",
    "temperature": 28,
    "feelsLike": 30,
    "description": "Partly Cloudy",
    "icon": "02d",
    "humidity": 75,
    "windSpeed": 12,
    "pressure": 1013,
    "visibility": 10,
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Dashboard Features

The weather widget displays:
- **Current Temperature** - Main temperature display
- **Feels Like** - Perceived temperature
- **Weather Description** - Current conditions
- **Location** - City and country
- **Humidity** - Percentage
- **Wind Speed** - km/h
- **Pressure** - hPa
- **Visibility** - km (if available)

## Weather Updates

- Weather data updates every **10 minutes** automatically
- Weather icon from OpenWeatherMap
- Responsive design matching the dark theme

## Troubleshooting

### Weather Not Showing

1. **Check API Key:**
   - Verify `WEATHER_API_KEY` is set in `.env`
   - Make sure API key is valid

2. **Check City/Country:**
   - Verify city name is correct
   - Use ISO country codes (e.g., LK for Sri Lanka)

3. **Check Console:**
   - Look for weather API errors in server logs
   - Check browser console for frontend errors

### Using Demo Data

If the API fails or no key is configured, the system automatically falls back to demo data. This ensures the dashboard always shows weather information.

## Free API Limits

OpenWeatherMap Free Tier:
- 60 calls/minute
- 1,000,000 calls/month
- Current weather data
- 5-day/3-hour forecast

This is more than sufficient for dashboard use (updates every 10 minutes = ~144 calls/day).

## Alternative Weather APIs

You can modify `backend/routes/weather.routes.js` to use other weather APIs:
- WeatherAPI.com
- AccuWeather
- Weather.gov (US only)

Just update the API endpoint and response parsing logic.

