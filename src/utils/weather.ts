import { format, addDays } from 'date-fns';
import type { WeatherForecast } from '../types/weather';

// OpenWeatherMap API key
const API_KEY = 'dc19c4b3e592f0fb95051dbb1bc9869a';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Default coordinates (New York City)
const DEFAULT_COORDS = {
  lat: 40.7128,
  lon: -74.0060
};

export async function getLocation(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      resolve(DEFAULT_COORDS);
      return;
    }

    const geolocationOptions = {
      enableHighAccuracy: false, // Set to false for faster response
      timeout: 10000, // Increased timeout for mobile
      maximumAge: 300000 // Cache location for 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(DEFAULT_COORDS);
      },
      geolocationOptions
    );
  });
}

function mapWeatherCondition(condition: string): string {
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'sunny';
    case 'clouds':
      return 'cloudy';
    case 'rain':
    case 'drizzle':
    case 'thunderstorm':
      return 'rainy';
    case 'snow':
      return 'snowy';
    default:
      return 'partly-cloudy';
  }
}

export async function getForecast(lat: number, lon: number): Promise<WeatherForecast[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache'
      }
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.list || !Array.isArray(data.list)) {
      throw new Error('Invalid weather data format');
    }

    const dailyForecasts: WeatherForecast[] = [];
    const today = new Date();

    // Get one forecast per day for the next 5 days
    for (let i = 0; i < 5; i++) {
      const date = addDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Find the noon forecast for each day (most representative)
      const dayData = data.list.find((item: any) => 
        item.dt_txt.startsWith(dateStr) && item.dt_txt.includes('12:00:00')
      ) || data.list.find((item: any) => item.dt_txt.startsWith(dateStr)); // fallback to any time

      if (dayData) {
        dailyForecasts.push({
          day: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE'),
          temp: Math.round(dayData.main.temp),
          condition: mapWeatherCondition(dayData.weather[0].main),
          icon: dayData.weather[0].icon,
          description: dayData.weather[0].description,
        });
      }
    }

    if (dailyForecasts.length === 0) {
      return getMockForecast();
    }

    return dailyForecasts;
  } catch (error) {
    console.error('Error fetching weather:', error);
    return getMockForecast();
  }
}

export async function getSunTimes(lat: number, lon: number) {
  try {
    const response = await fetch(
      `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        cache: 'no-cache'
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch sun times');
    }

    const data = await response.json();
    
    return {
      sunrise: format(new Date(data.sys.sunrise * 1000), 'h:mm a'),
      sunset: format(new Date(data.sys.sunset * 1000), 'h:mm a')
    };
  } catch (error) {
    console.error('Error fetching sun times:', error);
    return {
      sunrise: '6:30 AM',
      sunset: '7:30 PM'
    };
  }
}

function getMockForecast(): WeatherForecast[] {
  const today = new Date();
  return [
    {
      day: 'Today',
      temp: 72,
      condition: 'sunny',
      icon: '01d',
      description: 'Clear sky'
    },
    {
      day: 'Tomorrow',
      temp: 68,
      condition: 'partly-cloudy',
      icon: '02d',
      description: 'Few clouds'
    },
    {
      day: format(addDays(today, 2), 'EEE'),
      temp: 65,
      condition: 'cloudy',
      icon: '03d',
      description: 'Scattered clouds'
    },
    {
      day: format(addDays(today, 3), 'EEE'),
      temp: 70,
      condition: 'rainy',
      icon: '10d',
      description: 'Light rain'
    },
    {
      day: format(addDays(today, 4), 'EEE'),
      temp: 75,
      condition: 'sunny',
      icon: '01d',
      description: 'Clear sky'
    }
  ];
}