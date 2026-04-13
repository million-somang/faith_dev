import { useState, useCallback, useMemo } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import {
    Heart, PlusCircle, ListChecks, Hourglass, CalendarPlus, Search,
    Trash2, CalendarHeart, Sparkles, X
} from 'lucide-react';

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

    // ── 로딩 ──
    if (isLoading) {
        return (
            <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <MiniAppLayout title="감성 D-Day 매니저">
            <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 overflow-y-auto flex flex-col">
                <div className="max-w-4xl mx-auto px-4 py-6 w-full">

                    {/* ── 헤더 ── */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl mb-3">
                            <Heart size={28} className="text-white" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 tracking-tight">
                            감성 D-Day 매니저
                        </h1>
                        <p className="text-slate-500 text-xs mt-1">
                            단순히 날짜만 세는 게 아니라, 설레는 기다림을 시각화해드립니다
                        </p>
                    </div>

                    {/* ── 메인 그리드: 좌(입력) - 우(리스트) ── */}
                    <div className="grid lg:grid-cols-2 gap-5">

                        {/* ── 좌측: D-Day 생성 ── */}
                        <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 h-fit">
                            <h2 className="text-base font-bold text-slate-200 mb-5 flex items-center gap-2">
                                <PlusCircle size={18} className="text-purple-400" />
                                새 D-Day 만들기
                            </h2>

                            {/* 제목 */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    제목 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="예: 유럽 여행 ✈️"
                                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* 날짜 */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                                    목표 날짜 <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={targetDate}
                                    onChange={e => setTargetDate(e.target.value)}
                                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                />
                            </div>

                            {/* 계산 모드 */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
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
                                            className={`px-3 py-2.5 rounded-xl font-semibold text-xs transition-all flex flex-col items-center gap-1 border ${
                                                currentMode === key
                                                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                                    : 'bg-slate-800/50 text-slate-500 border-slate-700/30 hover:bg-slate-700/50'
                                            }`}
                                        >
                                            <Icon size={16} />
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 기념일 옵션 */}
                            {currentMode === 'countup' && (
                                <div className="mb-4">
                                    <label className="flex items-center gap-2.5 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={isAnniversary}
                                            onChange={e => setIsAnniversary(e.target.checked)}
                                            className="w-4 h-4 accent-pink-500 rounded"
                                        />
                                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">
                                            <CalendarHeart size={14} className="inline mr-1 text-pink-400" />
                                            기준일을 1일로 포함 (커플 기념일용)
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* 배경색 */}
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    배경색 선택
                                </label>
                                <div className="flex gap-2.5">
                                    {COLOR_OPTIONS.map(opt => (
                                        <button
                                            key={opt.key}
                                            onClick={() => setSelectedColor(opt.key)}
                                            className={`w-9 h-9 rounded-full transition-all ${
                                                selectedColor === opt.key
                                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                                                    : 'hover:scale-105'
                                            }`}
                                            style={{ background: opt.gradient }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* 이모지 */}
                            <div className="mb-5">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    대표 이모지
                                </label>
                                <div className="grid grid-cols-6 gap-1.5">
                                    {EMOJI_OPTIONS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => setSelectedEmoji(emoji)}
                                            className={`text-xl py-1.5 rounded-lg transition-all text-center ${
                                                selectedEmoji === emoji
                                                    ? 'bg-purple-500/20 ring-1 ring-purple-400/50'
                                                    : 'hover:bg-slate-700/50'
                                            }`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 프리셋 */}
                            <div className="mb-5">
                                <label className="block text-xs font-medium text-slate-400 mb-2">
                                    <Sparkles size={12} className="inline mr-1" />
                                    빠른 선택
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setPreset('christmas')}
                                        className="px-3 py-2 bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition text-xs font-medium"
                                    >
                                        🎄 크리스마스
                                    </button>
                                    <button
                                        onClick={() => setPreset('newyear')}
                                        className="px-3 py-2 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition text-xs font-medium"
                                    >
                                        🎆 새해
                                    </button>
                                </div>
                            </div>

                            {/* 추가 버튼 */}
                            <button
                                onClick={addDday}
                                className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm rounded-xl hover:from-purple-600 hover:to-pink-600 transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2"
                            >
                                <PlusCircle size={18} />
                                리스트에 추가하기
                            </button>
                        </div>

                        {/* ── 우측: D-Day 대시보드 ── */}
                        <div className="space-y-4">

                            {/* Hero: 가장 가까운 D-Day */}
                            {heroDday && (
                                <div
                                    className="rounded-2xl shadow-2xl p-6 text-white"
                                    style={{
                                        background: `linear-gradient(135deg, ${heroDday.color} 0%, ${adjustColor(heroDday.color)} 100%)`,
                                    }}
                                >
                                    <h3 className="text-sm font-bold opacity-80 mb-3">🎯 가장 가까운 목표</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-5xl">{heroDday.emoji}</span>
                                        <div>
                                            <h2 className="text-2xl font-black mb-0.5">{heroDday.title}</h2>
                                            <p className="text-sm opacity-90">
                                                까지 딱 <span className="font-bold">{heroDday.diff}</span>일 남았어요!
                                            </p>
                                        </div>
                                    </div>
                                    <div className="bg-white/20 rounded-xl p-5 mb-3">
                                        <div className="text-5xl font-black text-center">
                                            {calculateDday(heroDday.targetDate, heroDday.mode, heroDday.isAnniversary)}
                                        </div>
                                    </div>
                                    <div className="bg-white/10 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="bg-white h-full rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(0, Math.min(100, 100 - (heroDday.diff / 30 * 100)))}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* D-Day 리스트 */}
                            <div className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-bold text-slate-200 flex items-center gap-2">
                                        <ListChecks size={18} className="text-purple-400" />
                                        나의 D-Day
                                        <span className="text-sm text-slate-500">({ddayData.length})</span>
                                    </h2>
                                </div>

                                {/* 빈 상태 */}
                                {ddayData.length === 0 && (
                                    <div className="text-center py-10">
                                        <div className="text-5xl mb-3">📅</div>
                                        <h3 className="text-base font-bold text-slate-300 mb-1">
                                            아직 등록된 D-Day가 없어요
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            왼쪽에서 새로운 D-Day를 만들어보세요!
                                        </p>
                                    </div>
                                )}

                                {/* 리스트 */}
                                <div className="grid grid-cols-1 gap-3">
                                    {ddayData.map(dday => {
                                        const ddayText = calculateDday(dday.targetDate, dday.mode, dday.isAnniversary);
                                        const gradientStyle = `linear-gradient(135deg, ${dday.color} 0%, ${adjustColor(dday.color)} 100%)`;

                                        return (
                                            <div
                                                key={dday.id}
                                                className="rounded-xl shadow-lg p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                                                style={{ background: gradientStyle }}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-3xl">{dday.emoji}</span>
                                                        <div className="text-white">
                                                            <h3 className="font-bold text-sm">{dday.title}</h3>
                                                            <p className="text-[11px] opacity-80">
                                                                {new Date(dday.targetDate).toLocaleDateString('ko-KR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteDday(dday.id)}
                                                        className="text-white/60 hover:text-white transition p-1"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="bg-white/20 rounded-lg p-3 text-center">
                                                    <div className="text-3xl font-black text-white">
                                                        {ddayText}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MiniAppLayout>
    );
}

export default App;
