import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const SEOUL = { lat: 37.5665, lon: 126.978, name: '서울' };

interface WeatherCompactData {
    location: string;
    temp: number;
    code: number;
    isDay: boolean;
    min: number;
    max: number;
    pm10: number | null;
    pm25: number | null;
}

interface Rate { code: string; name: string; price: number; change: number; rate: number; status: string; }
interface Stock { ticker: string; name: string; price: number; change: number; rate: number; status: string; }

function codeInfo(code: number, isDay: boolean): { label: string; icon: string } {
    if (code === 0) return { label: '맑음', icon: isDay ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-400' };
    if (code <= 2) return { label: '구름조금', icon: isDay ? 'fa-cloud-sun text-amber-500' : 'fa-cloud-moon text-indigo-400' };
    if (code === 3) return { label: '흐림', icon: 'fa-cloud text-slate-400' };
    if (code <= 48) return { label: '안개', icon: 'fa-smog text-slate-400' };
    if (code <= 57) return { label: '이슬비', icon: 'fa-cloud-rain text-blue-400' };
    if (code <= 67) return { label: '비', icon: 'fa-cloud-showers-heavy text-blue-500' };
    if (code <= 77) return { label: '눈', icon: 'fa-snowflake text-sky-300' };
    if (code <= 82) return { label: '소나기', icon: 'fa-cloud-showers-heavy text-blue-500' };
    if (code <= 86) return { label: '눈', icon: 'fa-snowflake text-sky-300' };
    return { label: '뇌우', icon: 'fa-cloud-bolt text-amber-500' };
}

function pmGrade(value: number | null, good: number, normal: number) {
    if (value == null) return null;
    if (value <= good) return { label: '좋음', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (value <= normal) return { label: '보통', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    return { label: '나쁨', color: 'text-rose-600 bg-rose-50 border-rose-200' };
}

export const CompactDashboardWidgets: React.FC = () => {
    // 1. 날씨 상태
    const [weather, setWeather] = useState<WeatherCompactData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);

    // 2. 금융 상태
    const [usd, setUsd] = useState<Rate | null>(null);
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [financeLoading, setFinanceLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // 날씨 로드 (Open-Meteo)
        const loadWeather = async (lat: number, lon: number, locationName: string) => {
            try {
                const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;
                const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`;
                
                const [wx, aq] = await Promise.all([
                    fetch(wxUrl).then(r => r.json()),
                    fetch(aqUrl).then(r => r.json()).catch(() => null),
                ]);

                if (!active) return;

                setWeather({
                    location: locationName,
                    temp: wx?.current?.temperature_2m ?? 20,
                    code: wx?.current?.weather_code ?? 0,
                    isDay: (wx?.current?.is_day ?? 1) === 1,
                    min: wx?.daily?.temperature_2m_min?.[0] ?? 15,
                    max: wx?.daily?.temperature_2m_max?.[0] ?? 25,
                    pm10: aq?.current?.pm10 ?? null,
                    pm25: aq?.current?.pm2_5 ?? null,
                });
            } catch (err) {
                console.error('[CompactWeather] Load failed:', err);
            } finally {
                if (active) setWeatherLoading(false);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    let locName = '내 위치';
                    try {
                        const geo = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`).then(r => r.json());
                        locName = geo?.locality || geo?.city || geo?.principalSubdivision || '내 위치';
                    } catch {}
                    loadWeather(lat, lon, locName);
                },
                () => loadWeather(SEOUL.lat, SEOUL.lon, SEOUL.name),
                { timeout: 5000 }
            );
        } else {
            loadWeather(SEOUL.lat, SEOUL.lon, SEOUL.name);
        }

        // 금융 데이터 로드
        (async () => {
            try {
                const [exRes, stRes] = await Promise.all([
                    axios.get<Rate[]>(`${API_BASE_URL}/api/finance/exchange`).catch(() => ({ data: [] })),
                    axios.get<Stock[]>(`${API_BASE_URL}/api/finance/kr-stocks`).catch(() => ({ data: [] })),
                ]);
                if (!active) return;
                setUsd((exRes.data || []).find(r => r.code === 'USD') || null);
                setStocks((stRes.data || []).slice(0, 2));
            } catch (err) {
                console.error('[CompactFinance] Load failed:', err);
            } finally {
                if (active) setFinanceLoading(false);
            }
        })();

        return () => { active = false; };
    }, []);

    const ci = weather ? codeInfo(weather.code, weather.isDay) : null;
    const pmGradeInfo = weather ? pmGrade(weather.pm10, 30, 80) : null;

    const color = (status: string) => status === 'up' ? 'text-red-500' : 'text-blue-500';
    const arrow = (status: string) => status === 'up' ? 'fa-caret-up' : 'fa-caret-down';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. 컴팩트 날씨 카드 */}
            <div className="bg-white border border-slate-200/80 hover:border-sky-300 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                {weatherLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                        <i className="fas fa-circle-notch fa-spin text-sky-500"></i>
                        <span>실시간 날씨 정보를 불러오는 중...</span>
                    </div>
                ) : weather && ci ? (
                    <>
                        <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                                <i className={`fas ${ci.icon}`}></i>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-slate-900 text-base sm:text-lg font-mono">
                                        {weather.temp.toFixed(1)}°
                                    </span>
                                    <span className="font-bold text-slate-700 text-xs sm:text-sm">
                                        {ci.label}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        ({weather.location})
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 mt-0.5">
                                    <span className="text-sky-600 font-semibold">최저 {weather.min.toFixed(0)}°</span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-rose-500 font-semibold">최고 {weather.max.toFixed(0)}°</span>
                                </div>
                            </div>
                        </div>

                        {/* 미세먼지 뱃지 */}
                        {pmGradeInfo && (
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${pmGradeInfo.color} shadow-2xs`}>
                                미세 {pmGradeInfo.label}
                            </span>
                        )}
                    </>
                ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 py-1">
                        <i className="fas fa-cloud-sun text-sky-400"></i>
                        <span>날씨 정보 (서울 22.0° 맑음)</span>
                    </div>
                )}
            </div>

            {/* 2. 컴팩트 금융/증시 카드 */}
            <div className="bg-white border border-slate-200/80 hover:border-emerald-300 rounded-3xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
                {financeLoading ? (
                    <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
                        <i className="fas fa-circle-notch fa-spin text-emerald-500"></i>
                        <span>실시간 증시/환율을 불러오는 중...</span>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center gap-3.5 overflow-hidden">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-xl text-emerald-600 flex-shrink-0 shadow-2xs">
                                <i className="fas fa-chart-line"></i>
                            </div>

                            <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto hide-scrollbar text-xs">
                                {/* 미국 USD 환율 */}
                                {usd && (
                                    <div className="flex-shrink-0">
                                        <div className="text-[10px] font-bold text-slate-400">USD 환율</div>
                                        <div className="font-mono font-black text-slate-900 flex items-center gap-1">
                                            <span>{usd.price.toLocaleString()}원</span>
                                            <span className={`text-[10px] font-bold ${color(usd.status)} flex items-center`}>
                                                <i className={`fas ${arrow(usd.status)} text-[8px] mr-0.5`}></i>
                                                {Math.abs(usd.rate).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* 대표 종목 1종 (삼성전자 등) */}
                                {stocks.length > 0 && (
                                    <div className="flex-shrink-0 border-l border-emerald-100/80 pl-3">
                                        <div className="text-[10px] font-bold text-slate-400 truncate max-w-[80px] sm:max-w-[100px]">
                                            {stocks[0].name}
                                        </div>
                                        <div className="font-mono font-black text-slate-900 flex items-center gap-1">
                                            <span>{stocks[0].price.toLocaleString()}원</span>
                                            <span className={`text-[10px] font-bold ${color(stocks[0].status)} flex items-center`}>
                                                <i className={`fas ${arrow(stocks[0].status)} text-[8px] mr-0.5`}></i>
                                                {Math.abs(stocks[0].rate).toFixed(2)}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 바로가기 화살표 링크 */}
                        <Link 
                            to="/finance" 
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white/90 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 shadow-2xs hover:shadow-xs transition-all flex items-center gap-1 flex-shrink-0 ml-2"
                        >
                            <span>금융</span>
                            <i className="fas fa-chevron-right text-[9px]"></i>
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default CompactDashboardWidgets;
