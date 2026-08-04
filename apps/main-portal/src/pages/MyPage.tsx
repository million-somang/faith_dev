import { useEffect, useState, useMemo } from 'react';
import { Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { PreferenceWizard } from '../components/homepage/PreferenceWizard';
import { MobileTabEditor } from '../components/homepage/MobileTabEditor';
import { useUserPreferenceContext } from '../context/UserPreferenceContext';
import { HomepageConfig, DEFAULT_HOMEPAGE_CONFIG } from '../types/homepage.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// ─── 명리학 사주 연산 이식 (사주 미니앱 알고리즘 일치) ───
const CHEONGAN = ['갑(甲)', '을(을)', '병(丙)', '정(丁)', '무(戊)', '기(己)', '경(庚)', '신(辛)', '임(壬)', '계(癸)'];
const JIJI = ['자(子)', '축(丑)', '인(寅)', '묘(卯)', '진(辰)', '사(巳)', '오(午)', '미(未)', '신(申)', '유(酉)', '술(戌)', '해(亥)'];
const CHEONGAN_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '갑(甲)': 'wood', '을(을)': 'wood', '병(丙)': 'fire', '정(丁)': 'fire', '무(戊)': 'earth', '기(己)': 'earth', '경(庚)': 'metal', '신(辛)': 'metal', '임(壬)': 'water', '계(癸)': 'water'
};
const JIJI_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '인(寅)': 'wood', '묘(卯)': 'wood', '사(巳)': 'fire', '오(午)': 'fire', '진(辰)': 'earth', '미(未)': 'earth', '술(戌)': 'earth', '축(丑)': 'earth', '신(申)': 'metal', '유(酉)': 'metal', '자(子)': 'water', '해(亥)': 'water'
};

const SCHEDULE_COLOR_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; badge: string; dot: string }> = {
    blue: { label: '업무', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200/80', badge: 'bg-blue-500 text-white', dot: 'bg-blue-500' },
    emerald: { label: '개인', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200/80', badge: 'bg-emerald-500 text-white', dot: 'bg-emerald-500' },
    amber: { label: '미팅', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200/80', badge: 'bg-amber-500 text-white', dot: 'bg-amber-500' },
    rose: { label: '중요', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200/80', badge: 'bg-rose-500 text-white', dot: 'bg-rose-500' },
    purple: { label: '기타', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200/80', badge: 'bg-purple-500 text-white', dot: 'bg-purple-500' },
};

function getSeedHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

function calculateSaju(name: string, dateStr: string): { wood: number; fire: number; earth: number; metal: number; water: number; nature: string } {
    const seed = getSeedHash(`${name}_${dateStr}`);

    const yearIndex = (seed % 10);
    const yearJijiIndex = ((seed + 2) % 12);
    const monthIndex = ((seed + 3) % 10);
    const monthJijiIndex = ((seed + 5) % 12);
    const dayIndex = ((seed + 7) % 10);
    const dayJijiIndex = ((seed + 1) % 12);

    const yearGan = CHEONGAN[yearIndex];
    const yearJi = JIJI[yearJijiIndex];
    const monthGan = CHEONGAN[monthIndex];
    const monthJi = JIJI[monthJijiIndex];
    const dayGan = CHEONGAN[dayIndex];
    const dayJi = JIJI[dayJijiIndex];

    const eightCharacters = [
        { type: 'gan', elem: CHEONGAN_ELEMENT[yearGan] },
        { type: 'ji', elem: JIJI_ELEMENT[yearJi] },
        { type: 'gan', elem: CHEONGAN_ELEMENT[monthGan] },
        { type: 'ji', elem: JIJI_ELEMENT[monthJi] },
        { type: 'gan', elem: CHEONGAN_ELEMENT[dayGan] },
        { type: 'ji', elem: JIJI_ELEMENT[dayJi] }
    ];

    const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
    eightCharacters.forEach((char, idx) => {
        let weight = 10;
        if (char.type === 'ji') weight = 15;
        if (idx === 4) weight = 20; // 일간 가중치
        counts[char.elem] += weight;
    });

    const totalWeight = Object.values(counts).reduce((a, b) => a + b, 0);
    const elements = {
        wood: Math.round((counts.wood / totalWeight) * 100),
        fire: Math.round((counts.fire / totalWeight) * 100),
        earth: Math.round((counts.earth / totalWeight) * 100),
        metal: Math.round((counts.metal / totalWeight) * 100),
        water: Math.round((counts.water / totalWeight) * 100)
    };

    // 보정
    const sum = elements.wood + elements.fire + elements.earth + elements.metal + elements.water;
    if (sum !== 100) {
        elements.wood += (100 - sum);
    }

    const dayElement = CHEONGAN_ELEMENT[dayGan];
    let nature = "";
    if (dayElement === 'wood') {
        nature = "자비롭고 선구적인 목(木)의 성향을 타고나 성장 역량이 뛰어납니다.";
    } else if (dayElement === 'fire') {
        nature = "명랑하고 정의로운 화(火)의 기운을 가져 표현과 사교성이 풍부합니다.";
    } else if (dayElement === 'earth') {
        nature = "듬직하고 포용력 있는 토(土)의 기운으로 주위의 신망이 아주 두텁습니다.";
    } else if (dayElement === 'metal') {
        nature = "결단력 있고 강한 의지의 금(金)의 기질로 매사에 빈틈없이 추진합니다.";
    } else {
        nature = "유연하고 지혜로운 수(水)의 성질로 뛰어난 적응력과 임기응변을 보입니다.";
    }

    return { ...elements, nature };
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function MyPage() {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    const [isPushSubscribed, setIsPushSubscribed] = useState(false);
    const [pushLoading, setPushLoading] = useState(false);

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    setIsPushSubscribed(!!sub);
                });
            });
        }
    }, []);

    const handleTogglePush = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            alert('이 브라우저는 웹 푸시 알림을 지원하지 않습니다.');
            return;
        }

        try {
            setPushLoading(true);
            const perm = await Notification.requestPermission();
            if (perm !== 'granted') {
                alert('알림 권한이 거부되었습니다. 브라우저 설정에서 알림 권한을 허용해 주세요.');
                setPushLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            let sub = await registration.pushManager.getSubscription();

            if (sub) {
                // Unsubscribe
                await sub.unsubscribe();
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
                await instance.delete('/api/user/push-subscription', { data: { endpoint: sub.endpoint } });
                setIsPushSubscribed(false);
                alert('일정 1시간 전 푸시 알림이 해제되었습니다.');
            } else {
                // Subscribe
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
                const keyRes = await instance.get('/api/user/push-key');
                if (!keyRes.data || !keyRes.data.publicKey) {
                    throw new Error('VAPID public key load failed');
                }
                const convertedKey = urlBase64ToUint8Array(keyRes.data.publicKey);
                sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedKey
                });

                await instance.post('/api/user/push-subscription', {
                    subscription: sub.toJSON()
                });

                setIsPushSubscribed(true);
                alert('🔔 일정 1시간 전 모바일 푸시 알림이 성공적으로 설정되었습니다!');
            }
        } catch (err) {
            console.error('Push toggle error:', err);
            alert('푸시 알림 설정 중 오류가 발생했습니다.');
        } finally {
            setPushLoading(false);
        }
    };

    // ─── activeSection 디폴트를 dashboard(나의 홈)로 개편 ───
    const [activeSection, setActiveSection] = useState<'dashboard' | 'news' | 'stocks' | 'games' | 'utils' | 'home-customize'>('dashboard');
    const [showWizard, setShowWizard] = useState(false);
    const { config: homeConfig, isSaving: isHomeSaving, updateConfig: updateHomeConfig, saveConfig: saveHomeConfig } = useUserPreferenceContext();
    const [mobileTabsSaved, setMobileTabsSaved] = useState(false);

    const currentMobileTabs = homeConfig.mobileTabs && homeConfig.mobileTabs.length > 0
        ? homeConfig.mobileTabs
        : DEFAULT_HOMEPAGE_CONFIG.mobileTabs;

    const handleMobileTabsChange = (ids: string[]) => {
        updateHomeConfig({ mobileTabs: ids });
        setMobileTabsSaved(false);
    };

    const handleSaveMobileTabs = async () => {
        const ok = await saveHomeConfig({ mobileTabs: currentMobileTabs });
        if (ok) {
            setMobileTabsSaved(true);
            setTimeout(() => setMobileTabsSaved(false), 2000);
        }
    };

const DEFAULT_WATCHLIST = [
    { id: 1, stock_symbol: '005930', stock_name: 'SamsungElec', market_type: 'KR', target_price: 249500 },
    { id: 2, stock_symbol: '000660', stock_name: 'SK hynix', market_type: 'KR', target_price: 1759000 }
];

// ... inside MyPage component ...
    // 데이터 상태 관리
    const [newsData, setNewsData] = useState<{ keywords: any[], keywordNews: any[], bookmarks: any[] }>({ keywords: [], keywordNews: [], bookmarks: [] });
    const [stocksData, setStocksData] = useState<{ stats: any, watchlist: any[] }>({ stats: {}, watchlist: DEFAULT_WATCHLIST });
    const [gamesData, setGamesData] = useState<{ stats: any, history: any[] }>({ stats: {}, history: [] });
    const [utilsData, setUtilsData] = useState<{ settings: any, history: any[] }>({ settings: {}, history: [] });
    const [loading, setLoading] = useState(false);

    // 뉴스 키워드/주제 추가 및 삭제 처리
    const [newKeywordInput, setNewKeywordInput] = useState('');
    const [isSubmittingKeyword, setIsSubmittingKeyword] = useState(false);

    const handleAddKeyword = async (keywordToAdd?: string) => {
        const targetKeyword = (keywordToAdd || newKeywordInput).trim();
        if (!targetKeyword) return;

        setIsSubmittingKeyword(true);
        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.post('/api/user/keywords', { keyword: targetKeyword });
            if (res.data && res.data.success !== false) {
                setNewKeywordInput('');
                const [kwRes, kwNewsRes] = await Promise.all([
                    instance.get('/api/user/keywords').catch(() => ({ data: {} })),
                    instance.get('/api/user/news/keywords?limit=5').catch(() => ({ data: {} }))
                ]);
                setNewsData(prev => ({
                    ...prev,
                    keywords: kwRes.data.keywords || [],
                    keywordNews: kwNewsRes.data.news || []
                }));
            }
        } catch (err) {
            console.error('Failed to add keyword:', err);
        } finally {
            setIsSubmittingKeyword(false);
        }
    };

    const handleDeleteKeyword = async (keywordId?: number | string, keywordName?: string) => {
        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            if (keywordId) {
                await instance.delete(`/api/user/keywords/${keywordId}`);
            } else if (keywordName) {
                // Find matching keyword in newsData.keywords
                const matched = newsData.keywords.find((k: any) => (typeof k === 'string' ? k : k.keyword) === keywordName);
                if (matched && matched.id) {
                    await instance.delete(`/api/user/keywords/${matched.id}`);
                }
            }
            const [kwRes, kwNewsRes] = await Promise.all([
                instance.get('/api/user/keywords').catch(() => ({ data: {} })),
                instance.get('/api/user/news/keywords?limit=5').catch(() => ({ data: {} }))
            ]);
            setNewsData(prev => ({
                ...prev,
                keywords: kwRes.data.keywords || [],
                keywordNews: kwNewsRes.data.news || []
            }));
        } catch (err) {
            console.error('Failed to delete keyword:', err);
        }
    };

    const [veraPointsData, setVeraPointsData] = useState<{
        points: number;
        pendingAmount: number;
        attendanceRatio: number;
        activityRatio: number;
    }>({
        points: 0,
        pendingAmount: 0,
        attendanceRatio: 0,
        activityRatio: 0
    });

    const [bizAgenda, setBizAgenda] = useState<{ id: number | string; schedule_date?: string; end_date?: string; schedule_time?: string; end_time?: string; time?: string; schedule_text?: string; text?: string; color?: string }[]>([]);
    const todayStr = useMemo(() => new Date().toISOString().substring(0, 10), []);
    const [calYear, setCalYear] = useState(() => new Date().getFullYear());
    const [calMonth, setCalMonth] = useState(() => new Date().getMonth() + 1);
    const [selectedDate, setSelectedDate] = useState<string | null>(todayStr);

    const [newAgendaDate, setNewAgendaDate] = useState(todayStr);
    const [newAgendaEndDate, setNewAgendaEndDate] = useState(todayStr);
    const [newAgendaTime, setNewAgendaTime] = useState('09:00');
    const [newAgendaEndTime, setNewAgendaEndTime] = useState('18:00');
    const [newAgendaText, setNewAgendaText] = useState('');
    const [newAgendaColor, setNewAgendaColor] = useState('blue');
    const [isAllDay, setIsAllDay] = useState(false);

    const handleToggleAllDay = () => {
        if (!isAllDay) {
            setIsAllDay(true);
            setNewAgendaTime('00:00');
            setNewAgendaEndTime('23:59');
        } else {
            setIsAllDay(false);
            setNewAgendaTime('09:00');
            setNewAgendaEndTime('18:00');
        }
    };

    const handleSetPresetDuration = (days: number) => {
        if (!newAgendaDate) return;
        const sDate = new Date(newAgendaDate);
        sDate.setDate(sDate.getDate() + (days - 1));
        const eStr = sDate.toISOString().substring(0, 10);
        setNewAgendaEndDate(eStr);
    };

    const handleAddAgenda = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgendaText.trim()) return;
        const targetDate = newAgendaDate || todayStr;
        let targetEndDate = newAgendaEndDate || targetDate;
        if (targetEndDate < targetDate) targetEndDate = targetDate;
        const targetTime = isAllDay ? '00:00' : (newAgendaTime || '09:00');
        const targetEndTime = isAllDay ? '23:59' : (newAgendaEndTime || '18:00');
        const targetColor = newAgendaColor || 'blue';
        const targetText = newAgendaText.trim();

        const newItem = {
            id: Date.now(),
            schedule_date: targetDate,
            end_date: targetEndDate,
            schedule_time: targetTime,
            end_time: targetEndTime,
            schedule_text: targetText,
            color: targetColor
        };

        // UI & LocalStorage 우선 즉시 업데이트 (항상 저장 보장)
        setBizAgenda(prev => {
            const updated = [...prev, newItem];
            localStorage.setItem('faith_user_schedules', JSON.stringify(updated));
            return updated;
        });
        setNewAgendaText('');
        setSelectedDate(targetDate);

        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.post('/api/user/schedules', {
                date: targetDate,
                endDate: targetEndDate,
                time: targetTime,
                endTime: targetEndTime,
                text: targetText,
                color: targetColor
            });
            if (res.data && res.data.success && Array.isArray(res.data.schedules) && res.data.schedules.length > 0) {
                setBizAgenda(res.data.schedules);
                localStorage.setItem('faith_user_schedules', JSON.stringify(res.data.schedules));
            }
        } catch (err) {
            console.error('API call failed, schedule saved to local storage:', err);
        }
    };

    const handleRemoveAgenda = async (id: number | string) => {
        setBizAgenda(prev => {
            const updated = prev.filter(item => item.id !== id);
            localStorage.setItem('faith_user_schedules', JSON.stringify(updated));
            return updated;
        });

        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.delete(`/api/user/schedules/${id}`);
            if (res.data && res.data.success && Array.isArray(res.data.schedules)) {
                setBizAgenda(res.data.schedules);
                localStorage.setItem('faith_user_schedules', JSON.stringify(res.data.schedules));
            }
        } catch (err) {
            console.error('Failed to delete schedule on server:', err);
        }
    };

    const handlePrevMonth = () => {
        if (calMonth === 1) {
            setCalYear(y => y - 1);
            setCalMonth(12);
        } else {
            setCalMonth(m => m - 1);
        }
    };

    const handleNextMonth = () => {
        if (calMonth === 12) {
            setCalYear(y => y + 1);
            setCalMonth(1);
        } else {
            setCalMonth(m => m + 1);
        }
    };

    const handleGoToday = () => {
        const now = new Date();
        setCalYear(now.getFullYear());
        setCalMonth(now.getMonth() + 1);
        const dateStr = now.toISOString().substring(0, 10);
        setSelectedDate(dateStr);
        setNewAgendaDate(dateStr);
    };

    const calendarDays = useMemo(() => {
        const firstDay = new Date(calYear, calMonth - 1, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth, 0).getDate();
        const daysInPrevMonth = new Date(calYear, calMonth - 1, 0).getDate();

        const cells = [];

        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const prevM = calMonth === 1 ? 12 : calMonth - 1;
            const prevY = calMonth === 1 ? calYear - 1 : calYear;
            const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            cells.push({
                dateStr,
                dayNum,
                isCurrentMonth: false,
                isToday: dateStr === todayStr
            });
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${calYear}-${String(calMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                dateStr,
                dayNum: d,
                isCurrentMonth: true,
                isToday: dateStr === todayStr
            });
        }

        const remaining = (7 - (cells.length % 7)) % 7;
        for (let d = 1; d <= remaining; d++) {
            const nextM = calMonth === 12 ? 1 : calMonth + 1;
            const nextY = calMonth === 12 ? calYear + 1 : calYear;
            const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            cells.push({
                dateStr,
                dayNum: d,
                isCurrentMonth: false,
                isToday: dateStr === todayStr
            });
        }

        return cells;
    }, [calYear, calMonth, todayStr]);

    const schedulesByDate = useMemo(() => {
        const map: Record<string, typeof bizAgenda> = {};
        bizAgenda.forEach(item => {
            const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : todayStr;
            const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;

            let curr = new Date(sDate);
            const end = new Date(eDate);
            let limit = 0;
            while (curr <= end && limit < 365) {
                const dateKey = curr.toISOString().substring(0, 10);
                if (!map[dateKey]) map[dateKey] = [];
                map[dateKey].push(item);
                curr.setDate(curr.getDate() + 1);
                limit++;
            }
        });
        return map;
    }, [bizAgenda, todayStr]);

    const displaySchedules = useMemo(() => {
        if (selectedDate) {
            return bizAgenda.filter(item => {
                const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : todayStr;
                const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;
                return selectedDate >= sDate && selectedDate <= eDate;
            });
        }
        const yearMonthPrefix = `${calYear}-${String(calMonth).padStart(2, '0')}`;
        return bizAgenda.filter(item => {
            const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : todayStr;
            const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;
            return sDate.startsWith(yearMonthPrefix) || eDate.startsWith(yearMonthPrefix) || (sDate <= `${yearMonthPrefix}-31` && eDate >= `${yearMonthPrefix}-01`);
        });
    }, [bizAgenda, selectedDate, calYear, calMonth, todayStr]);

    // 생년월일 관리 로컬 스토리지 연동
    const [birthDate, setBirthDate] = useState(localStorage.getItem('user_birth_date') || '');
    const [tempBirthDate, setTempBirthDate] = useState(birthDate);
    const [showBirthEditor, setShowBirthEditor] = useState(!birthDate);

    const handleSaveBirth = (e: React.FormEvent) => {
        e.preventDefault();
        if (!tempBirthDate) return;
        localStorage.setItem('user_birth_date', tempBirthDate);
        setBirthDate(tempBirthDate);
        setShowBirthEditor(false);
    };

    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/', { replace: true });
        }
    }, [user, isLoading, navigate]);

    useEffect(() => {
        if (!user) return;

        const loadSectionData = async () => {
            setLoading(true);
            try {
                const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });

                // ─── 대시보드(나의 홈)일 때는 모든 데이터를 일괄 취합해서 가져옴 ───
                if (activeSection === 'dashboard') {
                    const [kwRes, kwNewsRes, bmRes, statsStocksRes, wlRes, statsGamesRes, historyGamesRes, schedulesRes, veraPointsRes] = await Promise.all([
                        instance.get(`/api/user/keywords`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/news/keywords?limit=6`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/bookmarks?page=1&limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/games/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/games/history?limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/schedules`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/vera-points`).catch(() => ({ data: {} }))
                    ]);

                    const fetchedWatchlist = (wlRes.data && Array.isArray(wlRes.data.stocks) && wlRes.data.stocks.length > 0)
                        ? wlRes.data.stocks
                        : DEFAULT_WATCHLIST;

                    const activeKeywords = (kwRes.data && Array.isArray(kwRes.data.keywords) && kwRes.data.keywords.length > 0)
                        ? kwRes.data.keywords
                        : (kwNewsRes.data && kwNewsRes.data.keywords ? kwNewsRes.data.keywords : []);

                    setNewsData({
                        keywords: activeKeywords,
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                    setStocksData({
                        stats: statsStocksRes.data.stats || {},
                        watchlist: fetchedWatchlist
                    });
                    setGamesData({
                        stats: statsGamesRes.data.stats || {},
                        history: historyGamesRes.data.history?.history || []
                    });
                    const localSavedSchedules = JSON.parse(localStorage.getItem('faith_user_schedules') || '[]');
                    const fetchedSchedules = (schedulesRes.data && Array.isArray(schedulesRes.data.schedules) && schedulesRes.data.schedules.length > 0)
                        ? schedulesRes.data.schedules
                        : localSavedSchedules;
                    setBizAgenda(fetchedSchedules);

                    if (veraPointsRes.data && veraPointsRes.data.success) {
                        setVeraPointsData({
                            points: veraPointsRes.data.points ?? 0,
                            pendingAmount: veraPointsRes.data.pendingAmount ?? 0,
                            attendanceRatio: veraPointsRes.data.attendanceRatio ?? 0,
                            activityRatio: veraPointsRes.data.activityRatio ?? 0
                        });
                    }
                }
                
                // 기존 개별 탭 렌더링용 API 호출
                else if (activeSection === 'news') {
                    const [kwRes, kwNewsRes, bmRes] = await Promise.all([
                        instance.get(`/api/user/keywords`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/news/keywords?limit=5`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/bookmarks?page=1&limit=10`).catch(() => ({ data: {} }))
                    ]);
                    setNewsData({
                        keywords: kwRes.data.keywords || [],
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                } else if (activeSection === 'stocks') {
                    const [statsRes, wlRes] = await Promise.all([
                        instance.get(`/api/user/watchlist/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist`).catch(() => ({ data: {} }))
                    ]);
                    const fetchedWatchlist = (wlRes.data && Array.isArray(wlRes.data.stocks) && wlRes.data.stocks.length > 0)
                        ? wlRes.data.stocks
                        : DEFAULT_WATCHLIST;
                    setStocksData({
                        stats: statsRes.data.stats || {},
                        watchlist: fetchedWatchlist
                    });
                } else if (activeSection === 'games') {
                    const [statsRes, historyRes] = await Promise.all([
                        instance.get(`/api/user/games/stats`),
                        instance.get(`/api/user/games/history?limit=10`)
                    ]);
                    setGamesData({
                        stats: statsRes.data.stats || {},
                        history: historyRes.data.history?.history || []
                    });
                } else if (activeSection === 'utils') {
                    const [settingsRes, historyRes] = await Promise.all([
                        instance.get(`/api/user/utils/settings`),
                        instance.get(`/api/user/utils/history?limit=10`)
                    ]);
                    setUtilsData({
                        settings: settingsRes.data.settings || {},
                        history: historyRes.data.history || []
                    });
                }
            } catch (error) {
                console.error(`Failed to load data for ${activeSection}:`, error);
            } finally {
                setLoading(false);
            }
        };

        loadSectionData();
    }, [activeSection, user]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // 로그인 회원의 사주 계산 작동
    const saju = birthDate ? calculateSaju(user.name, birthDate) : null;

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <Header user={user} onLogout={logout} />

            <div className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                
                {/* 상단 히어로 마이포탈 헤더 */}
                <div className="mb-8 bg-gradient-to-r from-violet-600 to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
                    <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
                                Personal Portal
                            </span>
                            <h1 className="text-3xl font-black tracking-tight mt-2 flex items-center gap-2">
                                <i className="fas fa-house-user"></i> 나만의 홈페이지
                            </h1>
                            <p className="text-violet-100 text-xs sm:text-sm font-semibold mt-1">
                                {user.name}님을 위해 실시간 연동된 뉴스, 주식, 게임 전적 및 사주 오행 대시보드입니다.
                            </p>
                        </div>
                        {user.email && (
                            <div className="text-xs sm:text-right font-medium opacity-90">
                                <i className="fas fa-envelope mr-1.5"></i>{user.email}
                            </div>
                        )}
                    </div>
                </div>

                {/* 히어로 배너 바로 아래: 상단 가로 탭 바 (Horizontal Tab Bar) */}
                <div className="bg-white rounded-2xl shadow-sm p-2 border border-slate-200/80 mb-6">
                    <nav className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar p-1">
                        <button
                            onClick={() => setActiveSection('dashboard')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'dashboard'
                                    ? 'bg-violet-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-house-user text-sm"></i>
                            <span>나의 홈</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('news')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'news'
                                    ? 'bg-sky-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-newspaper text-sm"></i>
                            <span>뉴스</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('stocks')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'stocks'
                                    ? 'bg-emerald-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-chart-line text-sm"></i>
                            <span>주식</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('games')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'games'
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-gamepad text-sm"></i>
                            <span>게임</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('utils')}
                            className={`flex-1 min-w-[110px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'utils'
                                    ? 'bg-orange-500 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-tools text-sm"></i>
                            <span>유틸리티</span>
                        </button>
                        <button
                            onClick={() => setActiveSection('home-customize')}
                            className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                activeSection === 'home-customize'
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 font-bold'
                            }`}
                        >
                            <i className="fas fa-magic text-sm"></i>
                            <span>홈 꾸미기</span>
                        </button>
                    </nav>
                </div>

                {/* 메인 컨텐츠 영역 (100% 전체 너비로 확장) */}
                <div className="w-full">
                    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8 border border-slate-200/80 min-h-[500px]">
                            {loading ? (
                                <div className="h-full flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-slate-400"></div>
                                </div>
                            ) : (
                                <>
                                    {/* ─── [신설] 나만의 홈 대시보드 뷰 ─── */}
                                    {activeSection === 'dashboard' && (
                                        <div className="animate-fade-in space-y-6">
                                            {/* 📰 [맨 윗부분] 내가 구독한 주제의 최신 뉴스 (Subscribed Topic News Feed) */}
                                            <div className="border border-sky-100 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-sky-50/70 via-white to-indigo-50/40 shadow-2xs flex flex-col gap-5">
                                                {/* 상단 헤더 & 구독 키워드 뱃지 목록 */}
                                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100/80 pb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-sky-200">
                                                            <i className="fas fa-newspaper"></i>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-2">
                                                                내가 구독한 주제 최신 뉴스
                                                                <span className="text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
                                                                    LIVE FEED
                                                                </span>
                                                            </h3>
                                                            <p className="text-xs text-slate-400">구독하신 맞춤 관심 주제의 실시간 관련 뉴스 피드입니다.</p>
                                                        </div>
                                                    </div>

                                                    {/* 구독중인 키워드 태그 뱃지 목록 & 키워드 설정 이동 버튼 */}
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {newsData.keywords && newsData.keywords.length > 0 ? (
                                                                newsData.keywords.map((kw: any, idx: number) => {
                                                                    const kwName = typeof kw === 'string' ? kw : (kw.keyword || kw.name || '');
                                                                    const kwId = typeof kw === 'object' ? kw.id : null;
                                                                    return (
                                                                        <span key={kwId || idx} className="text-xs font-black px-3 py-1 rounded-xl bg-white border border-sky-200 text-sky-700 shadow-2xs flex items-center gap-1.5">
                                                                            <i className="fas fa-hashtag text-[10px] text-sky-400"></i> {kwName}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleDeleteKeyword(kwId, kwName)}
                                                                                className="text-sky-300 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                                                                title="구독 해제"
                                                                            >
                                                                                <i className="fas fa-times text-[10px]"></i>
                                                                            </button>
                                                                        </span>
                                                                    );
                                                                })
                                                            ) : (
                                                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
                                                                    기본 추천 키워드 (AI, 경제, IT, 기술, 금융)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveSection('news')}
                                                            className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-1 active:scale-98"
                                                        >
                                                            <i className="fas fa-plus text-[11px]"></i> 주제 추가/관리
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 구독 뉴스 기사 카드 그리드 (3열) */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {newsData.keywordNews && newsData.keywordNews.length > 0 ? (
                                                        newsData.keywordNews.slice(0, 3).map((article: any, idx: number) => (
                                                            <a
                                                                key={article.id || idx}
                                                                href={article.origin_url || article.url || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-white border border-slate-200/90 hover:border-sky-400 p-4 sm:p-5 rounded-2xl shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                                                            >
                                                                <div>
                                                                    <div className="flex items-center justify-between gap-2 mb-2.5">
                                                                        <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded-md bg-sky-50 text-sky-600 border border-sky-100">
                                                                            #{article.category || article.keyword || '구독뉴스'}
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">
                                                                            {article.publisher || article.source || '주요뉴스'}
                                                                        </span>
                                                                    </div>
                                                                    <h4 className="font-extrabold text-slate-800 text-sm line-clamp-2 group-hover:text-sky-600 transition-colors leading-snug">
                                                                        {article.title}
                                                                    </h4>
                                                                    {article.description && (
                                                                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed font-normal">
                                                                            {article.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[10px] font-extrabold text-slate-400">
                                                                    <span className="font-mono">{article.published_at ? String(article.published_at).substring(0, 10) : '최근'}</span>
                                                                    <span className="text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                                                                        기사 읽기 <i className="fas fa-arrow-right text-[9px]"></i>
                                                                    </span>
                                                                </div>
                                                            </a>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-3 text-slate-400 text-xs py-10 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                                                            <i className="fas fa-newspaper text-slate-300 text-2xl mb-2 block"></i>
                                                            구독한 주제의 뉴스 기사를 불러오는 중이거나 아직 등록된 뉴스가 없습니다.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                
                                                {/* 위젯 1: 나의 월별 일정 달력 (Monthly Calendar & Color-Coded Schedule) */}
                                                <div className="md:col-span-2 border border-slate-200 rounded-3xl p-5 sm:p-6 bg-white shadow-sm flex flex-col gap-6">
                                                    {/* 상단 캘린더 헤더 & 월 이동 컨트롤 */}
                                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg border border-emerald-100 shadow-sm">
                                                                <i className="fas fa-calendar-alt"></i>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-extrabold text-slate-800 text-lg tracking-tight flex items-center gap-2">
                                                                    나의 일정 달력
                                                                    {selectedDate && (
                                                                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                                            {selectedDate} 선택됨
                                                                        </span>
                                                                    )}
                                                                </h3>
                                                                <p className="text-xs text-slate-400">월별 달력과 카테고리 색상으로 일정을 손쉽게 관리하세요.</p>
                                                            </div>
                                                        </div>

                                                        {/* 월 네비게이션 */}
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={handlePrevMonth}
                                                                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center text-xs font-bold transition-all"
                                                                title="이전 달"
                                                            >
                                                                <i className="fas fa-chevron-left"></i>
                                                            </button>
                                                            <span className="font-extrabold text-slate-800 font-mono text-base px-2">
                                                                {calYear}년 {calMonth}월
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={handleNextMonth}
                                                                className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center text-xs font-bold transition-all"
                                                                title="다음 달"
                                                            >
                                                                <i className="fas fa-chevron-right"></i>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={handleGoToday}
                                                                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
                                                            >
                                                                오늘
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={handleTogglePush}
                                                                disabled={pushLoading}
                                                                className={`ml-2 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                                                                    isPushSubscribed
                                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                                                        : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                                                                }`}
                                                                title="일정 1시간 전 모바일 푸시 알림 설정"
                                                            >
                                                                <i className={`fas ${isPushSubscribed ? 'fa-bell text-emerald-600' : 'fa-bell-slash text-slate-900'} ${pushLoading ? 'animate-spin' : ''}`}></i>
                                                                {pushLoading ? '설정 중...' : isPushSubscribed ? '1시간 전 알림 켜짐' : '🔔 1시간 전 알림 켜기'}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* 본문: 달력 그리드 (좌측 3열) + 일정 등록/목록 (우측 2열) */}
                                                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                                                        {/* 좌측 (3/5): 7×6 월별 달력 그리드 */}
                                                        <div className="lg:col-span-3 flex flex-col">
                                                            {/* 요일 헤더 */}
                                                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                                                {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                                                                    <div
                                                                        key={day}
                                                                        className={`text-xs font-black py-1.5 rounded-lg ${
                                                                            idx === 0 ? 'text-rose-500 bg-rose-50/50' : idx === 6 ? 'text-blue-500 bg-blue-50/50' : 'text-slate-500 bg-slate-50'
                                                                        }`}
                                                                    >
                                                                        {day}
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* 날짜 셀 그리드 */}
                                                            <div className="grid grid-cols-7 gap-1.5">
                                                                {calendarDays.map((cell: any) => {
                                                                    const daySchedules = schedulesByDate[cell.dateStr] || [];
                                                                    const isSelected = selectedDate === cell.dateStr;

                                                                    return (
                                                                        <div
                                                                            key={cell.dateStr}
                                                                            onClick={() => {
                                                                                setSelectedDate(cell.dateStr);
                                                                                setNewAgendaDate(cell.dateStr);
                                                                                setNewAgendaEndDate(cell.dateStr);
                                                                            }}
                                                                            className={`min-h-[68px] sm:min-h-[78px] p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                                                                                !cell.isCurrentMonth
                                                                                    ? 'bg-slate-50/40 border-slate-100 opacity-40 hover:opacity-80'
                                                                                    : isSelected
                                                                                    ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-400 shadow-sm'
                                                                                    : cell.isToday
                                                                                    ? 'bg-amber-50/60 border-amber-300 font-bold'
                                                                                    : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
                                                                            }`}
                                                                        >
                                                                            {/* 날짜 숫자 & 오늘 표시 */}
                                                                            <div className="flex justify-between items-center w-full">
                                                                                <span className={`text-xs font-black font-mono leading-none ${
                                                                                    cell.isToday
                                                                                        ? 'bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md text-[10px]'
                                                                                        : isSelected
                                                                                        ? 'text-emerald-700'
                                                                                        : cell.isCurrentMonth
                                                                                        ? 'text-slate-700'
                                                                                        : 'text-slate-400'
                                                                                }`}>
                                                                                    {cell.dayNum}
                                                                                </span>
                                                                                {daySchedules.length > 0 && (
                                                                                    <span className="text-[9px] font-mono font-black text-slate-500 bg-slate-100 px-1 rounded-md">
                                                                                        {daySchedules.length}
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            {/* 일정을 나타내는 색상 dot / pill 뱃지 */}
                                                                            <div className="flex flex-col gap-1 mt-1 overflow-hidden max-h-[38px]">
                                                                                {daySchedules.slice(0, 2).map((sched: any) => {
                                                                                    const cConfig = SCHEDULE_COLOR_CONFIG[sched.color || 'blue'] || SCHEDULE_COLOR_CONFIG.blue;
                                                                                    return (
                                                                                        <div
                                                                                            key={sched.id}
                                                                                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate border ${cConfig.bg} ${cConfig.text} ${cConfig.border}`}
                                                                                        >
                                                                                            {sched.schedule_text || sched.text}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                                {daySchedules.length > 2 && (
                                                                                    <span className="text-[8px] font-bold text-slate-400 pl-0.5">
                                                                                        +{daySchedules.length - 2}개 더보기
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* 우측 (2/5): 선택 날짜 일정 추가 폼 & 일정 목록 */}
                                                        <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                                                            {/* 일정 추가 폼 */}
                                                            <div>
                                                                <h4 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center justify-between">
                                                                    <span className="flex items-center gap-1.5">
                                                                        <i className="fas fa-plus-circle text-emerald-600"></i> 일정 추가
                                                                    </span>
                                                                    <span className="text-xs font-mono font-semibold text-slate-500">
                                                                        {newAgendaDate === newAgendaEndDate ? newAgendaDate : `${newAgendaDate} ~ ${newAgendaEndDate}`}
                                                                    </span>
                                                                </h4>

                                                                <form onSubmit={handleAddAgenda} className="flex flex-col gap-2.5">
                                                                    {/* 날짜 입력 (시작일 ~ 종료일 & 퀵 프리셋) */}
                                                                    <div className="flex flex-col gap-1 bg-white p-2 rounded-xl border border-slate-200">
                                                                        <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                                                                            <span><i className="far fa-calendar-alt text-emerald-500 mr-1"></i> 일정 기간</span>
                                                                            <div className="flex gap-1">
                                                                                <button type="button" onClick={() => handleSetPresetDuration(1)} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">당일</button>
                                                                                <button type="button" onClick={() => handleSetPresetDuration(2)} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">1박2일</button>
                                                                                <button type="button" onClick={() => handleSetPresetDuration(3)} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">2박3일</button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                type="date"
                                                                                value={newAgendaDate}
                                                                                onChange={(e) => {
                                                                                    setNewAgendaDate(e.target.value);
                                                                                    if (e.target.value > newAgendaEndDate) {
                                                                                        setNewAgendaEndDate(e.target.value);
                                                                                    }
                                                                                }}
                                                                                className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                                            />
                                                                            <span className="text-slate-400 text-xs font-bold">~</span>
                                                                            <input
                                                                                type="date"
                                                                                value={newAgendaEndDate}
                                                                                min={newAgendaDate}
                                                                                onChange={(e) => setNewAgendaEndDate(e.target.value)}
                                                                                className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {/* 시간 입력 (시작시간 ~ 종료시간 & 종일 설정) */}
                                                                    <div className="flex flex-col gap-1 bg-white p-2.5 rounded-xl border border-slate-200">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-[11px] font-extrabold text-slate-600"><i className="far fa-clock text-blue-500 mr-1"></i> 시간 범위</span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={handleToggleAllDay}
                                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
                                                                                    isAllDay
                                                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black'
                                                                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                                                                }`}
                                                                            >
                                                                                <i className={`fas ${isAllDay ? 'fa-check-circle text-white' : 'fa-sun text-amber-500'}`}></i> 종일
                                                                            </button>
                                                                        </div>
                                                                        <div className="flex items-center gap-1 mt-0.5">
                                                                            <input
                                                                                type="time"
                                                                                value={newAgendaTime}
                                                                                disabled={isAllDay}
                                                                                onChange={(e) => setNewAgendaTime(e.target.value)}
                                                                                className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100 disabled:text-slate-400"
                                                                            />
                                                                            <span className="text-slate-400 text-xs font-bold">~</span>
                                                                            <input
                                                                                type="time"
                                                                                value={newAgendaEndTime}
                                                                                disabled={isAllDay}
                                                                                onChange={(e) => setNewAgendaEndTime(e.target.value)}
                                                                                className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100 disabled:text-slate-400"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <input
                                                                        type="text"
                                                                        placeholder="일정 내용을 입력하세요 (예: 2박3일 여행, 미팅)"
                                                                        value={newAgendaText}
                                                                        onChange={(e) => setNewAgendaText(e.target.value)}
                                                                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                                                                    />

                                                                    {/* 색상 팔레트 선택 */}
                                                                    <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-xl border border-slate-200">
                                                                        <span className="text-[10px] font-bold text-slate-400 pl-1">카테고리:</span>
                                                                        <div className="flex items-center gap-1.5">
                                                                            {Object.entries(SCHEDULE_COLOR_CONFIG).map(([cKey, cVal]) => (
                                                                                <button
                                                                                    key={cKey}
                                                                                    type="button"
                                                                                    onClick={() => setNewAgendaColor(cKey)}
                                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${cVal.dot} ${
                                                                                        newAgendaColor === cKey ? 'ring-2 ring-slate-800 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                                                                                    }`}
                                                                                    title={cVal.label}
                                                                                >
                                                                                    {newAgendaColor === cKey && (
                                                                                        <i className="fas fa-check text-[9px] text-white"></i>
                                                                                    )}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        type="submit"
                                                                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer"
                                                                    >
                                                                        <i className="fas fa-check mr-1.5"></i> 일정 등록하기
                                                                    </button>
                                                                </form>
                                                            </div>

                                                            {/* 선택 날짜 일정 리스트 */}
                                                            <div className="border-t border-slate-200/80 pt-3">
                                                                <div className="flex justify-between items-center mb-2">
                                                                    <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                                                        <i className="fas fa-list-ul text-slate-500"></i>
                                                                        {selectedDate ? `${selectedDate} 일정` : '이번 달 전체 일정'}
                                                                    </h5>
                                                                    {selectedDate && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setSelectedDate(null)}
                                                                            className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
                                                                        >
                                                                            전체 보기
                                                                        </button>
                                                                    )}
                                                                </div>

                                                                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                                                    {displaySchedules.length > 0 ? (
                                                                        displaySchedules.map((item: any) => {
                                                                            const cConfig = SCHEDULE_COLOR_CONFIG[item.color || 'blue'] || SCHEDULE_COLOR_CONFIG.blue;
                                                                            const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : '';
                                                                            const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;
                                                                            const sTime = item.schedule_time || item.time || '09:00';
                                                                            const eTime = item.end_time || '18:00';
                                                                            const isMultiDay = sDate && eDate && sDate !== eDate;
                                                                            const isAllDayItem = (sTime === '00:00' && (eTime === '23:59' || eTime === '24:00')) || sTime === '종일';

                                                                            return (
                                                                                <div
                                                                                    key={item.id}
                                                                                    className={`flex justify-between items-center p-2.5 rounded-xl text-xs border shadow-2xs relative group ${cConfig.bg} ${cConfig.border}`}
                                                                                >
                                                                                    <div className="flex flex-col gap-0.5 overflow-hidden pr-6">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <span className={`font-mono text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${cConfig.badge}`}>
                                                                                                {cConfig.label}
                                                                                            </span>
                                                                                            <span className={`font-bold truncate ${cConfig.text}`}>
                                                                                                {item.schedule_text || item.text}
                                                                                            </span>
                                                                                        </div>
                                                                                        <span className="font-bold text-slate-500 font-mono text-[10px]">
                                                                                            <i className="far fa-clock mr-1 text-[9px]"></i>
                                                                                            {isAllDayItem
                                                                                                ? (isMultiDay ? `${sDate.substring(5)} ~ ${eDate.substring(5)} [종일]` : '[종일]')
                                                                                                : (isMultiDay ? `${sDate.substring(5)} ${sTime} ~ ${eDate.substring(5)} ${eTime}` : `${sTime} ~ ${eTime}`)}
                                                                                        </span>
                                                                                    </div>
                                                                                    <button
                                                                                        onClick={() => handleRemoveAgenda(item.id)}
                                                                                        className="absolute right-2.5 top-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                                                        title="일정 삭제"
                                                                                    >
                                                                                        <i className="fas fa-times text-xs"></i>
                                                                                    </button>
                                                                                </div>
                                                                            );
                                                                        })
                                                                    ) : (
                                                                        <div className="text-slate-400 text-xs py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                                                                            {selectedDate ? `${selectedDate}에 등록된 일정이 없습니다.` : '등록된 일정이 없습니다.'}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 위젯 2: 베라포인트 정산 (Vera Points Settlement) */}
                                                <div className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col justify-between min-h-[320px]">
                                                    <div>
                                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                                                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                                                <i className="fas fa-coins text-amber-500"></i> 🪙 베라포인트 정산
                                                            </h3>
                                                        </div>

                                                        {/* 지표 보드 */}
                                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                                            <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl">
                                                                <span className="text-[10px] text-amber-600 font-black">누적 포인트</span>
                                                                <span className="block text-base font-mono font-black text-slate-800 mt-0.5">{veraPointsData.points.toLocaleString()} P</span>
                                                            </div>
                                                            <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                                                                <span className="text-[10px] text-emerald-600 font-black">정산 대기 금액</span>
                                                                <span className="block text-base font-mono font-black text-slate-800 mt-0.5">{veraPointsData.pendingAmount.toLocaleString()} 원</span>
                                                            </div>
                                                        </div>

                                                        {/* 적립 내역 지표 */}
                                                        <div className="space-y-2">
                                                            <span className="text-[10px] text-slate-400 font-bold block">베라포인트 적립 내역 지표</span>
                                                            <div>
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                                                                    <span>📅 출석체크 & 미션 완료</span>
                                                                    <span>{veraPointsData.attendanceRatio}%</span>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-emerald-500" style={{ width: `${veraPointsData.attendanceRatio}%` }}></div>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="flex justify-between text-[9px] font-bold text-slate-600 mb-1">
                                                                    <span>💬 소셜 라운지 & 커뮤니티 활동</span>
                                                                    <span>{veraPointsData.activityRatio}%</span>
                                                                </div>
                                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-amber-500" style={{ width: `${veraPointsData.activityRatio}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {user?.email === 'sukman@naver.com' && (
                                                        <Link 
                                                            to="/reward/exchange"
                                                            className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-colors cursor-pointer"
                                                        >
                                                            베라포인트 리워드 교환 신청
                                                        </Link>
                                                    )}
                                                </div>

                                                {/* 위젯 3: 관심 주식 시황 위젯 */}
                                                <div className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col justify-between min-h-[300px]">
                                                    <div>
                                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                                                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                                                <i className="fas fa-chart-line text-green-600"></i> 관심 주식 종목
                                                            </h3>
                                                            {stocksData.watchlist.length > 0 && (
                                                                <span className="text-[10px] text-slate-400 font-bold">{stocksData.watchlist.length}개 구독중</span>
                                                            )}
                                                        </div>

                                                        <div className="space-y-2">
                                                            {stocksData.watchlist && stocksData.watchlist.length > 0 ? (
                                                                stocksData.watchlist.slice(0, 3).map(stock => (
                                                                    <div key={stock.id} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl text-xs">
                                                                        <div>
                                                                            <span className="font-black text-slate-800 mr-2">{stock.stock_name}</span>
                                                                            <span className="font-mono text-slate-400">{stock.stock_symbol}</span>
                                                                        </div>
                                                                        {stock.target_price && (
                                                                            <span className="font-bold text-green-600">목표: {Number(stock.target_price).toLocaleString()}</span>
                                                                        )}
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">관심 등록한 주식이 없습니다</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Link
                                                        to="/finance"
                                                        className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-750 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-colors"
                                                    >
                                                        주식/금융 센터 바로가기
                                                    </Link>
                                                </div>

                                                {/* 위젯 4: 사주팔자 오행 위젯 */}
                                                <div className="border border-slate-200 rounded-2xl p-5 bg-[#FAF9F5] flex flex-col justify-between min-h-[300px]">
                                                    <div>
                                                        <div className="flex justify-between items-center border-b border-stone-200 pb-2 mb-3">
                                                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                                                <i className="fas fa-yin-yang text-emerald-600"></i> {user.name}님의 사주 오행
                                                            </h3>
                                                            <button
                                                                onClick={() => setShowBirthEditor(true)}
                                                                className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-0.5 rounded font-black transition-colors"
                                                            >
                                                                생일 수정
                                                            </button>
                                                        </div>

                                                        {/* 생일 수정 폼 */}
                                                        {showBirthEditor ? (
                                                            <form onSubmit={handleSaveBirth} className="space-y-3 py-2">
                                                                <p className="text-xs text-stone-500 font-bold">생년월일을 입력해 실시간 사주를 받아보세요.</p>
                                                                <input
                                                                    type="date"
                                                                    value={tempBirthDate}
                                                                    onChange={(e) => setTempBirthDate(e.target.value)}
                                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold"
                                                                    required
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button type="submit" className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black">확인</button>
                                                                    {birthDate && <button type="button" onClick={() => setShowBirthEditor(false)} className="flex-1 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-black">취소</button>}
                                                                </div>
                                                            </form>
                                                        ) : saju ? (
                                                            <div className="space-y-3">
                                                                <p className="text-xs text-stone-600 leading-relaxed font-bold break-keep">
                                                                    🔮 <span className="text-emerald-600 font-black">천성:</span> {saju.nature}
                                                                </p>
                                                                {/* 오행 그래프 */}
                                                                <div className="space-y-1.5">
                                                                    <div className="flex justify-between text-[10px] font-black text-stone-500">
                                                                        <span>🌳 목 {saju.wood}%</span>
                                                                        <span>🔥 화 {saju.fire}%</span>
                                                                        <span>⛰️ 토 {saju.earth}%</span>
                                                                        <span>⚙️ 금 {saju.metal}%</span>
                                                                        <span>💧 수 {saju.water}%</span>
                                                                    </div>
                                                                    <div className="h-2.5 w-full bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                                                        <div className="bg-emerald-500" style={{ width: `${saju.wood}%` }}></div>
                                                                        <div className="bg-red-500" style={{ width: `${saju.fire}%` }}></div>
                                                                        <div className="bg-amber-500" style={{ width: `${saju.earth}%` }}></div>
                                                                        <div className="bg-stone-500" style={{ width: `${saju.metal}%` }}></div>
                                                                        <div className="bg-blue-600" style={{ width: `${saju.water}%` }}></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null}
                                                    </div>

                                                    <Link
                                                        to="/entertainment/saju"
                                                        className="mt-4 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-colors"
                                                    >
                                                        전통 사주 종합 해설 열기
                                                    </Link>
                                                </div>

                                            </div>
                                        </div>
                                    )}

                                    {/* 홈 꾸미기 섹션 */}
                                    {activeSection === 'home-customize' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center border-b pb-4">
                                                <i className="fas fa-magic mr-3 text-green-500 text-3xl"></i>내 홈페이지 꾸미기
                                            </h2>
                                            <p className="text-gray-500 text-sm mb-6">설정을 바꾸면 메인 페이지가 나만의 모습으로 바뀝니다.</p>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                                    <div className="text-xs font-bold text-green-600 mb-1 uppercase">퀵메뉴</div>
                                                    <div className="text-2xl font-black text-green-700">{homeConfig.quickMenuItems.length}개</div>
                                                    <div className="text-xs text-green-500 mt-1">선택됨</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                                                    <div className="text-xs font-bold text-blue-600 mb-1 uppercase">레이아웃</div>
                                                    <div className="text-lg font-black text-blue-700">
                                                        {homeConfig.theme.layout === 'portal' ? '포털형' : homeConfig.theme.layout === 'minimal' ? '미니멀' : '카드형'}
                                                    </div>
                                                    <div className="text-xs text-blue-500 mt-1">{homeConfig.theme.colorScheme} 테마</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                                                    <div className="text-xs font-bold text-purple-600 mb-1 uppercase">설정 상태</div>
                                                    <div className="text-lg font-black text-purple-700">
                                                        {homeConfig.isConfigured ? '✅ 완료' : '⚙️ 기본값'}
                                                    </div>
                                                    <div className="text-xs text-purple-500 mt-1">{homeConfig.isConfigured ? '맞춤 설정 적용중' : '아직 설정 전'}</div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => setShowWizard(true)}
                                                className="w-full py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg rounded-2xl transition-all hover:shadow-lg flex items-center justify-center gap-3 group"
                                            >
                                                <i className="fas fa-magic text-xl group-hover:rotate-12 transition-transform"></i>
                                                {homeConfig.isConfigured ? '설정 다시 하기' : '지금 내 홈 꾸미기 시작!'}
                                            </button>

                                            <div className="mt-8 p-5 bg-white border border-gray-200 rounded-2xl">
                                                <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                                    <i className="fas fa-mobile-screen-button text-green-500"></i> 모바일 하단 탭 메뉴
                                                </h3>
                                                <p className="text-gray-500 text-xs mb-4">모바일에서 화면 아래에 표시되는 빠른 이동 탭을 직접 구성하세요.</p>
                                                <MobileTabEditor value={currentMobileTabs} onChange={handleMobileTabsChange} />
                                                <button
                                                    onClick={handleSaveMobileTabs}
                                                    disabled={isHomeSaving || currentMobileTabs.length === 0}
                                                    className="mt-4 w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {isHomeSaving ? (<><i className="fas fa-circle-notch fa-spin"></i> 저장 중...</>) : mobileTabsSaved ? (<><i className="fas fa-check"></i> 저장됨</>) : (<><i className="fas fa-save"></i> 탭 설정 저장</>)}
                                                </button>
                                            </div>

                                            {homeConfig.isConfigured && (
                                                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                                                    <h4 className="font-bold text-yellow-800 text-sm mb-2"><i className="fas fa-info-circle mr-1"></i>현재 나만의 설정</h4>
                                                    <ul className="text-xs text-yellow-700 space-y-1">
                                                        <li>• 주 관심사: {homeConfig.preferences.mainInterest === 'news' ? '뉴스' : homeConfig.preferences.mainInterest === 'games' ? '게임' : homeConfig.preferences.mainInterest === 'utility' ? '유틸리티' : '금융'}</li>
                                                        <li>• 뉴스 카테고리: {homeConfig.preferences.newsCategories.join(', ') || '전체'}</li>
                                                        {homeConfig.theme.greeting && <li>• 인사말: "{homeConfig.theme.greeting}"</li>}
                                                        <li>• 즐겨하는 게임: {homeConfig.preferences.favoriteGames.length > 0 ? homeConfig.preferences.favoriteGames.join(', ') : '없음'}</li>
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 뉴스 섹션 */}
                                    {activeSection === 'news' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-newspaper mr-3 text-sky-500 text-3xl"></i>뉴스
                                            </h2>

                                            <div className="mb-10 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs">
                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-5 border-b border-slate-100">
                                                    <div>
                                                        <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                                            <i className="fas fa-hashtag text-sky-500"></i>키워드 구독 뉴스
                                                        </h3>
                                                        <p className="text-xs text-slate-400 mt-1">원하는 관심 주제/키워드를 추가하여 맞춤 실시간 뉴스 피드를 받아보세요.</p>
                                                    </div>

                                                    {/* 주제 추가 입력창 & 버튼 */}
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <div className="relative flex-1 sm:w-64">
                                                            <input
                                                                type="text"
                                                                value={newKeywordInput}
                                                                onChange={(e) => setNewKeywordInput(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                                                                placeholder="관심 주제/키워드 입력 (예: AI, 부동산)"
                                                                className="w-full pl-8 pr-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                                                            />
                                                            <i className="fas fa-[#] text-[11px] text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddKeyword()}
                                                            disabled={isSubmittingKeyword || !newKeywordInput.trim()}
                                                            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                                                        >
                                                            <i className="fas fa-plus text-[11px]"></i> 주제 추가
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* 추천 주제 칩 목록 */}
                                                <div className="mb-5 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                                                        <i className="fas fa-[#] text-amber-500 text-[10px]"></i> 추천 주제:
                                                    </span>
                                                    {['인공지능', '부동산', '주식', 'IT/기술', '금융', '경제', '정치', '엔터'].map((recKw) => {
                                                        const isSubscribed = newsData.keywords.some((k: any) => (typeof k === 'string' ? k : k.keyword) === recKw);
                                                        return (
                                                            <button
                                                                key={recKw}
                                                                type="button"
                                                                onClick={() => !isSubscribed && handleAddKeyword(recKw)}
                                                                disabled={isSubscribed}
                                                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                                                                    isSubscribed
                                                                        ? 'bg-slate-200/80 text-slate-500 cursor-default border border-slate-200'
                                                                        : 'bg-white hover:bg-sky-50 hover:text-sky-600 text-slate-700 border border-slate-200 shadow-2xs active:scale-95'
                                                                }`}
                                                            >
                                                                #{recKw}
                                                                {isSubscribed ? <i className="fas fa-check text-[10px] text-sky-500 ml-0.5"></i> : <i className="fas fa-plus text-[9px] text-slate-400"></i>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* 구독 중인 주제 뱃지 목록 */}
                                                <div className="flex items-center gap-2 flex-wrap mb-6">
                                                    <span className="text-xs font-bold text-slate-600 mr-1">내 구독 목록 ({newsData.keywords.length}):</span>
                                                    {newsData.keywords && newsData.keywords.length > 0 ? (
                                                        newsData.keywords.map((kw: any, idx: number) => {
                                                            const kwName = typeof kw === 'string' ? kw : (kw.keyword || kw.name || '');
                                                            const kwId = typeof kw === 'object' ? kw.id : null;
                                                            return (
                                                                <span key={kwId || idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-sky-50 text-sky-700 text-xs font-bold border border-sky-200/80 shadow-2xs">
                                                                    #{kwName}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteKeyword(kwId, kwName)}
                                                                        className="text-sky-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                                                                        title="구독 해제"
                                                                    >
                                                                        <i className="fas fa-times text-[10px]"></i>
                                                                    </button>
                                                                </span>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">구독 중인 주제가 없습니다. 위 입력창이나 추천 주제를 눌러 추가해보세요.</span>
                                                    )}
                                                </div>

                                                {/* 뉴스 기사 목록 */}
                                                <div className="space-y-4">
                                                    {newsData.keywordNews && newsData.keywordNews.length > 0 ? (
                                                        newsData.keywordNews.map(news => (
                                                            <div key={news.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                                                <h4 className="font-bold text-gray-900 mb-2 truncate text-lg">
                                                                    <Link to={`/news/${news.id}`} className="hover:text-brand-green">{news.title}</Link>
                                                                </h4>
                                                                <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                                                                    {news.summary || news.description || '내용이 없습니다.'}
                                                                </div>
                                                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                                                    <span className="px-2.5 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">{news.category || '기타'}</span>
                                                                    <span><i className="far fa-clock mr-1"></i> {new Date(news.published_at || news.created_at).toLocaleDateString('ko-KR')}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                                            구독한 주제와 일치하는 뉴스가 없습니다. 새로운 키워드를 추가해보세요!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-bookmark text-amber-500 mr-2"></i>북마크한 뉴스
                                                </h3>
                                                <div className="space-y-4">
                                                    {newsData.bookmarks.length > 0 ? (
                                                        newsData.bookmarks.map(bm => (
                                                            <div key={bm.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                                                <h4 className="font-bold text-gray-900 mb-2 truncate text-lg">
                                                                    <Link to={`/news/${bm.news_id || bm.id}`} className="hover:text-brand-green">{bm.title}</Link>
                                                                </h4>
                                                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                                                    <span className="px-2.5 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-700">{bm.category || '기타'}</span>
                                                                    <span><i className="far fa-clock mr-1"></i> {new Date(bm.published_at || bm.created_at || Date.now()).toLocaleDateString('ko-KR')}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">북마크한 뉴스가 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 주식 섹션 */}
                                    {activeSection === 'stocks' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-chart-line mr-3 text-green-500 text-3xl"></i>주식
                                            </h2>

                                            <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">총 종목 수</div>
                                                    <div className="text-3xl font-black">{stocksData.watchlist.length}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">미국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.watchlist.filter(s => s.market_type === 'US').length}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">한국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.watchlist.filter(s => s.market_type === 'KR').length}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-star text-yellow-400 mr-2"></i>관심 종목
                                                </h3>
                                                <div className="space-y-3">
                                                    {stocksData.watchlist.length > 0 ? (
                                                        stocksData.watchlist.map(stock => (
                                                            <div key={stock.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${stock.market_type === 'US' ? 'bg-indigo-500' : 'bg-teal-500'}`}>
                                                                        {stock.stock_symbol.substring(0, 2)}
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                                            {stock.stock_name}
                                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stock.market_type === 'US' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-teal-50 text-teal-600 border border-teal-200'}`}>
                                                                                {stock.market_type}
                                                                            </span>
                                                                        </h4>
                                                                        <div className="text-sm text-gray-500 font-mono mt-0.5">{stock.stock_symbol}</div>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right flex space-x-4 sm:space-x-0 sm:flex-col items-end justify-center">
                                                                    {stock.target_price && (
                                                                        <div className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1 rounded-md">
                                                                            목표가: <span className="text-brand-green">{Number(stock.target_price).toLocaleString()}{stock.market_type === 'KR' ? '원' : '$'}</span>
                                                                        </div>
                                                                    )}
                                                                    {stock.memo && (
                                                                        <div className="text-xs text-gray-400 mt-2 truncate w-40 flex-1">{stock.memo}</div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">관심 종목이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 게임 섹션 */}
                                    {activeSection === 'games' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-gamepad mr-3 text-purple-500 text-3xl"></i>게임
                                            </h2>

                                            <div className="mb-10">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-trophy text-yellow-500 mr-2"></i>최고 기록
                                                </h3>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {Object.keys(gamesData.stats).length > 0 ? (
                                                        Object.keys(gamesData.stats).map(gameType => {
                                                            const stat = gamesData.stats[gameType];
                                                            return (
                                                                <div key={gameType} className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                                                                    <i className="fas fa-medal absolute right-4 top-4 text-4xl opacity-20"></i>
                                                                    <div className="text-sm opacity-90 mb-1 font-medium font-mono">{gameType}</div>
                                                                    <div className="text-3xl font-black mb-3">{stat.best_score || stat.high_score}점</div>
                                                                    <div className="text-xs opacity-80 bg-white/20 inline-block px-2 py-1 rounded">플레이: {stat.play_count}회</div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <div className="text-gray-500 text-sm sm:col-span-2 py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">게임 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-history text-gray-400 mr-2"></i>최근 플레이
                                                </h3>
                                                <div className="space-y-3">
                                                    {gamesData.history.length > 0 ? (
                                                        gamesData.history.map((game, i) => (
                                                            <div key={i} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                                                                        <i className="fas fa-play"></i>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="font-bold text-gray-900 font-mono">{game.game_type}</h4>
                                                                        <div className="text-xs text-gray-400">{new Date(game.played_at || game.created_at).toLocaleString('ko-KR')}</div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-xl font-bold text-purple-600">{game.score}점</div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">최근 플레이 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 유틸리티 섹션 */}
                                    {activeSection === 'utils' && (
                                        <div className="animate-fade-in">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
                                                <i className="fas fa-tools mr-3 text-orange-500 text-3xl"></i>유틸리티
                                            </h2>

                                            <div className="mb-10">
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-cog text-gray-500 mr-2"></i>저장된 설정
                                                </h3>
                                                <div className="space-y-4">
                                                    {Object.keys(utilsData.settings).length > 0 ? (
                                                        Object.keys(utilsData.settings).map(utilType => (
                                                            <div key={utilType} className="border border-gray-200 rounded-xl overflow-hidden hover:border-orange-200 transition-colors">
                                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                                    <h4 className="font-bold text-gray-800 flex items-center">
                                                                        <i className="fas fa-wrench mr-2 text-orange-400"></i>{utilType}
                                                                    </h4>
                                                                </div>
                                                                <div className="p-4">
                                                                    <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-lg overflow-x-auto border border-slate-100 font-mono">
                                                                        {JSON.stringify(utilsData.settings[utilType], null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">저장된 설정이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                                    <i className="fas fa-stream text-gray-400 mr-2"></i>사용 히스토리
                                                </h3>
                                                <div className="space-y-4">
                                                    {utilsData.history.length > 0 ? (
                                                        utilsData.history.map((item, i) => (
                                                            <div key={i} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
                                                                    <div className="font-bold text-gray-800 flex items-center">
                                                                        <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
                                                                        {item.util_type}
                                                                    </div>
                                                                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                                                        {new Date(item.created_at).toLocaleString('ko-KR')}
                                                                    </div>
                                                                </div>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-h-40 overflow-hidden relative">
                                                                    <div>
                                                                        <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Input Data</span>
                                                                        <p className="text-gray-600 font-mono text-xs break-all truncate">
                                                                            {typeof item.input_data === 'object' ? JSON.stringify(item.input_data) : item.input_data}
                                                                        </p>
                                                                    </div>
                                                                    {item.result_data && (
                                                                        <div>
                                                                            <span className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Result</span>
                                                                            <p className="text-gray-600 font-mono text-xs break-all truncate">
                                                                                {typeof item.result_data === 'object' ? JSON.stringify(item.result_data) : item.result_data}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500 text-sm py-6 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">사용 기록이 없습니다</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
            </div>
            <Footer />

            {/* 홈 꾸미기 마법사 모달 */}
            {showWizard && (
                <PreferenceWizard
                    currentConfig={homeConfig}
                    isSaving={isHomeSaving}
                    onSave={async (newConfig: HomepageConfig) => {
                        updateHomeConfig(newConfig);
                        const ok = await saveHomeConfig(newConfig);
                        if (ok) {
                            setShowWizard(false);
                        }
                    }}
                    onClose={() => setShowWizard(false)}
                />
            )}
        </div>
    );
}
