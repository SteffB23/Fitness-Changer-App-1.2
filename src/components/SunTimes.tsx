import React from 'react';
import { Sunrise, Sunset } from 'lucide-react';
import { getSunTimes, getLocation } from '../utils/weather';

interface SunTime {
  sunrise: string;
  sunset: string;
}

export function SunTimes() {
  const [sunTimes, setSunTimes] = React.useState<SunTime | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function loadSunTimes() {
      try {
        setError(null);
        const coords = await getLocation();
        
        if (!mounted) return;
        
        const times = await getSunTimes(coords.lat, coords.lon);
        
        if (!mounted) return;
        setSunTimes(times);
      } catch (err) {
        console.error('Error fetching sun times:', err);
        if (mounted) {
          setError('Unable to load sun times');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadSunTimes();
    const interval = setInterval(loadSunTimes, 60 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-3 border-t">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 border-t">
        <p className="text-sm text-red-500 text-center">{error}</p>
      </div>
    );
  }

  if (!sunTimes) return null;

  return (
    <div className="px-4 py-3 border-t">
      <div className="flex justify-center space-x-8">
        <div className="flex items-center space-x-2">
          <Sunrise className="h-5 w-5 text-amber-500" />
          <span className="text-sm text-gray-600">{sunTimes.sunrise}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Sunset className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-gray-600">{sunTimes.sunset}</span>
        </div>
      </div>
    </div>
  );
}