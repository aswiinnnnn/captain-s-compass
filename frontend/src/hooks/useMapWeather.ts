/**
 * useMapWeather — fetches the global weather grid once and caches it in state.
 *
 * The backend already disk-caches the data for 6 hours, so we only
 * need to fetch once per page load.
 */
import { useState, useEffect } from 'react';

export interface WindHeader {
    parameterCategory: number;
    parameterNumber: number;
    lo1: number;
    lo2: number;
    la1: number;
    la2: number;
    dx: number;
    dy: number;
    nx: number;
    ny: number;
}

export interface WindLayer {
    header: WindHeader;
    data: number[];
}

export interface WeatherPoint {
    lat: number;
    lng: number;
    value: number;
}

export interface MapWeatherData {
    wind: WindLayer[] | null;
    temperature: WeatherPoint[];
    precipitation: WeatherPoint[];
}

export function useMapWeather() {
    const [data, setData] = useState<MapWeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        fetch('/api/map-weather/grid')
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json: MapWeatherData) => {
                if (!cancelled) {
                    setData(json);
                    setIsLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error('Map weather fetch failed:', err);
                    setError(err.message);
                    setIsLoading(false);
                }
            });

        return () => { cancelled = true; };
    }, []);

    return { data, isLoading, error };
}
