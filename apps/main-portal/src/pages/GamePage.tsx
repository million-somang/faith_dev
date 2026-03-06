import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useAppLauncher } from '../hooks/useAppLauncher';

interface ScoreEntry {
    email: string;
    score: number;
    created_at: string;
    game_id?: string;
}

interface GameTab {
    id: string;
    label: string;
    icon: string;
    apiUrl: string;
}

const GAME_TABS: GameTab[] = [
    { id: 'all', label: '통합 랭킹', icon: 'fas fa-crown', apiUrl: '/api/games/leaderboard/all' },
    { id: 'tetris', label: '테트리스', icon: 'fas fa-th', apiUrl: '/api/games/tetris/leaderboard' },
    { id: 'sudoku', label: '스도쿠', icon: 'fas fa-table-cells', apiUrl: '/api/games/sudoku/leaderboard' },
];

const GAME_LABEL_MAP: Record<string, string> = {
    tetris: '테트리스',
    sudoku: '스도쿠',
};

export default function GamePage() {
    const { user, logout } = useAuth();
    const { launchApp } = useAppLauncher();

    const [activeTab, setActiveTab] = useState('all');
    const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchScores = useCallback(async (tabId?: string) => {
        const tab = GAME_TABS.find(t => t.id === (tabId || activeTab));
        if (!tab) return;

        setLoading(true);
        try {
            const res = await axios.get(tab.apiUrl);
            if (res.data.success) {
                setLeaderboard(res.data.leaderboard);
            }
        } catch (error) {
            console.error('점수 로딩 오류:', error);
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchScores();
    }, [fetchScores]);

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId);
        fetchScores(tabId);
    };

    // 팝업 게임 플레이 후 실시간 점수 갱신
    useEffect(() => {
        const handleFocus = () => {
            fetchScores();
        };

        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'GAME_SCORE_UPDATED' || event.data?.type === 'TETRIS_SCORE_UPDATED') {
                console.log('[GamePage] Received score update!', event.data);
                fetchScores();
            }
        };

        window.addEventListener('focus', handleFocus);
        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('message', handleMessage);
        };
    }, [fetchScores]);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <Header user={user} onLogout={logout} />
            <main className="flex-1 max-w-6xl mx-auto px-4 py-12 w-full">
                <div className="text-center mb-14">
                    <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">미니 게임</h1>
                    <p className="text-slate-500 text-lg">새로운 미니게임에 도전하고 명예의 전당에 이름을 올려보세요!</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        {/* 심플게임 영역 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <h2 className="text-[20px] font-bold text-slate-800 mb-5 border-b border-slate-100 pb-3">심플게임 플레이</h2>
                            <div className="flex flex-col gap-4">
                                <button onClick={() => launchApp('/app/tetris/', 'app-tetris')} className="bg-slate-50 border text-left border-slate-200 rounded-xl p-5 hover:bg-emerald-50 hover:border-emerald-200 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500"></div>
                                    <i className="fas fa-th text-3xl mb-3 text-emerald-500 group-hover:rotate-12 transition-transform"></i>
                                    <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">클래식 테트리스</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">블록을 쌓아 줄을 제거하고 높은 점수를 달성하세요!</p>
                                </button>

                                <button onClick={() => launchApp('/app/sudoku/', 'app-sudoku')} className="bg-slate-50 border text-left border-slate-200 rounded-xl p-5 hover:bg-violet-50 hover:border-violet-200 hover:shadow-md transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full -translate-y-1/2 translate-x-1/3 group-hover:scale-150 transition-transform duration-500"></div>
                                    <i className="fas fa-table-cells text-3xl mb-3 text-violet-500 group-hover:rotate-12 transition-transform"></i>
                                    <h3 className="font-bold text-lg text-slate-800 mb-1 group-hover:text-violet-700 transition-colors">스도쿠</h3>
                                    <p className="text-slate-500 text-xs leading-relaxed">빈 칸에 숫자를 채워 9×9 퍼즐을 완성하세요!</p>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 flex flex-col">
                        {/* 명예의 전당 (리더보드) 섹션 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6 h-full">
                            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
                                <i className="fas fa-trophy text-yellow-500 text-2xl" />
                                <h2 className="text-xl font-bold text-slate-800">명예의 전당</h2>
                            </div>

                            {/* 탭 네비게이션 */}
                            <div className="flex gap-1 mb-6 bg-slate-100 rounded-xl p-1">
                                {GAME_TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => handleTabChange(tab.id)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                                            ? 'bg-white text-slate-800 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                            }`}
                                    >
                                        <i className={`${tab.icon} text-xs ${activeTab === tab.id ? 'text-amber-500' : ''}`} />
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* 리더보드 내용 */}
                            {loading ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                    <i className="fas fa-circle-notch fa-spin text-3xl mb-3 text-emerald-300"></i>
                                    <span className="animate-pulse">점수 정보를 불러오는 중...</span>
                                </div>
                            ) : leaderboard.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center text-slate-500 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                                    <i className="fas fa-ghost text-4xl mb-4 text-slate-300"></i>
                                    <p className="font-semibold text-slate-600">아직 등록된 기록이 없습니다.</p>
                                    <p className="text-sm mt-1 text-slate-400">지금 바로 첫 번째 랭커가 되어보세요!</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {leaderboard.map((d, index) => {
                                        const isTopThree = index < 3;
                                        const rankBg = index === 0 ? "bg-yellow-100 text-yellow-700 font-black shadow-sm ring-1 ring-yellow-200"
                                            : index === 1 ? "bg-slate-200 text-slate-700 font-bold shadow-sm ring-1 ring-slate-300"
                                                : index === 2 ? "bg-amber-100 text-amber-800 font-bold shadow-sm ring-1 ring-amber-200"
                                                    : "bg-slate-50 text-slate-500 font-medium";
                                        const maskedEmail = d.email ? d.email.split("@")[0].slice(0, 3) + "***" : "비회원 무명씨";
                                        const dateStr = new Date(d.created_at).toLocaleDateString();
                                        const gameLabel = d.game_id ? GAME_LABEL_MAP[d.game_id] || d.game_id : null;

                                        return (
                                            <div key={index} className={`flex items-center justify-between p-4 rounded-xl border ${isTopThree ? "border-transparent" : "border-slate-100"} ${index === 0 ? "bg-gradient-to-r from-amber-50/50 to-white" : "bg-white"} transition-all hover:bg-slate-50 group`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-lg ${rankBg}`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex flex-col justify-center">
                                                        <span className="font-bold text-slate-800 text-[15px] group-hover:text-emerald-700 transition-colors">{maskedEmail}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {activeTab === 'all' && gameLabel && (
                                                                <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">{gameLabel}</span>
                                                            )}
                                                            <span className="text-[12px] text-slate-400">{dateStr} 달성</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-black text-emerald-600 text-2xl tracking-tighter drop-shadow-sm">
                                                    {d.score.toLocaleString()}<span className="text-xs text-slate-400 ml-1.5 font-sans font-medium tracking-normal">점</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}

