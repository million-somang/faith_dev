'use client';

import { useEffect, useState } from 'react';

const SEOUL = { lat: 37.5665, lon: 126.978, name: '서울' };

export type WeatherSceneType =
    | 'clear-day'
    | 'clear-night'
    | 'partly-cloudy-day'
    | 'partly-cloudy-night'
    | 'cloudy'
    | 'fog'
    | 'rain'
    | 'snow'
    | 'thunderstorm';

export interface PortalWeatherState {
    location: string;
    temp: number;
    code: number;
    isDay: boolean;
    label: string;
    icon: string;
    scene: WeatherSceneType;
}

export function getWeatherCodeMeta(
    code: number,
    isDay: boolean
): { label: string; icon: string; scene: WeatherSceneType } {
    if (code === 0) {
        return {
            label: '맑음',
            icon: isDay ? 'fa-sun text-yellow-400' : 'fa-moon text-slate-300',
            scene: isDay ? 'clear-day' : 'clear-night',
        };
    }
    if (code <= 2) {
        return {
            label: '구름 조금',
            icon: isDay ? 'fa-cloud-sun text-yellow-400' : 'fa-cloud-moon text-slate-300',
            scene: isDay ? 'partly-cloudy-day' : 'partly-cloudy-night',
        };
    }
    if (code === 3) {
        return {
            label: '흐림',
            icon: 'fa-cloud text-gray-400',
            scene: 'cloudy',
        };
    }
    if (code <= 48) {
        return {
            label: '안개',
            icon: 'fa-smog text-gray-400',
            scene: 'fog',
        };
    }
    if (code <= 57) {
        return {
            label: '이슬비',
            icon: 'fa-cloud-rain text-blue-400',
            scene: 'rain',
        };
    }
    if (code <= 67) {
        return {
            label: '비',
            icon: 'fa-cloud-showers-heavy text-blue-500',
            scene: 'rain',
        };
    }
    if (code <= 77) {
        return {
            label: '눈',
            icon: 'fa-snowflake text-blue-200',
            scene: 'snow',
        };
    }
    if (code <= 82) {
        return {
            label: '소나기',
            icon: 'fa-cloud-showers-heavy text-blue-500',
            scene: 'rain',
        };
    }
    if (code <= 86) {
        return {
            label: '눈',
            icon: 'fa-snowflake text-blue-200',
            scene: 'snow',
        };
    }
    return {
        label: '뇌우',
        icon: 'fa-cloud-bolt text-amber-500',
        scene: 'thunderstorm',
    };
}

let cachedWeather: PortalWeatherState | null = null;
let cachedAt = 0;

export function useWeather(): { weather: PortalWeatherState | null; isLoading: boolean } {
    const [weather, setWeather] = useState<PortalWeatherState | null>(cachedWeather);
    const [isLoading, setIsLoading] = useState<boolean>(!cachedWeather);

    useEffect(() => {
        let active = true;

        if (cachedWeather && Date.now() - cachedAt < 10 * 60 * 1000) {
            setWeather(cachedWeather);
            setIsLoading(false);
            return;
        }

        const load = async (lat: number, lon: number, fallbackName: string) => {
            try {
                const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto&forecast_days=1`;
                const res = await fetch(wxUrl);
                const wx = await res.json();
                if (!active || !wx?.current) return;

                const code: number = wx.current.weather_code ?? 0;
                const isDay: boolean = wx.current.is_day === 1;
                const temp: number = wx.current.temperature_2m ?? 20;
                const meta = getWeatherCodeMeta(code, isDay);

                const nextState: PortalWeatherState = {
                    location: fallbackName,
                    temp,
                    code,
                    isDay,
                    label: meta.label,
                    icon: meta.icon,
                    scene: meta.scene,
                };
                cachedWeather = nextState;
                cachedAt = Date.now();
                setWeather(nextState);
            } catch {
                // 기본 서울 맑음 폴백 유지
            } finally {
                if (active) setIsLoading(false);
            }
        };

        if (typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => load(pos.coords.latitude, pos.coords.longitude, '현재 위치'),
                () => load(SEOUL.lat, SEOUL.lon, SEOUL.name),
                { timeout: 8000, maximumAge: 600000 }
            );
        } else {
            load(SEOUL.lat, SEOUL.lon, SEOUL.name);
        }

        return () => {
            active = false;
        };
    }, []);

    return { weather, isLoading };
}
