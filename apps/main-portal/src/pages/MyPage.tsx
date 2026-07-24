import { useEffect, useState } from 'react';
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

export default function MyPage() {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

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

    // 데이터 상태 관리
    const [newsData, setNewsData] = useState<{ keywords: any[], keywordNews: any[], bookmarks: any[] }>({ keywords: [], keywordNews: [], bookmarks: [] });
    const [stocksData, setStocksData] = useState<{ stats: any, watchlist: any[] }>({ stats: {}, watchlist: [] });
    const [gamesData, setGamesData] = useState<{ stats: any, history: any[] }>({ stats: {}, history: [] });
    const [utilsData, setUtilsData] = useState<{ settings: any, history: any[] }>({ settings: {}, history: [] });
    const [loading, setLoading] = useState(false);

    const [veraPointsData, setVeraPointsData] = useState<{
        points: number;
        pendingAmount: number;
        attendanceRatio: number;
        activityRatio: number;
    }>({
        points: 1250,
        pendingAmount: 12500,
        attendanceRatio: 65,
        activityRatio: 35
    });

    const [bizAgenda, setBizAgenda] = useState<{ id: number | string; schedule_time?: string; time?: string; schedule_text?: string; text?: string }[]>([]);
    const [newAgendaText, setNewAgendaText] = useState('');
    const [newAgendaTime, setNewAgendaTime] = useState('09:00');

    const handleAddAgenda = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAgendaText.trim()) return;
        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.post('/api/user/schedules', {
                time: newAgendaTime,
                text: newAgendaText.trim()
            });
            if (res.data && res.data.success) {
                setBizAgenda(res.data.schedules || []);
                setNewAgendaText('');
            }
        } catch (err) {
            console.error('Failed to add schedule:', err);
        }
    };

    const handleRemoveAgenda = async (id: number | string) => {
        try {
            const instance = axios.create({ withCredentials: true, baseURL: API_BASE_URL });
            const res = await instance.delete(`/api/user/schedules/${id}`);
            if (res.data && res.data.success) {
                setBizAgenda(res.data.schedules || []);
            }
        } catch (err) {
            console.error('Failed to delete schedule:', err);
        }
    };

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
            navigate('/login');
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
                        instance.get(`/api/user/news/keywords?limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/bookmarks?page=1&limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/watchlist`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/games/stats`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/games/history?limit=3`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/schedules`).catch(() => ({ data: {} })),
                        instance.get(`/api/user/vera-points`).catch(() => ({ data: {} }))
                    ]);

                    setNewsData({
                        keywords: kwRes.data.keywords || [],
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                    setStocksData({
                        stats: statsStocksRes.data.stats || {},
                        watchlist: wlRes.data.stocks || []
                    });
                    setGamesData({
                        stats: statsGamesRes.data.stats || {},
                        history: historyGamesRes.data.history?.history || []
                    });
                    setBizAgenda(schedulesRes.data.schedules || []);

                    if (veraPointsRes.data && veraPointsRes.data.success) {
                        setVeraPointsData({
                            points: veraPointsRes.data.points ?? 1250,
                            pendingAmount: veraPointsRes.data.pendingAmount ?? 12500,
                            attendanceRatio: veraPointsRes.data.attendanceRatio ?? 65,
                            activityRatio: veraPointsRes.data.activityRatio ?? 35
                        });
                    }
                }
                
                // 기존 개별 탭 렌더링용 API 호출
                else if (activeSection === 'news') {
                    const [kwRes, kwNewsRes, bmRes] = await Promise.all([
                        instance.get(`/api/user/keywords`),
                        instance.get(`/api/user/news/keywords?limit=5`),
                        instance.get(`/api/user/bookmarks?page=1&limit=10`)
                    ]);
                    setNewsData({
                        keywords: kwRes.data.keywords || [],
                        keywordNews: kwNewsRes.data.news || [],
                        bookmarks: bmRes.data.items || []
                    });
                } else if (activeSection === 'stocks') {
                    const [statsRes, wlRes] = await Promise.all([
                        instance.get(`/api/user/watchlist/stats`),
                        instance.get(`/api/user/watchlist`)
                    ]);
                    setStocksData({
                        stats: statsRes.data.stats || {},
                        watchlist: wlRes.data.stocks || []
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
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                
                                                {/* 위젯 1: 오늘의 비즈니스 일정 (BIZ Agenda) */}
                                                <div className="border border-slate-200 rounded-2xl p-5 bg-white flex flex-col justify-between min-h-[320px]">
                                                    <div>
                                                        <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                                                            <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5">
                                                                <i className="fas fa-calendar-alt text-emerald-600"></i> 💼 오늘의 비즈니스 일정
                                                            </h3>
                                                        </div>

                                                        {/* 일정 입력 폼 */}
                                                        <form onSubmit={handleAddAgenda} className="flex gap-1.5 mb-3">
                                                            <input 
                                                                type="time" 
                                                                value={newAgendaTime}
                                                                onChange={(e) => setNewAgendaTime(e.target.value)}
                                                                className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                                                            />
                                                            <input 
                                                                type="text" 
                                                                placeholder="새로운 업무 일정 추가..."
                                                                value={newAgendaText}
                                                                onChange={(e) => setNewAgendaText(e.target.value)}
                                                                className="flex-1 px-3 py-1 border border-slate-200 rounded-lg text-xs font-semibold"
                                                            />
                                                            <button type="submit" className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 transition-colors">
                                                                추가
                                                            </button>
                                                        </form>

                                                        {/* 일정 목록 */}
                                                        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                                                            {bizAgenda.length > 0 ? (
                                                                bizAgenda.map((item) => (
                                                                    <div key={item.id} className="flex justify-between items-center bg-slate-50 border border-slate-200/40 p-2.5 rounded-xl text-xs relative group">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-bold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-md">{item.schedule_time || item.time}</span>
                                                                            <span className="font-semibold text-slate-700 leading-relaxed pr-6">{item.schedule_text || item.text}</span>
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => handleRemoveAgenda(item.id)}
                                                                            className="absolute right-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                                            title="일정 삭제"
                                                                        >
                                                                            <i className="fas fa-times text-xs"></i>
                                                                        </button>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="text-slate-400 text-xs py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">등록된 업무 일정이 없습니다.</div>
                                                            )}
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

                                                    <Link 
                                                        to="/reward/exchange"
                                                        className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-center text-xs rounded-xl shadow-sm block transition-colors cursor-pointer"
                                                    >
                                                        베라포인트 리워드 교환 신청
                                                    </Link>
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

                                            <div className="mb-10">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                                                        <i className="fas fa-hashtag text-sky-500 mr-2"></i>키워드 구독 뉴스
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        {newsData.keywords.length > 0 && newsData.keywords.map(kw => (
                                                            <span key={kw.id || kw.keyword} className="inline-flex items-center px-2 py-1 rounded bg-sky-50 text-sky-700 text-xs font-semibold border border-sky-100">
                                                                #{kw.keyword}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
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
                                                        <div className="text-gray-500 text-sm py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">구독한 키워드와 일치하는 뉴스가 없습니다</div>
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
                                                    <div className="text-3xl font-black">{stocksData.stats.total_stocks || 0}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">미국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.stats.market_distribution?.US || 0}</div>
                                                </div>
                                                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-5 text-white shadow-md">
                                                    <div className="text-sm opacity-90 mb-1 font-medium">한국 주식</div>
                                                    <div className="text-3xl font-black">{stocksData.stats.market_distribution?.KR || 0}</div>
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
