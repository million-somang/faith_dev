import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ScoreEntry {
    score?: number;
    email: string | null;
    created_at: string;
    // 숫자야구 전용 필드
    teamName?: string;
    playerName?: string;
    wins?: number;
    losses?: number;
    winRate?: number;
    shutouts?: number;
    avgInnings?: number;
}

interface GameLeaderboardProps {
    /** 게임별 리더보드 API 경로 (예: /api/games/sudoku/leaderboard) */
    apiUrl: string;
    /** 게임 고유 식별자 (예: 'baseball') */
    gameId?: string;
}

/**
 * 게임별 명예의 전당(점수) 표시 컴포넌트.
 * 통합 게임 점수 API(/api/games/:gameId/leaderboard) 응답({ leaderboard: [...] })을 사용한다.
 */
const GameLeaderboard: React.FC<GameLeaderboardProps> = ({ apiUrl, gameId }) => {
    const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const isBaseball = gameId === 'baseball';

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(apiUrl);
                if (!cancelled && res.data.success) {
                    setLeaderboard(res.data.leaderboard || res.data.data || res.data.scores || []);
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchLeaderboard();

        const handleScoreUpdate = (e: MessageEvent) => {
            if (e.data?.type === 'GAME_SCORE_UPDATED') {
                fetchLeaderboard();
            }
        };
        window.addEventListener('message', handleScoreUpdate);

        return () => {
            cancelled = true;
            window.removeEventListener('message', handleScoreUpdate);
        };
    }, [apiUrl]);

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold tracking-wider text-slate-800 flex items-center gap-2.5">
                    {isBaseball ? (
                        <i className="fas fa-baseball-bat-ball text-amber-500"></i>
                    ) : (
                        <i className="fas fa-trophy text-amber-500"></i>
                    )}
                    {isBaseball ? 'TOP TEAMS' : 'TOP PLAYERS'}
                </h3>
                {isBaseball && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        다승 순
                    </span>
                )}
            </div>

            {loading ? (
                <div className="text-center text-slate-400 py-8 animate-pulse text-sm">
                    Loading Ranks...
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-sm">
                    아직 기록이 없습니다.<br />첫 번째 랭커에 도전하세요!
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {leaderboard.map((entry, index) => {
                        let Icon = null;
                        let rankColor = "text-slate-500";
                        let bgColor = "bg-slate-50/50 border-slate-200/60";

                        if (index === 0) {
                            Icon = <i className="fas fa-trophy text-amber-500 text-sm"></i>;
                            rankColor = "text-amber-600 font-bold";
                            bgColor = "bg-amber-500/5 border-amber-500/20";
                        } else if (index === 1) {
                            Icon = <i className="fas fa-medal text-slate-400 text-sm"></i>;
                            rankColor = "text-slate-500 font-bold";
                            bgColor = "bg-slate-100/50 border-slate-200/60";
                        } else if (index === 2) {
                            Icon = <i className="fas fa-medal text-orange-600 text-sm"></i>;
                            rankColor = "text-orange-600 font-bold";
                            bgColor = "bg-orange-500/5 border-orange-500/20";
                        } else {
                            Icon = <i className="fas fa-star text-slate-300 text-xs"></i>;
                        }

                        // 유저 아이디 마스킹
                        const displayName = entry.email
                            ? entry.email.split('@')[0].slice(0, 3) + '***'
                            : (entry.playerName || 'Anonymous');

                        const dateStr = entry.created_at
                            ? new Date(entry.created_at).toLocaleDateString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                              })
                            : '';

                        const isBaseballEntry = isBaseball || entry.wins !== undefined;

                        return (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-xl border ${bgColor} transition-colors hover:bg-slate-50`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-6 text-center ${rankColor} font-mono flex items-center justify-center gap-1 shrink-0`}>
                                        {Icon ? Icon : index + 1}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        {isBaseballEntry ? (
                                            <>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span className="text-slate-900 font-extrabold text-sm truncate">
                                                        {entry.teamName || '베라 마린스'}
                                                    </span>
                                                    {(entry.shutouts ?? 0) > 0 && (
                                                        <span className="px-1 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold shrink-0">
                                                            완봉 {entry.shutouts}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-slate-400 tracking-wider">
                                                    {displayName !== 'Anonymous' ? `(${displayName})` : ''} {dateStr}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-slate-800 font-bold text-sm truncate">{displayName}</span>
                                                <span className="text-[10px] text-slate-400 tracking-wider">
                                                    {dateStr}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isBaseballEntry ? (
                                    <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                        <div className="text-amber-600 font-mono font-extrabold text-sm sm:text-base leading-tight">
                                            {entry.wins ?? 0}승 {entry.losses ?? 0}패
                                        </div>
                                        <div className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">
                                            승률 {Number(entry.winRate || 0).toFixed(1)}%
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-emerald-600 font-mono font-bold tracking-wider text-base">
                                        {(entry.score ?? 0).toLocaleString()}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default GameLeaderboard;
