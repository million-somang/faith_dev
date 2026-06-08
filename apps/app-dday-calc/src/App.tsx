import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { MiniAppLayout, MiniAppCommunity, useAuth } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@faithportal/mini-app-sdk/src/components/MiniAppCommunity.css';
import {
    Heart, PlusCircle, ListChecks, Hourglass, CalendarPlus, Search,
    Trash2, CalendarHeart, Sparkles, X, Gift, HelpCircle, Star, Info
} from 'lucide-react';

// ── 1. 물리 키보드 릴레이용 전역 타입 선언 ──
declare global {
    interface Document {
        parentKeyboardCallback?: ((key: string) => void) | null;
    }
}

// ── 2. SEO 메타데이터 동적 주입 컴포넌트 (AEO 최적화) ──
interface PageSEOProps {
    title: string;
    description: string;
    path: string;
}

function PageSEO({ title, description, path }: PageSEOProps) {
    useEffect(() => {
        document.title = title;

        // Meta Description 갱신
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);

        // Canonical Link 갱신
        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', `https://faithlink.site${path}`);
    }, [title, description, path]);

    return null;
}

// ── 타입 ──
interface DdayItem {
    id: number;
    title: string;
    targetDate: string;
    mode: 'countdown' | 'countup' | 'datefinder';
    isAnniversary: boolean;
    color: string;
    emoji: string;
    createdAt: string;
}

type TabType = 'calculator' | 'howto' | 'community';

// ── 색상 팔레트 ──
const COLOR_OPTIONS = [
    { key: '#667eea', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { key: '#f093fb', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { key: '#4facfe', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { key: '#43e97b', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { key: '#fa709a', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
] as const;

// ── 이모지 옵션 ──
const EMOJI_OPTIONS = ['📅', '❤️', '✈️', '📚', '🎂', '🎓', '💪', '🏃', '🎵', '🎮', '🎬', '⚽'] as const;

// ── D-Day 계산 함수 ──
function calculateDday(targetDate: string, mode: string, isAnniversary: boolean): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (mode === 'countdown') {
        if (diffDays === 0) return 'D-Day';
        if (diffDays > 0) return `D-${diffDays}`;
        return `D+${Math.abs(diffDays)}`;
    } else if (mode === 'countup') {
        const days = Math.abs(diffDays) + (isAnniversary ? 1 : 0);
        return `${days}일째`;
    } else {
        return target.toLocaleDateString('ko-KR');
    }
}

// ── 남은 일수 계산 ──
function getDiffDays(targetDate: string): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ── 색상 조정 (그라디언트용) ──
function adjustColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return '#' +
        Math.min(255, r + 30).toString(16).padStart(2, '0') +
        Math.min(255, g + 30).toString(16).padStart(2, '0') +
        Math.min(255, b + 30).toString(16).padStart(2, '0');
}

function App() {
    const { user, isLoading } = useAuth();

    // ── 3초 초기 프리미엄 로딩 화면 가동 ──
    const [isLoadingScreen, setIsLoadingScreen] = useState(true);

    // ── 3탭 네비게이션 상태 ──
    const [activeTab, setActiveTab] = useState<TabType>('calculator');

    // 입력 필드 포커스 제어용 Ref
    const titleInputRef = useRef<HTMLInputElement>(null);

    // ── 상태 ──
    const [ddayData, setDdayData] = useState<DdayItem[]>(() => {
        try {
            const saved = localStorage.getItem('ddayData');
            return saved ? JSON.parse(saved) as DdayItem[] : [];
        } catch {
            return [];
        }
    });
    const [title, setTitle] = useState('');
    const [targetDate, setTargetDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 10);
    });
    const [currentMode, setCurrentMode] = useState<'countdown' | 'countup' | 'datefinder'>('countdown');
    const [isAnniversary, setIsAnniversary] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#667eea');
    const [selectedEmoji, setSelectedEmoji] = useState('📅');

    // ── 3초 스켈레톤 타이머 ──
    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingScreen(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // ── 모달 기동 즉시 포커스 실행 및 부모 창 알림 ──
    useEffect(() => {
        if (isLoadingScreen) return;

        const focusInput = (e?: Event) => {
            if (e && e.target) {
                const target = e.target as HTMLElement;
                // SELECT, INPUT, TEXTAREA, OPTION 및 버튼, 탭 네비게이션, 커뮤니티 클릭 시 포커스 뺏기 제외
                if (
                    target.tagName === 'SELECT' ||
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'OPTION' ||
                    target.closest('.calc-nav-container') ||
                    target.closest('.mini-app-community') ||
                    target.closest('button')
                ) {
                    return;
                }
            }

            window.focus();
            const activeEl = document.activeElement;
            const isInputField = activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'SELECT' ||
                activeEl.tagName === 'TEXTAREA'
            );
            if (!isInputField && titleInputRef.current) {
                titleInputRef.current.focus();
            }
            window.parent.postMessage({ type: 'MINI_APP_READY' }, '*');
        };

        const timer = setTimeout(() => focusInput(), 150);
        window.addEventListener('click', focusInput);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', focusInput);
        };
    }, [isLoadingScreen, activeTab]);

    // ── localStorage 저장 ──
    const saveToLocal = useCallback((data: DdayItem[]) => {
        localStorage.setItem('ddayData', JSON.stringify(data));
    }, []);

    // ── D-Day 추가 ──
    const addDday = useCallback(async () => {
        if (!title.trim()) {
            alert('제목을 입력해주세요.');
            return;
        }
        if (!targetDate) {
            alert('날짜를 선택해주세요.');
            return;
        }

        const newDday: DdayItem = {
            id: Date.now(),
            title: title.trim(),
            targetDate,
            mode: currentMode,
            isAnniversary,
            color: selectedColor,
            emoji: selectedEmoji,
            createdAt: new Date().toISOString(),
        };

        if (user) {
            try {
                const response = await fetch('/api/dday/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newDday),
                });
                if (response.ok) {
                    const data = await response.json() as { id: number };
                    newDday.id = data.id;
                }
            } catch (error) {
                console.error('D-Day 추가 실패:', error);
            }
        }

        const updated = [...ddayData, newDday];
        setDdayData(updated);
        saveToLocal(updated);

        // 초기화
        setTitle('');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setTargetDate(tomorrow.toISOString().slice(0, 10));
        setIsAnniversary(false);
    }, [title, targetDate, currentMode, isAnniversary, selectedColor, selectedEmoji, user, ddayData, saveToLocal]);

    // ── 물리 키보드 릴레이 핸들링 (가이드 준수) ──
    useEffect(() => {
        if (isLoadingScreen) return;

        const handleGlobalMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT') {
                const key = e.data.key;
                if (typeof document.parentKeyboardCallback === 'function') {
                    document.parentKeyboardCallback(key);
                }
            }
        };

        const myCallback = (key: string) => {
            console.log('[CHILD-DDAY-CALC] Keyboard input relayed:', key);
            if (key === 'Enter') {
                addDday();
            }
        };

        document.parentKeyboardCallback = myCallback;
        window.addEventListener('message', handleGlobalMessage);

        return () => {
            if (document.parentKeyboardCallback === myCallback) {
                document.parentKeyboardCallback = null;
            }
            window.removeEventListener('message', handleGlobalMessage);
        };
    }, [isLoadingScreen, addDday]);

    // ── D-Day 삭제 ──
    const deleteDday = useCallback(async (id: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        if (user) {
            try {
                await fetch(`/api/dday/${id}`, { method: 'DELETE' });
            } catch (error) {
                console.error('D-Day 삭제 실패:', error);
            }
        }

        const updated = ddayData.filter(d => d.id !== id);
        setDdayData(updated);
        saveToLocal(updated);
    }, [user, ddayData, saveToLocal]);

    // ── 프리셋 ──
    const setPreset = useCallback((type: 'christmas' | 'newyear') => {
        const now = new Date();
        const year = now.getFullYear();

        if (type === 'christmas') {
            const christmas = new Date(year, 11, 25);
            if (christmas < now) christmas.setFullYear(year + 1);
            setTitle('크리스마스 🎄');
            setTargetDate(christmas.toISOString().slice(0, 10));
            setSelectedEmoji('🎄');
        } else {
            const newyear = new Date(year + 1, 0, 1);
            setTitle('새해 첫날 🎆');
            setTargetDate(newyear.toISOString().slice(0, 10));
            setSelectedEmoji('🎆');
        }
        setCurrentMode('countdown');
    }, []);

    // ── Hero D-Day (가장 가까운 카운트다운) ──
    const heroDday = useMemo(() => {
        const upcoming = ddayData
            .filter(d => d.mode === 'countdown')
            .map(d => ({ ...d, diff: getDiffDays(d.targetDate) }))
            .filter(d => d.diff >= 0)
            .sort((a, b) => a.diff - b.diff);
        return upcoming[0] ?? null;
    }, [ddayData]);

    // ── [로딩 스크린] 3초 초기 대칭 정렬 로더 ──
    if (isLoadingScreen || isLoading) {
        return (
            <div className="loading-screen" role="status" aria-label="D-Day 매니저 앱 로딩 중">
                <div className="loading-body">
                    <div className="loading-icon-wrapper">
                        <span className="loading-logo-emoji">💝</span>
                    </div>

                    <h1 className="loading-title">감성 D-Day 매니저</h1>
                    <p className="loading-subtitle">설레는 목표와 아름다운 기다림을 한눈에 시각화</p>

                    <div className="loading-spinner" aria-hidden="true">
                        <div className="spinner-dot"></div>
                        <div className="spinner-dot"></div>
                        <div className="spinner-dot"></div>
                    </div>

                    {/* 프리미엄 D-Day 광고 영역 */}
                    <aside className="loading-ad-banner" aria-label="광고 및 안내">
                        <div className="ad-container overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-slate-700">
                            <a href="#" className="block relative group" onClick={(e) => e.preventDefault()}>
                                <span className="absolute top-2 left-2 z-10 bg-slate-950/80 text-pink-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-pink-500/30 tracking-wider">AD</span>
                                <img 
                                    src="ad_dday_banner.png" 
                                    alt="FaithLink 30일 성경 읽기 통독 챌린지 배너" 
                                    className="w-full h-auto object-cover max-h-[95px] transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="p-3 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 leading-normal">
                                        설레는 30일 성경 통독 챌린지 신청 가이드!
                                    </span>
                                    <span className="text-[9px] font-bold text-pink-400 flex items-center gap-0.5">
                                        자세히 보기 <i className="fas fa-chevron-right text-[8px]"></i>
                                    </span>
                                </div>
                            </a>
                        </div>
                        {/* 보안 및 안내 플레이스홀더 */}
                        <div className="ad-placeholder mt-3">
                            <span className="ad-badge">보안</span>
                            <span className="ad-text">기념일 정보는 브라우저 격리 로컬 세션에만 보관되며 외부로 유출되지 않습니다.</span>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col hide-scrollbar select-none">
            <PageSEO
                title="감성 D-Day 매니저 - 설레는 날짜 카운트다운 및 적산"
                description="목표일, 커플 기념일, 전역일 등을 아름다운 5종 그라데이션 카드로 완벽히 관리하고 실시간 로컬 싱크로 프라이버시를 안전하게 확보하는 D-Day 매니저입니다."
                path="/app/dday-calc/"
            />

            {/* ── 로즈 3탭 내비게이션 바 ── */}
            <div className="calc-nav-container">
                <div className="calc-nav-inner">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`calc-nav-tab ${activeTab === 'calculator' ? 'active' : ''}`}
                        aria-label="D-Day 매니저 화면"
                    >
                        <i className="fas fa-heart"></i>
                        <span>D-Day 관리</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('howto')}
                        className={`calc-nav-tab ${activeTab === 'howto' ? 'active' : ''}`}
                        aria-label="사용방법 FAQ 화면"
                    >
                        <i className="fas fa-circle-question"></i>
                        <span>사용방법</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`calc-nav-tab ${activeTab === 'community' ? 'active' : ''}`}
                        aria-label="자유토론 게시판"
                    >
                        <i className="fas fa-comments"></i>
                        <span>자유토론</span>
                    </button>
                </div>
            </div>

            {/* ── 메인 바디 컨테이너 ── */}
            <div className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
                <div className="max-w-4xl mx-auto px-4 py-6 w-full">

                    {/* 1. D-Day 계산 및 대시보드 탭 */}
                    {activeTab === 'calculator' && (
                        <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
                            {/* 헤더 */}
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-2">
                                    <Heart size={24} className="text-white" />
                                </div>
                                <h2 className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 tracking-tight">
                                    감성 D-Day 매니저
                                </h2>
                                <p className="text-slate-500 text-[10px] mt-0.5">
                                    단순히 날짜만 세는 게 아니라, 설레는 기다림을 시각화해드립니다
                                </p>
                            </div>

                            {/* 메인 2단 구성 */}
                            <div className="grid lg:grid-cols-2 gap-5">
                                {/* D-Day 입력기 */}
                                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
                                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <PlusCircle size={16} className="text-pink-400" />
                                        새 D-Day 만들기
                                    </h3>

                                    {/* 제목 */}
                                    <div className="mb-4">
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1.5">
                                            제목 <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            ref={titleInputRef}
                                            type="text"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="예: 유럽 여행 ✈️"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-white placeholder:text-slate-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    {/* 날짜 */}
                                    <div className="mb-4">
                                        <label className="block text-[10px] font-medium text-slate-500 mb-1.5">
                                            목표 날짜 <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={targetDate}
                                            onChange={e => setTargetDate(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                                        />
                                    </div>

                                    {/* 모드 */}
                                    <div className="mb-4">
                                        <label className="block text-[10px] font-medium text-slate-500 mb-2">
                                            계산 모드
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { key: 'countdown' as const, icon: Hourglass, label: 'D-Day' },
                                                { key: 'countup' as const, icon: CalendarPlus, label: '기념일' },
                                                { key: 'datefinder' as const, icon: Search, label: '날짜찾기' },
                                            ]).map(({ key, icon: Icon, label }) => (
                                                <button
                                                    key={key}
                                                    onClick={() => setCurrentMode(key)}
                                                    className={`px-2.5 py-2 rounded-xl font-semibold text-xs transition-all flex flex-col items-center gap-1 border ${
                                                        currentMode === key
                                                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40'
                                                            : 'bg-slate-950 text-slate-500 border-slate-900 hover:bg-slate-900'
                                                    }`}
                                                >
                                                    <Icon size={14} />
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 기념일 여부 */}
                                    {currentMode === 'countup' && (
                                        <div className="mb-4">
                                            <label className="flex items-center gap-2 cursor-pointer group select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={isAnniversary}
                                                    onChange={e => setIsAnniversary(e.target.checked)}
                                                    className="w-3.5 h-3.5 accent-pink-500 rounded"
                                                />
                                                <span className="text-[10px] text-slate-400 group-hover:text-slate-300 transition">
                                                    <CalendarHeart size={12} className="inline mr-1 text-pink-400" />
                                                    기준일을 1일로 포함 (커플 기념일용)
                                                </span>
                                            </label>
                                        </div>
                                    )}

                                    {/* 배경색 */}
                                    <div className="mb-4">
                                        <label className="block text-[10px] font-medium text-slate-500 mb-2">
                                            배경 테마색
                                        </label>
                                        <div className="flex gap-2">
                                            {COLOR_OPTIONS.map(opt => (
                                                <button
                                                    key={opt.key}
                                                    onClick={() => setSelectedColor(opt.key)}
                                                    className={`w-7 h-7 rounded-full transition-all ${
                                                        selectedColor === opt.key
                                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110'
                                                            : 'hover:scale-105'
                                                    }`}
                                                    style={{ background: opt.gradient }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* 이모지 */}
                                    <div className="mb-4">
                                        <label className="block text-[10px] font-medium text-slate-500 mb-2">
                                            대표 이모지
                                        </label>
                                        <div className="grid grid-cols-6 gap-1">
                                            {EMOJI_OPTIONS.map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => setSelectedEmoji(emoji)}
                                                    className={`text-lg py-1 rounded-lg transition-all text-center ${
                                                        selectedEmoji === emoji
                                                            ? 'bg-pink-500/20 ring-1 ring-pink-400/50'
                                                            : 'hover:bg-slate-900'
                                                    }`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 프리셋 */}
                                    <div className="mb-5">
                                        <label className="block text-[10px] font-medium text-slate-500 mb-2">
                                            <Sparkles size={10} className="inline mr-1" />
                                            빠른 설정 프리셋
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setPreset('christmas')}
                                                className="px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition text-xs font-semibold"
                                            >
                                                🎄 크리스마스
                                            </button>
                                            <button
                                                onClick={() => setPreset('newyear')}
                                                className="px-3 py-2 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition text-xs font-semibold"
                                            >
                                                🎆 새해 첫날
                                            </button>
                                        </div>
                                    </div>

                                    {/* 추가 버튼 */}
                                    <button
                                        onClick={addDday}
                                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold text-sm rounded-xl hover:from-pink-600 hover:to-purple-600 transition shadow-lg shadow-pink-600/20 flex items-center justify-center gap-1.5"
                                    >
                                        <PlusCircle size={16} />
                                        리스트에 등록하기
                                    </button>
                                </div>

                                {/* D-Day 타임라인/결과 리스트 */}
                                <div className="space-y-4">
                                    {/* Hero D-Day */}
                                    {heroDday && (
                                        <div
                                            className="rounded-2xl shadow-xl p-5 text-white animate-[fadeIn_0.3s_ease-out]"
                                            style={{
                                                background: `linear-gradient(135deg, ${heroDday.color} 0%, ${adjustColor(heroDday.color)} 100%)`,
                                            }}
                                        >
                                            <h4 className="text-[10px] font-extrabold opacity-80 mb-2 flex items-center gap-1">
                                                <Star size={10} className="fill-white" />
                                                가장 임박한 디데이
                                            </h4>
                                            <div className="flex items-center gap-2.5 mb-2.5">
                                                <span className="text-4xl">{heroDday.emoji}</span>
                                                <div>
                                                    <h3 className="text-xl font-black leading-tight">{heroDday.title}</h3>
                                                    <p className="text-[11px] opacity-90 mt-0.5">
                                                        목표일까지 앞으로 <span className="font-bold">{heroDday.diff}</span>일 남음!
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="bg-white/20 rounded-xl p-4 text-center border border-white/10 mb-2.5">
                                                <div className="text-4xl font-black">
                                                    {calculateDday(heroDday.targetDate, heroDday.mode, heroDday.isAnniversary)}
                                                </div>
                                            </div>
                                            <div className="bg-white/10 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-white h-full rounded-full transition-all duration-500"
                                                    style={{ width: `${Math.max(0, Math.min(100, 100 - (heroDday.diff / 30 * 100)))}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* 대시보드 리스트 */}
                                    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                            <ListChecks size={16} className="text-pink-400" />
                                            나의 목표 일정 리스트
                                            <span className="text-xs text-slate-500">({ddayData.length})</span>
                                        </h3>

                                        {ddayData.length === 0 ? (
                                            <div className="text-center py-10 text-slate-600 border border-dashed border-slate-800 rounded-xl">
                                                <Info size={24} className="mx-auto text-slate-700 mb-2" />
                                                <p className="text-xs font-semibold">등록된 일정이 아직 없습니다.</p>
                                                <p className="text-[10px] mt-0.5">왼쪽에서 생애 첫 D-Day를 생성해 보세요.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3.5">
                                                {ddayData.map(dday => {
                                                    const ddayText = calculateDday(dday.targetDate, dday.mode, dday.isAnniversary);
                                                    return (
                                                        <div
                                                            key={dday.id}
                                                            className="rounded-xl p-3.5 shadow-md flex items-center justify-between border border-white/5 transition-all hover:scale-[1.01]"
                                                            style={{
                                                                background: `linear-gradient(135deg, ${dday.color} 0%, ${adjustColor(dday.color)} 100%)`,
                                                            }}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="text-2xl">{dday.emoji}</span>
                                                                <div>
                                                                    <h4 className="font-bold text-xs text-white leading-tight">{dday.title}</h4>
                                                                    <p className="text-[9px] text-white/80 mt-0.5">
                                                                        {new Date(dday.targetDate).toLocaleDateString('ko-KR')}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-base font-black text-white bg-white/20 px-2.5 py-1 rounded-lg border border-white/10">
                                                                    {ddayText}
                                                                </span>
                                                                <button
                                                                    onClick={() => deleteDday(dday.id)}
                                                                    className="text-white/60 hover:text-white transition"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. 사용방법 탭 (FAQ & 크롤러 수집용 지식 테이블 완벽 이식) */}
                    {activeTab === 'howto' && (
                        <div className="space-y-5 animate-[fadeIn_0.2s_ease-out]">
                            {/* 안내 정보 카드 */}
                            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                                <h3 className="text-sm font-black text-slate-300 mb-4 flex items-center gap-2">
                                    <HelpCircle size={16} className="text-pink-400" />
                                    D-Day 매니저 핵심 가이드 FAQ
                                </h3>
                                <div className="space-y-4 text-xs">
                                    <div className="border-b border-slate-800/60 pb-3">
                                        <div className="font-bold text-white mb-1">Q. 디데이 카운트다운은 당일과 전날을 어떻게 세나요?</div>
                                        <p className="text-slate-400 leading-relaxed">
                                            카운트다운(Countdown) 모드는 오늘을 기준으로 목표일까지의 남은 순수 일수를 셉니다. 당일은 **D-Day**로 계산되며, 목표일 1일 전에는 **D-1**로 표기됩니다.
                                        </p>
                                    </div>
                                    <div className="border-b border-slate-800/60 pb-3">
                                        <div className="font-bold text-white mb-1">Q. 기념일(Countup) 모드에서 '기준일 포함'은 무슨 의미인가요?</div>
                                        <p className="text-slate-400 leading-relaxed">
                                            연인과의 교제 시작일 등을 계산할 때는 당일을 1일로 쳐서 시작하는 것이 한국식 관습입니다. 이 옵션(`isAnniversary`)을 켜시면 당일이 1일째로 포함되어 셈이 이뤄집니다.
                                        </p>
                                    </div>
                                    <div className="pb-1">
                                        <div className="font-bold text-white mb-1">Q. 만 나이 통일법과 D-Day 계산은 어떤 상관이 있나요?</div>
                                        <p className="text-slate-400 leading-relaxed">
                                            '만 나이 통일법'은 공식 행정 및 민법상 연령 산정에만 국한되어 적용됩니다. 교제 일주년, 탄생 백일, 돌 등 일상의 사적 D-Day 적산 방식에는 **전혀 간섭하거나 적용되지 않으므로** 안심하고 기존 방식 그대로 세어가시면 됩니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 지식 테이블 수록 (AEO 파싱용) */}
                            <div className="aeo-guide-card">
                                <h3 className="text-sm font-black text-slate-300 flex items-center gap-2">
                                    <Star size={16} className="text-pink-400" />
                                    중요 연산 모드별 올바른 적용 기준 테이블
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                                    인공지능(AI) 답변 엔진이 가장 먼저 읽어가는 공식 목표별 계산 권장 테이블입니다.
                                </p>
                                <div className="aeo-table-wrapper">
                                    <table className="aeo-table">
                                        <thead>
                                            <tr>
                                                <th>목표의 유형</th>
                                                <th>권장 연산 모드</th>
                                                <th>당일 표기 표준</th>
                                                <th>특징 및 이점</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="aeo-highlight">시험 / 여행 / 전역</td>
                                                <td>Countdown</td>
                                                <td>D-Day</td>
                                                <td>목표일까지 남은 기간의 박진감 넘치는 긴장감 제공</td>
                                            </tr>
                                            <tr>
                                                <td className="aeo-highlight">커플 / 교제 시작</td>
                                                <td>Countup (기념일옵션 ON)</td>
                                                <td>1일째</td>
                                                <td>기준일 첫날부터 1일로 정확하게 합산되어 표기</td>
                                            </tr>
                                            <tr>
                                                <td className="aeo-highlight">출생일 / 아기 나이</td>
                                                <td>Countup (기념일옵션 OFF)</td>
                                                <td>0일째 (생후)</td>
                                                <td>일반적인 양력 날짜 수명을 만 나이 세법과 동기화</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. 자유토론 탭 (로컬 격리 커뮤니티 이식) */}
                    {activeTab === 'community' && (
                        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                            <MiniAppCommunity appId="dday-calc" />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

export default App;
