import React, { useState, useEffect, useMemo } from 'react';
import { CalendarScheduleSection } from './CalendarScheduleSection';

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

    return (
        <div className="animate-fade-in space-y-6">
            {/* 🌟 1. My Life 메인 헤더 & 데일리 인사 */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
                <div className="absolute left-1/3 -top-10 w-48 h-48 rounded-full bg-amber-400/10 blur-xl pointer-events-none"></div>

                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-extrabold px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
                            <i className="fas fa-sparkles text-amber-300"></i> My Life Hub
                        </span>
                        <span className="text-xs font-bold text-emerald-100/90 font-mono">
                            {todayFormatted}
                        </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                        <span>{user?.name || '회원'}님의 하루를 위한 라이프 처방</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-emerald-100 max-w-xl leading-relaxed">
                        나만의 사주 주의사항, 오늘의 실시간 날씨, 영감을 주는 명언, 스마트 일정까지 하루의 모든 라이프 흐름을 한곳에서 확인하세요.
                    </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 self-start md:self-center shrink-0">
                    <button
                        type="button"
                        onClick={() => setShowBirthEditor(!showBirthEditor)}
                        className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                        <i className="fas fa-id-card text-amber-300"></i>
                        <span>{birthDate ? '생년월일 수정' : '생년월일 등록'}</span>
                    </button>
                </div>
            </div>

            {/* 생년월일 입력 에디터 모달/패널 (토글) */}
            {showBirthEditor && (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200 shadow-md animate-fade-in">
                    <form onSubmit={handleSaveBirth} className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                                <i className="fas fa-cake-candles"></i>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-slate-800 text-sm">생년월일(사주 기준) 등록</h4>
                                <p className="text-xs text-slate-400">정확한 맞춤 사주 운세와 오늘의 주의사항 처방을 제공해 드립니다.</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <input
                                type="date"
                                value={tempBirthDate}
                                onChange={(e) => setTempBirthDate(e.target.value)}
                                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                required
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                            >
                                저장하기
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowBirthEditor(false)}
                                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition-all cursor-pointer"
                            >
                                닫기
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 🌟 2. 상단 3개 핵심 카드 그리드 (사주 주의사항, 날씨/외출 가이드, 오늘의 명언) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 🔮 카드 1: 오늘의 사주 & 조심해야 할 것 */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-sm shadow-sm shadow-rose-200 font-bold">
                                    <i className="fas fa-shield-cat"></i>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-sm">오늘의 사주 주의보</h3>
                                    <p className="text-[10px] text-slate-400">사주 일진 기반 위험 회피 가이드</p>
                                </div>
                            </div>
                            {sajuAdvisory && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                                    {sajuAdvisory.caution.badge}
                                </span>
                            )}
                        </div>

                        {sajuAdvisory ? (
                            <div className="space-y-3">
                                <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <i className={`fas ${sajuAdvisory.caution.icon} text-xs`}></i>
                                        <span className="font-black text-xs text-rose-900">
                                            🚨 {sajuAdvisory.caution.title}
                                        </span>
                                    </div>
                                    <p className="text-xs text-rose-800/90 leading-relaxed">
                                        {sajuAdvisory.caution.detail}
                                    </p>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] space-y-1.5">
                                    <div className="font-bold text-slate-700 flex items-center gap-1">
                                        <i className="fas fa-clover text-emerald-500"></i> 오늘의 행운 처방
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-slate-600 font-medium pt-1">
                                        <div>🎨 색상: <span className="font-bold text-slate-800">{sajuAdvisory.luckyColor}</span></div>
                                        <div>🔢 숫자: <span className="font-bold text-slate-800">{sajuAdvisory.luckyNumber}</span></div>
                                        <div>🧭 방향: <span className="font-bold text-slate-800">{sajuAdvisory.luckyDirection}</span></div>
                                        <div>⏰ 길시: <span className="font-bold text-slate-800">{sajuAdvisory.luckyTime}</span></div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-6 text-center space-y-3">
                                <i className="fas fa-yin-yang text-3xl text-slate-300"></i>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    생년월일을 등록하시면 매일 나에게 꼭 필요한 <strong>사주 맞춤 주의사항</strong>과 <strong>행운 요소</strong>를 보실 수 있습니다.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowBirthEditor(true)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all"
                                >
                                    생년월일 등록하기
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                        * 전통 명리학 일진 기준 실시간 분석
                    </div>
                </div>

                {/* 🌤️ 카드 2: 오늘의 날씨 & 라이프 외출 가이드 */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center text-sm shadow-sm shadow-sky-200 font-bold">
                                    <i className="fas fa-cloud-sun"></i>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-sm">실시간 날씨 & 생활 지수</h3>
                                    <p className="text-[10px] text-slate-400">{weather?.location || '날씨 정보'}</p>
                                </div>
                            </div>
                            {pm10Grade && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${pm10Grade.color}`}>
                                    미세 {pm10Grade.label}
                                </span>
                            )}
                        </div>

                        {weatherLoading ? (
                            <div className="py-8 flex items-center justify-center text-slate-400 text-xs">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-sky-500 border-t-transparent mr-2"></div>
                                날씨 정보 불러오는 중...
                            </div>
                        ) : weather ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between bg-sky-50/70 p-3.5 rounded-2xl border border-sky-200/80">
                                    <div className="flex items-center gap-3">
                                        <i className={`fas ${wxInfo.icon} text-3xl`}></i>
                                        <div>
                                            <div className="text-xl font-black text-slate-900">{weather.temp}°C</div>
                                            <div className="text-xs font-bold text-slate-500">{wxInfo.label}</div>
                                        </div>
                                    </div>
                                    <div className="text-right text-xs font-medium text-slate-500 space-y-0.5">
                                        <div>최고 <span className="font-bold text-rose-600">{weather.max}°</span></div>
                                        <div>최저 <span className="font-bold text-blue-600">{weather.min}°</span></div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5 text-slate-700">
                                    <div className="font-bold flex items-center gap-1 text-slate-800">
                                        <i className="fas fa-shirt text-indigo-500"></i> 외출 및 옷차림 팁
                                    </div>
                                    <p className="text-[11px] text-slate-600 leading-relaxed">
                                        {weather.temp >= 23 
                                            ? "통풍이 잘되는 가벼운 반팔 차림이 적당하며, 수분 보충에 신경 쓰세요." 
                                            : weather.temp >= 15 
                                                ? "일교차가 있으니 얇은 겉옷이나 가디건을 챙기시면 좋습니다." 
                                                : "쌀쌀하니 따뜻한 외투를 입으시고 보온에 유의하세요."}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 py-6 text-center">날씨 정보를 가져올 수 없습니다.</p>
                        )}
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                        * Open-Meteo 실시간 기상 데이터
                    </div>
                </div>

                {/* 💡 카드 3: 오늘의 명언 & 영감 */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4">
                    <div>
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm shadow-sm shadow-amber-200 font-bold">
                                    <i className="fas fa-lightbulb"></i>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 text-sm">오늘의 지혜 & 명언</h3>
                                    <p className="text-[10px] text-slate-400">하루를 깨우는 마인드셋</p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                #{currentQuote.category}
                            </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                            <div className="flex gap-2">
                                <i className="fas fa-quote-left text-amber-400 text-lg shrink-0"></i>
                                <p className="font-bold text-xs sm:text-sm text-slate-800 leading-relaxed">
                                    "{currentQuote.quote}"
                                </p>
                            </div>
                            <div className="text-right text-xs font-black text-amber-900">
                                — {currentQuote.author}
                            </div>
                        </div>

                        <div className="mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[11px] text-slate-600 flex items-center gap-2">
                            <i className="fas fa-heart text-rose-500 shrink-0"></i>
                            <span>오늘 하루도 긍정의 힘으로 힘차게 시작해 보세요!</span>
                        </div>
                    </div>

                    <div className="text-[10px] text-slate-400 text-right">
                        * 매일 새로워지는 365 Daily Wisdom
                    </div>
                </div>
            </div>

            {/* 🌟 3. 하단: 스마트 캘린더 & 일정 관리 섹션 */}
            <div className="pt-2">
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
        </div>
    );
};

export default MyLifeSection;
