import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { CalendarScheduleSection } from './CalendarScheduleSection';
import { CompactDashboardWidgets } from '@/components/homepage/CompactDashboardWidgets';
import { MypageTodoCard } from './MypageTodoCard';

const SEOUL = { lat: 37.5665, lon: 126.978, name: '서울' };

interface WeatherData {
    location: string;
    temp: number;
    code: number;
    isDay: boolean;
    min: number;
    max: number;
    pm10: number | null;
    pm25: number | null;
}

function codeInfo(code: number, isDay: boolean): { label: string; icon: string } {
    if (code === 0) return { label: '맑음', icon: isDay ? 'fa-sun text-amber-500' : 'fa-moon text-indigo-400' };
    if (code <= 2) return { label: '구름 조금', icon: isDay ? 'fa-cloud-sun text-amber-500' : 'fa-cloud-moon text-indigo-400' };
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
    if (value <= good) return { label: '좋음', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
    if (value <= normal) return { label: '보통', color: 'text-blue-700 bg-blue-100 border-blue-300' };
    return { label: '나쁨', color: 'text-rose-700 bg-rose-100 border-rose-300' };
}

// 365 데일리 명언 컬렉션
const DAILY_QUOTES = [
    { quote: "성공의 비결은 시작하는 것이다. 시작하는 비결은 복잡한 일들을 잘게 나누어 첫 번째 조각부터 해치우는 것이다.", author: "마크 트웨인", category: "성장" },
    { quote: "오늘 할 수 있는 일에 온 힘을 쏟아라. 그러면 내일은 한 걸음 더 나아가 있을 것이다.", author: "아이작 뉴턴", category: "실행" },
    { quote: "인생에서 가장 큰 위험은 아무런 위험도 감수하지 않는 것이다.", author: "마크 저커버그", category: "도전" },
    { quote: "마음속에 품은 생각이 곧 당신의 미래가 된다. 긍정적인 생각으로 오늘을 채워라.", author: "마르쿠스 아우렐리우스", category: "마인드" },
    { quote: "지혜로운 사람은 당황하지 않고, 어진 사람은 근심하지 않으며, 용기 있는 사람은 두려워하지 않는다.", author: "공자", category: "지혜" },
    { quote: "작은 일에도 정성을 다하라. 작은 일에 정성을 다하면 세상을 변화시킬 수 있다.", author: "중용(中庸)", category: "정성" },
    { quote: "당신이 할 수 있다고 믿든, 할 수 없다고 믿든, 믿는 대로 될 것이다.", author: "헨리 포드", category: "신념" },
    { quote: "가장 어두운 밤도 언젠가는 끝나고 해는 떠오를 것이다.", author: "빅토르 위고", category: "희망" },
    { quote: "단순함이 궁극의 정교함이다. 오늘 하루를 군더더기 없이 심플하게 집중하라.", author: "레오나르도 다빈치", category: "집중" },
    { quote: "행복은 이미 만들어진 것이 아니다. 당신의 행동에서 비롯되는 것이다.", author: "달라이 라마", category: "행복" },
    { quote: "위대한 일을 해내는 유일한 방법은 당신이 하는 일을 사랑하는 것이다.", author: "스티브 잡스", category: "열정" },
    { quote: "물은 어떤 그릇에 담기느냐에 따라 모양이 바뀐다. 유연함이 최고의 지혜다.", author: "노자", category: "처세" },
];

export interface MyLifeWatchlistItem {
    id: number | string;
    stock_symbol: string;
    stock_name: string;
    market_type: string;
    target_price?: number;
    memo?: string;
}

export interface MyLifeKeywordNewsItem {
    id?: number | string;
    title: string;
    description?: string;
    summary?: string;
    category?: string;
    keyword?: string;
    publisher?: string;
    source?: string;
    origin_url?: string;
    url?: string;
    published_at?: string;
    created_at?: string;
}

export interface MyLifeShoppingItem {
    productId: number | string;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage: string;
    productUrl: string;
    curationPoint?: string;
    tag?: string;
}

export interface MyLifeVeraPointsData {
    points: number;
    pendingAmount: number;
    attendanceRatio: number;
    activityRatio: number;
}

export type MyPageSectionType =
    | 'dashboard'
    | 'schedule'
    | 'video'
    | 'news'
    | 'stocks'
    | 'games'
    | 'utils'
    | 'home-customize';

interface MyLifeSectionProps {
    user: any;
    birthDate: string;
    showBirthEditor: boolean;
    setShowBirthEditor: (show: boolean) => void;
    tempBirthDate: string;
    setTempBirthDate: (date: string) => void;
    handleSaveBirth: (e: React.FormEvent) => void;
    saju: { wood: number; fire: number; earth: number; metal: number; water: number; nature: string } | null;
    calYear: number;
    calMonth: number;
    calendarDays: any[];
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    handleGoToday: () => void;
    isPushSubscribed: boolean;
    pushLoading: boolean;
    handleTogglePush: () => void;
    schedulesByDate: Record<string, any[]>;
    displaySchedules: any[];
    newAgendaDate: string;
    setNewAgendaDate: (date: string) => void;
    newAgendaEndDate: string;
    setNewAgendaEndDate: (date: string) => void;
    newAgendaTime: string;
    setNewAgendaTime: (time: string) => void;
    newAgendaEndTime: string;
    setNewAgendaEndTime: (time: string) => void;
    isAllDay: boolean;
    handleToggleAllDay: () => void;
    newAgendaText: string;
    setNewAgendaText: (text: string) => void;
    newAgendaColor: string;
    setNewAgendaColor: (color: string) => void;
    handleSetPresetDuration: (days: number) => void;
    handleAddAgenda: (e: React.FormEvent) => void;
    handleRemoveAgenda: (id: string | number) => void;
    SCHEDULE_COLOR_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; badge: string; dot: string }>;
    watchlist: MyLifeWatchlistItem[];
    newsKeywords: Array<string | { id?: number | string; keyword?: string; name?: string }>;
    keywordNews: MyLifeKeywordNewsItem[];
    onDeleteKeyword: (id?: number | string, name?: string) => void;
    veraPointsData: MyLifeVeraPointsData;
    shoppingItems: MyLifeShoppingItem[];
    onNavigateSection?: (section: MyPageSectionType) => void;
}

export const MyLifeSection: React.FC<MyLifeSectionProps> = ({
    user,
    birthDate,
    showBirthEditor,
    setShowBirthEditor,
    tempBirthDate,
    setTempBirthDate,
    handleSaveBirth,
    saju,
    calYear,
    calMonth,
    calendarDays,
    selectedDate,
    setSelectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleGoToday,
    isPushSubscribed,
    pushLoading,
    handleTogglePush,
    schedulesByDate,
    displaySchedules,
    newAgendaDate,
    setNewAgendaDate,
    newAgendaEndDate,
    setNewAgendaEndDate,
    newAgendaTime,
    setNewAgendaTime,
    newAgendaEndTime,
    setNewAgendaEndTime,
    isAllDay,
    handleToggleAllDay,
    newAgendaText,
    setNewAgendaText,
    newAgendaColor,
    setNewAgendaColor,
    handleSetPresetDuration,
    handleAddAgenda,
    handleRemoveAgenda,
    SCHEDULE_COLOR_CONFIG,
    watchlist,
    newsKeywords,
    keywordNews,
    onDeleteKeyword,
    veraPointsData,
    shoppingItems,
    onNavigateSection,
}) => {
    // 1. 날씨 상태
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(true);

    // 오늘 날짜 포맷
    const todayFormatted = useMemo(() => {
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const now = new Date();
        const m = now.getMonth() + 1;
        const d = now.getDate();
        const dayName = days[now.getDay()];
        return `${m}월 ${d}일 (${dayName})`;
    }, []);

    // 오늘의 명언 계산 (날짜 기반 고정 해시)
    const quoteIndex = useMemo(() => {
        const now = new Date();
        return (now.getFullYear() * 365 + now.getMonth() * 31 + now.getDate()) % DAILY_QUOTES.length;
    }, []);
    const currentQuote = DAILY_QUOTES[quoteIndex];

    // 날씨 로드
    useEffect(() => {
        let active = true;
        const loadWeather = async (lat: number, lon: number, locationName: string) => {
            try {
                const wxUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day,relative_humidity_2m,apparent_temperature&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1`;
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
                console.error('[MyLife Weather] Load failed:', err);
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

        return () => { active = false; };
    }, []);

    // 🔮 오늘의 사주 분석 및 조심해야 할 점 (Daily Saju Advisory)
    const sajuAdvisory = useMemo(() => {
        if (!saju || !birthDate) return null;

        const daySeed = (new Date().getFullYear() * 1000 + (new Date().getMonth() + 1) * 50 + new Date().getDate() + (user?.name?.length || 1));
        
        // 오행 중 가장 강한 기운과 부족한 기운 분석
        const elementsList = [
            { elem: '목(木)', val: saju.wood, name: '나무', color: '초록색', direction: '동쪽', num: '3, 8', time: '오전 07시 ~ 09시' },
            { elem: '화(火)', val: saju.fire, name: '불', color: '빨간색/분홍색', direction: '남쪽', num: '2, 7', time: '오전 11시 ~ 오후 1시' },
            { elem: '토(土)', val: saju.earth, name: '흙', color: '노란색/베이지', direction: '중앙/남서', num: '5, 10', time: '오후 01시 ~ 03시' },
            { elem: '금(金)', val: saju.metal, name: '쇠', color: '흰색/실버', direction: '서쪽', num: '4, 9', time: '오후 03시 ~ 05시' },
            { elem: '수(水)', val: saju.water, name: '물', color: '검은색/블루', direction: '북쪽', num: '1, 6', time: '오후 09시 ~ 11시' },
        ];

        // 부족한 기운(보완 요소)
        const weakest = [...elementsList].sort((a, b) => a.val - b.val)[0];
        // 강한 기운
        const strongest = [...elementsList].sort((a, b) => b.val - a.val)[0];

        // 날짜 해시 기반 주의사항 풀
        const cautionPool = [
            {
                title: "충동적인 지출 및 계약 주의",
                detail: "오늘 재물운의 변동폭이 있습니다. 불필요한 충동구매나 서두른 계약은 피하고, 중요한 결정은 하루 뒤로 미루는 것이 길합니다.",
                icon: "fa-wallet text-amber-500",
                badge: "재물/계약"
            },
            {
                title: "성급한 언행과 대인 마찰 경계",
                detail: "주변인과의 대화에서 말이 앞서 오해를 살 수 있습니다. 상대방의 말을 한 템포 듣고 차분하게 반응하면 오히려 신망을 얻습니다.",
                icon: "fa-comments text-rose-500",
                badge: "대인/언행"
            },
            {
                title: "과로 및 소화기 피로 관리",
                detail: "무리한 일정으로 신체 에너지가 소모되기 쉽습니다. 과식이나 자극적인 음식을 피하고, 따뜻한 수분을 자주 섭취해 주세요.",
                icon: "fa-heart-pulse text-emerald-500",
                badge: "건강/피로"
            },
            {
                title: "서두른 이동 및 분실 주의",
                detail: "마음이 조급해져 소지품을 깜빡하거나 이동 중 부주의가 생길 수 있습니다. 외출 전 물건을 한 번 더 챙기고 여유를 가지세요.",
                icon: "fa-triangle-exclamation text-orange-500",
                badge: "안전/소지품"
            },
            {
                title: "감정적인 결정 자제 & 원칙 준수",
                detail: "순간의 기분으로 계획을 바꾸면 후회가 남을 수 있습니다. 미리 정해둔 원칙과 일정대로 차분히 실행하는 것이 가장 안전합니다.",
                icon: "fa-shield-halved text-blue-500",
                badge: "마인드컨트롤"
            }
        ];

        const selectedCaution = cautionPool[daySeed % cautionPool.length];

        return {
            strongest,
            weakest,
            caution: selectedCaution,
            luckyColor: weakest.color,
            luckyNumber: weakest.num,
            luckyDirection: weakest.direction,
            luckyTime: weakest.time,
        };
    }, [saju, birthDate, user]);

    const wxInfo = weather ? codeInfo(weather.code, weather.isDay) : { label: '날씨 확인 중', icon: 'fa-cloud-sun text-amber-500' };
    const pm10Grade = weather ? pmGrade(weather.pm10, 30, 80) : null;

    const woodOffset = 0;
    const fireOffset = saju ? saju.wood : 0;
    const earthOffset = saju ? saju.wood + saju.fire : 0;
    const metalOffset = saju ? saju.wood + saju.fire + saju.earth : 0;
    const waterOffset = saju ? saju.wood + saju.fire + saju.earth + saju.metal : 0;

    return (
        <div className="animate-fade-in space-y-6">
            {/* 1. My Life 메인 헤더 & 데일리 인사 */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 rounded-3xl p-6 sm:p-8 text-white shadow-[8px_8px_18px_rgba(99,102,241,0.28),-6px_-6px_14px_rgba(255,255,255,0.8)] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                <div className="absolute left-1/3 -top-10 w-48 h-48 rounded-full bg-violet-300/15 blur-xl pointer-events-none"></div>

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="bg-white/20 backdrop-blur-md text-indigo-50 text-xs font-extrabold px-3 py-1 rounded-full border border-white/25 flex items-center gap-1.5 shadow-sm">
                            <i className="fas fa-sparkles text-amber-300"></i> My Life Hub
                        </span>
                        <span className="text-xs font-bold text-indigo-100/95 font-mono">
                            {todayFormatted}
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                        <span>{user?.name || '회원'}님의 하루를 위한 라이프 허브</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl leading-relaxed">
                        사주 주의보·오행, 실시간 날씨·증시, TO-DO, 스마트 일정, 구독 뉴스, 포인트·맞춤 쇼핑까지 하루의 모든 라이프 흐름을 한곳에서 관리하세요.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowBirthEditor(!showBirthEditor)}
                        className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
                    >
                        <i className="fas fa-id-card text-amber-300"></i>
                        <span>{birthDate ? '생년월일 수정' : '생년월일 등록'}</span>
                    </button>
                </div>
            </div>

            {/* 생년월일 입력 에디터 패널 (토글) */}
            {showBirthEditor && (
                <div className="bg-[#f0f4f8] rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] animate-fade-in">
                    <form onSubmit={handleSaveBirth} className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                <i className="fas fa-cake-candles"></i>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-[#1e293b] text-sm">{birthDate ? '생년월일(사주 기준) 수정' : '생년월일(사주 기준) 등록'}</h4>
                                <p className="text-xs text-[#64748b]">정확한 맞춤 사주 오행과 오늘의 주의사항 처방을 제공해 드립니다.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="date"
                                value={tempBirthDate}
                                onChange={(e) => setTempBirthDate(e.target.value)}
                                className="px-4 py-2 rounded-xl bg-white text-xs font-bold text-[#1e293b] shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] border border-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                required
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                                저장하기
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBirthEditor(false)}
                                className="px-3 py-2 rounded-xl bg-[#e8edf2] hover:bg-slate-200/80 text-[#64748b] font-bold text-xs shadow-[3px_3px_6px_rgba(163,177,198,0.4),-3px_-3px_6px_rgba(255,255,255,0.85)] transition-all cursor-pointer"
                            >
                                닫기
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 2. 실시간 날씨 & 금융/증시 슬림 위젯 바 */}
            <CompactDashboardWidgets />

            {/* 3. 상단 3개 핵심 데일리 카드 그리드 (사주 주의보, 날씨/외출 가이드, 오늘의 명언) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 카드 1: 오늘의 사주 주의보 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm shadow-sm font-bold shrink-0">
                                <i className="fas fa-shield-cat"></i>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#1e293b] text-sm">오늘의 사주 주의보</h3>
                                <p className="text-[10px] text-[#64748b]">사주 일진 기반 위험 회피 가이드</p>
                            </div>
                        </div>
                        {sajuAdvisory && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                {sajuAdvisory.caution.badge}
                            </span>
                        )}
                    </div>

                    {sajuAdvisory ? (
                        <div className="space-y-3">
                            <div className="p-3.5 rounded-2xl bg-[#e8edf2]/80 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] border border-rose-200/60 space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                    <i className={`fas ${sajuAdvisory.caution.icon} text-xs`}></i>
                                    <span className="font-black text-xs text-rose-900">
                                        {sajuAdvisory.caution.title}
                                    </span>
                                </div>
                                <p className="text-xs text-rose-900/80 leading-relaxed">
                                    {sajuAdvisory.caution.detail}
                                </p>
                            </div>

                            <div className="bg-white/75 p-3 rounded-2xl shadow-[inset_2px_2px_5px_rgba(163,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-[11px] space-y-1.5">
                                <div className="font-bold text-[#1e293b] flex items-center gap-1">
                                    <i className="fas fa-clover text-emerald-500"></i> 오늘의 행운 처방
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[#64748b] font-medium pt-1">
                                    <div>색상: <span className="font-bold text-[#1e293b]">{sajuAdvisory.luckyColor}</span></div>
                                    <div>숫자: <span className="font-bold text-[#1e293b]">{sajuAdvisory.luckyNumber}</span></div>
                                    <div>방향: <span className="font-bold text-[#1e293b]">{sajuAdvisory.luckyDirection}</span></div>
                                    <div>길시: <span className="font-bold text-[#1e293b]">{sajuAdvisory.luckyTime}</span></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-5 text-center space-y-3 bg-[#e8edf2]/80 rounded-2xl p-4 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <i className="fas fa-yin-yang text-3xl text-indigo-400"></i>
                            <p className="text-xs text-[#64748b] leading-relaxed">
                                생년월일을 등록하시면 매일 나에게 꼭 필요한 <strong>사주 맞춤 주의사항</strong>과 <strong>행운 요소</strong>를 보실 수 있습니다.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowBirthEditor(true)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                            >
                                생년월일 등록하기
                            </button>
                        </div>
                    )}

                    <div className="text-[10px] text-[#94a3b8] text-right">
                        * 전통 명리학 일진 기준 실시간 분석
                    </div>
                </div>

                {/* 카드 2: 오늘의 날씨 & 라이프 외출 가이드 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center text-sm shadow-sm font-bold shrink-0">
                                <i className="fas fa-cloud-sun"></i>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#1e293b] text-sm">실시간 날씨 &amp; 생활 지수</h3>
                                <p className="text-[10px] text-[#64748b]">{weather?.location || '날씨 정보'}</p>
                            </div>
                        </div>
                        {pm10Grade && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 ${pm10Grade.color}`}>
                                미세 {pm10Grade.label}
                            </span>
                        )}
                    </div>

                    {weatherLoading ? (
                        <div className="py-8 flex items-center justify-center text-[#64748b] text-xs bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent mr-2"></div>
                            날씨 정보 불러오는 중...
                        </div>
                    ) : weather ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between bg-[#e8edf2]/80 p-3.5 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                                <div className="flex items-center gap-3">
                                    <i className={`fas ${wxInfo.icon} text-3xl`}></i>
                                    <div>
                                        <div className="text-xl font-black text-[#1e293b] font-mono">{weather.temp}°C</div>
                                        <div className="text-xs font-bold text-[#64748b]">{wxInfo.label}</div>
                                    </div>
                                </div>
                                <div className="text-right text-xs font-medium text-[#64748b] space-y-0.5">
                                    <div>최고 <span className="font-bold text-rose-600">{weather.max}°</span></div>
                                    <div>최저 <span className="font-bold text-indigo-600">{weather.min}°</span></div>
                                </div>
                            </div>

                            <div className="bg-white/75 p-3 rounded-2xl shadow-[inset_2px_2px_5px_rgba(163,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-xs space-y-1.5 text-[#1e293b]">
                                <div className="font-bold flex items-center gap-1">
                                    <i className="fas fa-shirt text-indigo-500"></i> 외출 및 옷차림 팁
                                </div>
                                <p className="text-[11px] text-[#64748b] leading-relaxed">
                                    {weather.temp >= 23
                                        ? "통풍이 잘되는 가벼운 반팔 차림이 적당하며, 수분 보충에 신경 쓰세요."
                                        : weather.temp >= 15
                                            ? "일교차가 있으니 얇은 겉옷이나 가디건을 챙기시면 좋습니다."
                                            : "쌀쌀하니 따뜻한 외투를 입으시고 보온에 유의하세요."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-[#64748b] py-6 text-center bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            날씨 정보를 가져올 수 없습니다.
                        </p>
                    )}

                    <div className="text-[10px] text-[#94a3b8] text-right">
                        * Open-Meteo 실시간 기상 데이터
                    </div>
                </div>

                {/* 카드 3: 오늘의 명언 & 영감 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-5 sm:p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm shadow-sm font-bold shrink-0">
                                <i className="fas fa-lightbulb"></i>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#1e293b] text-sm">오늘의 지혜 &amp; 명언</h3>
                                <p className="text-[10px] text-[#64748b]">하루를 깨우는 마인드셋</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                            #{currentQuote.category}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 rounded-2xl bg-[#e8edf2]/80 shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)] space-y-3">
                            <div className="flex gap-2">
                                <i className="fas fa-quote-left text-indigo-400 text-lg shrink-0"></i>
                                <p className="font-bold text-xs sm:text-sm text-[#1e293b] leading-relaxed">
                                    &ldquo;{currentQuote.quote}&rdquo;
                                </p>
                            </div>
                            <div className="text-right text-xs font-black text-indigo-700">
                                — {currentQuote.author}
                            </div>
                        </div>

                        <div className="bg-white/75 p-3 rounded-2xl shadow-[inset_2px_2px_5px_rgba(163,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] text-[11px] text-[#64748b] flex items-center gap-2">
                            <i className="fas fa-heart text-rose-500 shrink-0"></i>
                            <span>오늘 하루도 긍정의 힘으로 힘차게 시작해 보세요!</span>
                        </div>
                    </div>

                    <div className="text-[10px] text-[#94a3b8] text-right">
                        * 매일 새로워지는 365 Daily Wisdom
                    </div>
                </div>
            </div>

            {/* 4. 나의 TO-DO (할일 정리) 실시간 보드 */}
            <MypageTodoCard variant="full" />

            {/* 5. 스마트 캘린더 & 일정 관리 섹션 */}
            <div>
                <CalendarScheduleSection
                    calYear={calYear}
                    calMonth={calMonth}
                    calendarDays={calendarDays}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    handlePrevMonth={handlePrevMonth}
                    handleNextMonth={handleNextMonth}
                    handleGoToday={handleGoToday}
                    isPushSubscribed={isPushSubscribed}
                    pushLoading={pushLoading}
                    handleTogglePush={handleTogglePush}
                    schedulesByDate={schedulesByDate}
                    displaySchedules={displaySchedules}
                    newAgendaDate={newAgendaDate}
                    setNewAgendaDate={setNewAgendaDate}
                    newAgendaEndDate={newAgendaEndDate}
                    setNewAgendaEndDate={setNewAgendaEndDate}
                    newAgendaTime={newAgendaTime}
                    setNewAgendaTime={setNewAgendaTime}
                    newAgendaEndTime={newAgendaEndTime}
                    setNewAgendaEndTime={setNewAgendaEndTime}
                    isAllDay={isAllDay}
                    handleToggleAllDay={handleToggleAllDay}
                    newAgendaText={newAgendaText}
                    setNewAgendaText={setNewAgendaText}
                    newAgendaColor={newAgendaColor}
                    setNewAgendaColor={setNewAgendaColor}
                    handleSetPresetDuration={handleSetPresetDuration}
                    handleAddAgenda={handleAddAgenda}
                    handleRemoveAgenda={handleRemoveAgenda}
                    SCHEDULE_COLOR_CONFIG={SCHEDULE_COLOR_CONFIG}
                />
            </div>

            {/* 6. 2열 퍼스널 인사이트 그리드 (내 관심 주식 + 사주 오행 밸런스) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 좌측: 내 관심 주식 종목 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                <i className="fas fa-chart-line"></i>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#1e293b] text-sm">
                                    내 관심 주식 종목
                                </h3>
                                <p className="text-[10px] text-[#64748b]">관심 등록 종목 및 목표가 모니터링</p>
                            </div>
                        </div>
                        {watchlist.length > 0 && (
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                                {watchlist.length}개 모니터링
                            </span>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        {watchlist.length > 0 ? (
                            watchlist.slice(0, 3).map((stock) => (
                                <Link
                                    key={stock.id}
                                    href="/finance"
                                    className="flex justify-between items-center bg-[#e8edf2]/80 hover:bg-white p-3.5 rounded-2xl text-xs shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.75)] border border-white/70 transition-all group"
                                >
                                    <div className="min-w-0">
                                        <span className="font-black text-[#1e293b] mr-2 group-hover:text-indigo-600 transition-colors">
                                            {stock.stock_name}
                                        </span>
                                        <span className="font-mono text-[11px] text-[#64748b]">
                                            {stock.stock_symbol}
                                        </span>
                                    </div>
                                    {stock.target_price ? (
                                        <span className="font-extrabold text-emerald-600 font-mono shrink-0">
                                            목표가: {Number(stock.target_price).toLocaleString()}원
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-[#64748b] shrink-0">
                                            실시간 시세 <i className="fas fa-chevron-right text-[8px]"></i>
                                        </span>
                                    )}
                                </Link>
                            ))
                        ) : (
                            <div className="text-[#64748b] text-xs py-7 text-center bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                                관심 등록한 주식이 없습니다
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {onNavigateSection && (
                            <button
                                type="button"
                                onClick={() => onNavigateSection('stocks')}
                                className="py-2.5 bg-[#e8edf2] hover:bg-white text-[#1e293b] font-extrabold text-center text-xs rounded-xl shadow-[4px_4px_8px_rgba(163,177,198,0.4),-4px_-4px_8px_rgba(255,255,255,0.85)] transition-all cursor-pointer"
                            >
                                내 종목 상세 관리
                            </button>
                        )}
                        <a
                            href="/finance"
                            className={`py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-extrabold text-center text-xs rounded-xl shadow-sm block transition-all ${
                                onNavigateSection ? '' : 'col-span-2'
                            }`}
                        >
                            주식/금융 센터 열기
                        </a>
                    </div>
                </div>

                {/* 우측: 사주팔자 오행 & 에너지 밸런스 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-sm font-black shadow-sm">
                                <i className="fas fa-yin-yang"></i>
                            </div>
                            <div>
                                <h3 className="font-extrabold text-[#1e293b] text-sm">
                                    {user?.name || '회원'}님의 사주 오행
                                </h3>
                                <p className="text-[10px] text-[#64748b]">목·화·토·금·수 에너지 밸런스</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowBirthEditor(!showBirthEditor)}
                            className="text-[11px] bg-[#e8edf2] hover:bg-white text-indigo-600 px-3 py-1.5 rounded-xl font-bold shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.8)] transition-all cursor-pointer"
                        >
                            {birthDate ? '생일 수정' : '생일 등록'}
                        </button>
                    </div>

                    {showBirthEditor ? (
                        <form onSubmit={handleSaveBirth} className="space-y-3 bg-[#e8edf2]/80 p-4 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <p className="text-xs text-[#1e293b] font-bold">
                                생년월일을 입력해 실시간 사주 오행을 확인해 보세요.
                            </p>
                            <input
                                type="date"
                                value={tempBirthDate}
                                onChange={(e) => setTempBirthDate(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-white/80 text-xs font-bold text-[#1e293b] shadow-[inset_2px_2px_4px_rgba(163,177,198,0.3),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                required
                            />
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-sm"
                                >
                                    확인
                                </button>
                                {birthDate && (
                                    <button
                                        type="button"
                                        onClick={() => setShowBirthEditor(false)}
                                        className="flex-1 py-2 bg-white/80 hover:bg-white text-[#64748b] rounded-xl text-xs font-black cursor-pointer shadow-2xs"
                                    >
                                        취소
                                    </button>
                                )}
                            </div>
                        </form>
                    ) : saju ? (
                        <div className="space-y-3.5">
                            <p className="text-xs text-[#1e293b] leading-relaxed font-bold break-keep bg-[#e8edf2]/80 p-3.5 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                                <span className="text-indigo-600 font-black">천성:</span> {saju.nature}
                            </p>
                            <div className="space-y-2 bg-white/75 p-3.5 rounded-2xl shadow-[inset_2px_2px_5px_rgba(163,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                                <div className="flex justify-between text-[11px] font-black text-[#1e293b]">
                                    <span className="text-emerald-600">목 {saju.wood}%</span>
                                    <span className="text-rose-500">화 {saju.fire}%</span>
                                    <span className="text-amber-600">토 {saju.earth}%</span>
                                    <span className="text-slate-600">금 {saju.metal}%</span>
                                    <span className="text-sky-600">수 {saju.water}%</span>
                                </div>
                                <svg
                                    viewBox="0 0 100 6"
                                    preserveAspectRatio="none"
                                    className="h-3 w-full bg-slate-200/80 rounded-full overflow-hidden block"
                                >
                                    <rect x={woodOffset} y={0} width={saju.wood} height={6} className="fill-emerald-500" />
                                    <rect x={fireOffset} y={0} width={saju.fire} height={6} className="fill-rose-500" />
                                    <rect x={earthOffset} y={0} width={saju.earth} height={6} className="fill-amber-500" />
                                    <rect x={metalOffset} y={0} width={saju.metal} height={6} className="fill-slate-400" />
                                    <rect x={waterOffset} y={0} width={saju.water} height={6} className="fill-sky-500" />
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 px-4 text-center space-y-2.5 bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <p className="text-xs text-[#64748b]">
                                생년월일을 등록하면 나만의 오행 에너지 밸런스가 표시됩니다.
                            </p>
                            <button
                                type="button"
                                onClick={() => setShowBirthEditor(true)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-black cursor-pointer shadow-sm"
                            >
                                생년월일 등록하기
                            </button>
                        </div>
                    )}

                    <Link
                        href="/entertainment/saju"
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-all"
                    >
                        전통 사주 종합 해설 열기
                    </Link>
                </div>
            </div>

            {/* 7. 내가 구독한 주제 최신 뉴스 (LIVE FEED) */}
            <div className="bg-[#f0f4f8] rounded-3xl p-6 sm:p-7 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] flex flex-col space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-sm">
                            <i className="fas fa-newspaper"></i>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-[#1e293b] text-lg tracking-tight flex items-center gap-2">
                                내가 구독한 주제 최신 뉴스
                                <span className="text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                    LIVE FEED
                                </span>
                            </h3>
                            <p className="text-xs text-[#64748b]">구독하신 맞춤 관심 주제의 실시간 관련 뉴스 피드입니다.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {newsKeywords && newsKeywords.length > 0 ? (
                                newsKeywords.map((kw, idx) => {
                                    const kwName = typeof kw === 'string' ? kw : (kw.keyword || kw.name || '');
                                    const kwId = typeof kw === 'object' ? kw.id : undefined;
                                    return (
                                        <span
                                            key={kwId || idx}
                                            className="text-xs font-black px-3 py-1 rounded-xl bg-white/90 text-indigo-700 shadow-[3px_3px_6px_rgba(163,177,198,0.3),-3px_-3px_6px_rgba(255,255,255,0.85)] flex items-center gap-1.5"
                                        >
                                            <i className="fas fa-hashtag text-[10px] text-indigo-400"></i> {kwName}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteKeyword(kwId, kwName)}
                                                className="text-slate-400 hover:text-rose-500 transition-colors ml-0.5 cursor-pointer"
                                                title="구독 해제"
                                            >
                                                <i className="fas fa-times text-[10px]"></i>
                                            </button>
                                        </span>
                                    );
                                })
                            ) : (
                                <span className="text-xs font-bold text-[#64748b] bg-[#e8edf2] px-3 py-1 rounded-xl">
                                    등록된 구독 키워드가 없습니다
                                </span>
                            )}
                        </div>
                        {onNavigateSection && (
                            <button
                                type="button"
                                onClick={() => onNavigateSection('news')}
                                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-1 active:scale-95"
                            >
                                <i className="fas fa-plus text-[11px]"></i> 주제 추가/관리
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {keywordNews && keywordNews.length > 0 ? (
                        keywordNews.slice(0, 3).map((article, idx) => (
                            <a
                                key={article.id || idx}
                                href={article.origin_url || article.url || (article.id ? `/news/${article.id}` : '/news')}
                                target={article.origin_url || article.url ? '_blank' : undefined}
                                rel={article.origin_url || article.url ? 'noopener noreferrer' : undefined}
                                className="bg-white/85 hover:bg-white border border-white/90 hover:border-indigo-300 p-4 sm:p-5 rounded-2xl shadow-[4px_4px_8px_rgba(163,177,198,0.35),-4px_-4px_8px_rgba(255,255,255,0.85)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col space-y-3 group cursor-pointer"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-100">
                                        #{article.category || article.keyword || '구독뉴스'}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#94a3b8] truncate max-w-[120px]">
                                        {article.publisher || article.source || '주요뉴스'}
                                    </span>
                                </div>
                                <h4 className="font-extrabold text-[#1e293b] text-sm line-clamp-2 group-hover:text-indigo-600 transition-colors leading-snug">
                                    {article.title}
                                </h4>
                                {article.description && (
                                    <p className="text-xs text-[#64748b] line-clamp-2 leading-relaxed font-normal">
                                        {article.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] font-extrabold text-[#94a3b8]">
                                    <span className="font-mono">
                                        {article.published_at ? String(article.published_at).substring(0, 10) : '최근'}
                                    </span>
                                    <span className="text-indigo-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                        기사 읽기 <i className="fas fa-arrow-right text-[9px]"></i>
                                    </span>
                                </div>
                            </a>
                        ))
                    ) : (
                        <div className="col-span-3 text-[#64748b] text-xs py-10 text-center bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <i className="fas fa-newspaper text-slate-400 text-2xl mb-2 block"></i>
                            구독한 주제의 뉴스 기사가 아직 등록되지 않았습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 8. 베라포인트 리워드 정산 & 맞춤 쇼핑 (2열 대칭 그리드) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 위젯 1: 베라포인트 정산 & 미션 센터 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
                        <h3 className="font-black text-[#1e293b] text-sm flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                <i className="fas fa-coins"></i>
                            </div>
                            베라포인트 정산 &amp; 미션 센터
                        </h3>
                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            POINT HUB
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <span className="text-[10px] text-amber-700 font-black">누적 베라포인트</span>
                            <span className="block text-lg font-mono font-black text-[#1e293b] mt-0.5">
                                🪙 {veraPointsData.points.toLocaleString()} P
                            </span>
                        </div>
                        <div className="p-3.5 bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                            <span className="text-[10px] text-emerald-700 font-black">정산 대기 금액</span>
                            <span className="block text-lg font-mono font-black text-[#1e293b] mt-0.5">
                                {veraPointsData.pendingAmount.toLocaleString()} 원
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2.5 bg-white/75 p-3.5 rounded-2xl shadow-[inset_2px_2px_5px_rgba(163,177,198,0.25),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                        <span className="text-[10px] text-[#64748b] font-bold block">베라포인트 활동 달성률</span>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-[#1e293b] mb-1">
                                <span>출석체크 &amp; 미션 완료</span>
                                <span className="font-mono">{veraPointsData.attendanceRatio}%</span>
                            </div>
                            <svg
                                viewBox="0 0 100 4"
                                preserveAspectRatio="none"
                                className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden block"
                            >
                                <rect
                                    x={0}
                                    y={0}
                                    width={Math.min(100, Math.max(0, veraPointsData.attendanceRatio))}
                                    height={4}
                                    className="fill-emerald-500"
                                />
                            </svg>
                        </div>
                        <div>
                            <div className="flex justify-between text-[10px] font-bold text-[#1e293b] mb-1">
                                <span>소셜 라운지 &amp; 아지트 활동</span>
                                <span className="font-mono">{veraPointsData.activityRatio}%</span>
                            </div>
                            <svg
                                viewBox="0 0 100 4"
                                preserveAspectRatio="none"
                                className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden block"
                            >
                                <rect
                                    x={0}
                                    y={0}
                                    width={Math.min(100, Math.max(0, veraPointsData.activityRatio))}
                                    height={4}
                                    className="fill-indigo-500"
                                />
                            </svg>
                        </div>
                    </div>

                    {user?.email === 'sukman@naver.com' && (
                        <Link
                            href="/reward/exchange"
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-all"
                        >
                            베라포인트 리워드 교환 신청
                        </Link>
                    )}
                </div>

                {/* 위젯 2: 나를 위한 맞춤 쇼핑 & 신박템 */}
                <div className="bg-[#f0f4f8] rounded-3xl p-6 border border-white/80 shadow-[6px_6px_12px_rgba(163,177,198,0.45),-6px_-6px_12px_rgba(255,255,255,0.85)] hover:shadow-[8px_8px_16px_rgba(163,177,198,0.5),-6px_-6px_14px_rgba(255,255,255,0.9)] transition-all flex flex-col space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200/70 pb-3">
                        <h3 className="font-black text-[#1e293b] text-sm flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                                <i className="fas fa-shopping-bag"></i>
                            </div>
                            {user?.name || '회원'}님을 위한 맞춤 쇼핑
                        </h3>
                        <span className="text-[10px] bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-2.5 py-0.5 rounded-full font-black shadow-xs flex items-center gap-1">
                            <i className="fas fa-wand-magic-sparkles text-[9px]"></i> 신박 꿀템
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        {shoppingItems && shoppingItems.length > 0 ? (
                            shoppingItems.slice(0, 2).map((item) => (
                                <a
                                    key={item.productId}
                                    href={item.productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3.5 p-2.5 rounded-2xl bg-[#e8edf2]/80 hover:bg-white shadow-[inset_2px_2px_5px_rgba(163,177,198,0.3),inset_-2px_-2px_5px_rgba(255,255,255,0.75)] border border-white/70 transition-all group"
                                >
                                    <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-200 border border-white">
                                        <img
                                            src={item.productImage}
                                            alt={item.productName}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {item.discountRate && (
                                            <span className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black px-1 rounded-bl">
                                                {item.discountRate}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {item.curationPoint && (
                                            <div className="text-[10px] font-extrabold text-indigo-700 truncate flex items-center gap-0.5 mb-0.5">
                                                <span>💡</span> {item.curationPoint}
                                            </div>
                                        )}
                                        <h4 className="text-xs font-bold text-[#1e293b] truncate group-hover:text-indigo-600 transition-colors leading-tight">
                                            {item.productName}
                                        </h4>
                                        <div className="text-xs font-black text-[#1e293b] mt-0.5">
                                            {item.productPrice?.toLocaleString()}
                                            <span className="text-[10px] font-normal text-[#64748b]">원</span>
                                        </div>
                                    </div>
                                    <div className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-xs pr-1">
                                        <i className="fas fa-chevron-right text-[10px]"></i>
                                    </div>
                                </a>
                            ))
                        ) : (
                            <div className="text-[#64748b] text-xs py-7 text-center bg-[#e8edf2]/80 rounded-2xl shadow-[inset_3px_3px_6px_rgba(163,177,198,0.35),inset_-3px_-3px_6px_rgba(255,255,255,0.75)]">
                                현재 등록된 맞춤 추천 상품이 없습니다.
                            </div>
                        )}
                    </div>

                    <Link
                        href="/shopping"
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-all"
                    >
                        스마트 쇼핑 &amp; 핫딜 센터 바로가기
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MyLifeSection;
