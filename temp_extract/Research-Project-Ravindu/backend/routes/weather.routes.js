const express = require('express');
const router = express.Router();
const axios = require('axios');

// OpenWeatherMap API configuration
// Get your free API key from: https://openweathermap.org/api
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || 'demo_key';
const WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// Default location (can be configured via environment variable)
const DEFAULT_CITY = process.env.WEATHER_CITY || 'Colombo';
const DEFAULT_COUNTRY = process.env.WEATHER_COUNTRY || 'LK';

/**
 * GET /api/weather/current
 * Get current weather information
 * 
 * Query params:
 * - city: City name (optional, defaults to configured city)
 * - country: Country code (optional)
 */
router.get('/current', async (req, res) => {
  try {
    const city = req.query.city || DEFAULT_CITY;
    const country = req.query.country || DEFAULT_COUNTRY;
    
    // If using demo key, return mock data
    if (WEATHER_API_KEY === 'demo_key') {
      return res.json({
        success: true,
        weather: {
          location: `${city}, ${country}`,
          temperature: 28,
          feelsLike: 30,
          description: 'Partly Cloudy',
          icon: '02d',
          humidity: 75,
          windSpeed: 12,
          pressure: 1013,
          visibility: 10,
          timestamp: new Date().toISOString()
        },
        note: 'Using demo data. Set WEATHER_API_KEY in .env for real weather data.'
      });
    }

    // Fetch from OpenWeatherMap API
    const response = await axios.get(WEATHER_API_URL, {
      params: {
        q: `${city},${country}`,
        appid: WEATHER_API_KEY,
        units: 'metric' // Use Celsius
      }
    });

    const data = response.data;
    
    const weatherData = {
      location: `${data.name}, ${data.sys.country}`,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      pressure: data.main.pressure,
      visibility: data.visibility ? (data.visibility / 1000).toFixed(1) : null,
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      weather: weatherData
    });

  } catch (error) {
    console.error('[WEATHER ERROR]', error.message);
    
    // Return mock data on error
    res.json({
      success: true,
      weather: {
        location: `${DEFAULT_CITY}, ${DEFAULT_COUNTRY}`,
        temperature: 28,
        feelsLike: 30,
        description: 'Partly Cloudy',
        icon: '02d',
        humidity: 75,
        windSpeed: 12,
        pressure: 1013,
        visibility: 10,
        timestamp: new Date().toISOString()
      },
      note: 'Weather API unavailable. Showing demo data.'
    });
  }
});

module.exports = router;

