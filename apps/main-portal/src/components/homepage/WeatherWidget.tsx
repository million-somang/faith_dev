import { useEffect, useState } from 'react';

// 실제 데이터: Open-Meteo(무료, API키 불필요) + 브라우저 위치 + 무료 역지오코딩 + 대기질
const SEOUL = { lat: 37.5665, lon: 126.978, name: '서울' };

interface HourSlot { hour: number; temp: number; isDay: boolean; code: number; }
interface WeatherData {
    location: string;
    temp: number;
    code: number;
    isDay: boolean;
    min: number;
    max: number;
    pm10: number | null;
    pm25: number | null;
    hourly: HourSlot[];
}

function codeInfo(code: number, isDay: boolean): { label: string; icon: string } {
    if (code === 0) return { label: '맑음', icon: isDay ? 'fa-sun text-yellow-400' : 'fa-moon text-slate-300' };
    if (code <= 2) return { label: '구름 조금', icon: isDay ? 'fa-cloud-sun text-yellow-400' : 'fa-cloud-moon text-slate-300' };
    if (code === 3) return { label: '흐림', icon: 'fa-cloud text-gray-400' };
    if (code <= 48) return { label: '안개', icon: 'fa-smog text-gray-400' };
    if (code <= 57) return { label: '이슬비', icon: 'fa-cloud-rain text-blue-400' };
    if (code <= 67) return { label: '비', icon: 'fa-cloud-showers-heavy text-blue-500' };
    if (code <= 77) return { label: '눈', icon: 'fa-snowflake text-blue-200' };
    if (code <= 82) return { label: '소나기', icon: 'fa-cloud-showers-heavy text-blue-500' };
    if (code <= 86) return { label: '눈', icon: 'fa-snowflake text-blue-200' };
    return { label: '뇌우', icon: 'fa-cloud-bolt text-amber-500' };
}

function grade(value: number | null, good: number, normal: number, bad: number) {
    if (value == null) return null;
    if (value <= good) return { label: '좋음', color: 'text-blue-500' };
    if (value <= normal) return { label: '보통', color: 'text-green-600' };
    if (value <= bad) return { label: '나쁨', color: 'text-orange-500' };
    return { label: '매우나쁨', color: 'text-red-500' };
}

export function WeatherWidget() {
    const [data, setData] = useState<WeatherData | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        const load = async (lat: number, lon: number, fallbackName: string) => {
            try {
                const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&hourly=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;
                const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5&timezone=auto`;
                const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`;

                const [wx, aq, geo] = await Promise.all([
                    fetch(wxUrl).then(r => r.json()),
                    fetch(aqUrl).then(r => r.json()).catch(() => null),
                    fetch(geoUrl).then(r => r.json()).catch(() => null),
                ]);
                if (!active) return;

                const location = geo
                    ? (geo.city || geo.locality || geo.principalSubdivision || fallbackName)
                    : fallbackName;

                // 현재 시각 이후로 2시간 간격 5칸
                const times: string[] = wx.hourly?.time || [];
                const nowTime: string = wx.current?.time;
                let startIdx = times.indexOf(nowTime);
                if (startIdx < 0) {
                    const now = Date.now();
                    startIdx = Math.max(0, times.findIndex(t => new Date(t).getTime() >= now));
                }
                const hourly: HourSlot[] = [];
                for (let k = 0; k < 5; k++) {
                    const idx = startIdx + k * 2;
                    if (idx >= times.length) break;
                    hourly.push({
                        hour: new Date(times[idx]).getHours(),
                        temp: Math.round(wx.hourly.temperature_2m[idx]),
                        isDay: wx.hourly.is_day[idx] === 1,
                        code: wx.hourly.weather_code[idx],
                    });
                }

                setData({
                    location,
                    temp: wx.current.temperature_2m,
                    code: wx.current.weather_code,
                    isDay: wx.current.is_day === 1,
                    min: Math.round(wx.daily.temperature_2m_min[0]),
                    max: Math.round(wx.daily.temperature_2m_max[0]),
                    pm10: aq?.current?.pm10 ?? null,
                    pm25: aq?.current?.pm2_5 ?? null,
                    hourly,
                });
            } catch (e) {
                console.error('[Weather] 로드 실패:', e);
                if (active) setError(true);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => load(pos.coords.latitude, pos.coords.longitude, '현재 위치'),
                () => load(SEOUL.lat, SEOUL.lon, SEOUL.name),
                { timeout: 8000, maximumAge: 600000 }
            );
        } else {
            load(SEOUL.lat, SEOUL.lon, SEOUL.name);
        }

        return () => { active = false; };
    }, []);

    if (error) return null;

    if (!data) {
        return (
            <div className="content-card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><i className="fas fa-cloud-sun text-blue-400"></i> 날씨</h3>
                </div>
                <div className="py-6 flex items-center justify-center text-gray-300">
                    <i className="fas fa-circle-notch fa-spin text-xl"></i>
                </div>
            </div>
        );
    }

    const ci = codeInfo(data.code, data.isDay);
    const pm25g = grade(data.pm25, 15, 35, 75);
    const pm10g = grade(data.pm10, 30, 80, 150);

    return (
        <div className="content-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><i className="fas fa-cloud-sun text-blue-400"></i> 날씨</h3>
                <span className="text-xs font-semibold text-gray-400 truncate max-w-[45%]" title={data.location}>{data.location}</span>
            </div>

            <div className="flex items-center gap-4">
                <i className={`fas ${ci.icon} text-4xl`}></i>
                <div className="flex-1">
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-black text-gray-900 leading-none">{data.temp.toFixed(1)}°</span>
                        <span className="text-sm font-bold text-gray-500 mb-0.5">{ci.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs font-bold">
                        <span className="text-blue-500">{data.min}°</span>
                        <span className="text-gray-300">/</span>
                        <span className="text-red-500">{data.max}°</span>
                    </div>
                </div>
            </div>

            {(pm25g || pm10g) && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-xs">
                    {pm10g && <span className="text-gray-500">미세 <b className={pm10g.color}>{pm10g.label}</b></span>}
                    {pm25g && <span className="text-gray-500">초미세 <b className={pm25g.color}>{pm25g.label}</b></span>}
                </div>
            )}

            {data.hourly.length > 0 && (
                <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                    {data.hourly.map((h, i) => {
                        const hci = codeInfo(h.code, h.isDay);
                        return (
                            <div key={i} className="flex flex-col items-center gap-1.5">
                                <span className="text-xs font-bold text-gray-500">{h.temp}°</span>
                                <i className={`fas ${hci.icon} text-base`}></i>
                                <span className={`text-[11px] ${i === 0 ? 'font-extrabold text-gray-800' : 'text-gray-400'}`}>{h.hour}시</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
