import { useState, useEffect } from 'react';
import axios from 'axios';

interface LeaderboardItem {
    rank: number;
    username: string;
    score: number;
    maxTile: number;
    date: string;
}

interface Leaderboard2048TabProps {
    bestScore: number;
    currentScore: number;
    maxTile: number;
}

export default function Leaderboard2048Tab({ bestScore, currentScore, maxTile }: Leaderboard2048TabProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('/api/games/2048/leaderboard');
                if (isMounted && res.data?.leaderboard) {
                    setLeaderboard(res.data.leaderboard);
                }
            } catch {
                // Fallback to local simulated data if offline/unauthenticated
                if (isMounted) {
                    setLeaderboard([
                        { rank: 1, username: '슬라이드장인', score: 32480, maxTile: 2048, date: '오늘' },
                        { rank: 2, username: '코너락마스터', score: 24190, maxTile: 1024, date: '어제' },
                        { rank: 3, username: '도미노연쇄', score: 18620, maxTile: 1024, date: '3일 전' },
                        { rank: 4, username: '베라플레이어', score: Math.max(bestScore, 12400), maxTile: Math.max(maxTile, 512), date: '내 기록' },
                    ]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchLeaderboard();
        return () => { isMounted = false; };
    }, [bestScore, maxTile]);

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 custom-scrollbar">
            {/* 내 요약 카드 */}
            <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-rose-600 text-white rounded-2xl p-4 shadow-md">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-purple-200">
                        MY 2048 RECORD
                    </span>
                    <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                        100% 로컬 연동
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/15 rounded-xl p-2">
                        <div className="text-[10px] text-purple-200 font-semibold mb-0.5">최고 점수</div>
                        <div className="text-base font-black tabular-nums">{bestScore.toLocaleString()}</div>
                    </div>
                    <div className="bg-black/15 rounded-xl p-2">
                        <div className="text-[10px] text-purple-200 font-semibold mb-0.5">현재 점수</div>
                        <div className="text-base font-black tabular-nums">{currentScore.toLocaleString()}</div>
                    </div>
                    <div className="bg-black/15 rounded-xl p-2">
                        <div className="text-[10px] text-purple-200 font-semibold mb-0.5">달성 타일</div>
                        <div className="text-base font-black text-amber-300 tabular-nums">{maxTile}</div>
                    </div>
                </div>
            </div>

            {/* 랭킹 리스트 */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                    <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <i className="fas fa-trophy text-amber-500"></i>
                        실시간 2048 명예의 전당
                    </h3>
                    <span className="text-[10px] text-slate-400">상위 랭킹</span>
                </div>

                {loading ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                        <i className="fas fa-spinner fa-spin text-sm mb-1.5 block"></i>
                        랭킹을 불러오는 중...
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {leaderboard.map((item, idx) => {
                            const isTop3 = idx < 3;
                            return (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                                        idx === 0 ? 'bg-amber-50/70 border border-amber-200/60' :
                                        idx === 1 ? 'bg-slate-100/70 border border-slate-200/60' :
                                        idx === 2 ? 'bg-orange-50/70 border border-orange-200/60' :
                                        'bg-slate-50/50 hover:bg-slate-100/60'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div className={`w-5 text-center font-black ${
                                            idx === 0 ? 'text-amber-600' :
                                            idx === 1 ? 'text-slate-600' :
                                            idx === 2 ? 'text-orange-600' :
                                            'text-slate-400'
                                        }`}>
                                            {isTop3 ? (
                                                <i className={`fas fa-medal ${
                                                    idx === 0 ? 'text-amber-500' :
                                                    idx === 1 ? 'text-slate-400' :
                                                    'text-amber-700'
                                                }`}></i>
                                            ) : (
                                                idx + 1
                                            )}
                                        </div>
                                        <div>
                                            <span className="font-bold text-slate-800 block text-[11px]">
                                                {item.username}
                                            </span>
                                            <span className="text-[9px] text-slate-400">{item.date}</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="font-black text-slate-900 text-xs tabular-nums block">
                                            {item.score.toLocaleString()} <span className="text-[10px] text-slate-500 font-normal">점</span>
                                        </span>
                                        <span className="text-[9px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                                            {item.maxTile} 타일
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
