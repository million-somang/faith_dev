'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface JanggiTierCounts {
    wins: number;
    losses: number;
    draws: number;
}

interface ScoreEntry {
    score?: number;
    email: string | null;
    created_at: string;
    // 숫자야구 / 장기 승패 전용 필드
    teamName?: string;
    playerName?: string;
    wins?: number;
    losses?: number;
    draws?: number;
    winRate?: number;
    shutouts?: number;
    avgInnings?: number;
    tierRecords?: Record<string, JanggiTierCounts>;
}

interface GameLeaderboardProps {
    /** 게임별 리더보드 API 경로 (예: /api/games/sudoku/leaderboard) */
    apiUrl: string;
    /** 게임 고유 식별자 (예: 'baseball', 'janggi') */
    gameId?: string;
}

const JANGGI_TIER_LABELS: { key: string; label: string }[] = [
    { key: 'master', label: '9단' },
    { key: 'hard', label: '1단' },
    { key: 'normal', label: '3급' },
    { key: 'easy', label: '10급' },
    { key: 'beginner', label: '18급' },
];

/**
 * 게임별 명예의 전당(점수 / 승패 전적) 표시 컴포넌트.
 * 통합 게임 점수 API(/api/games/:gameId/leaderboard) 응답({ leaderboard: [...] })을 사용한다.
 */
const GameLeaderboard: React.FC<GameLeaderboardProps> = ({ apiUrl, gameId }) => {
    const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const isBaseball = gameId === 'baseball';
    const isJanggi = gameId === 'janggi';
    const targetUrl = apiUrl || (gameId ? `/api/games/${gameId}/leaderboard` : '');

    useEffect(() => {
        let cancelled = false;
        if (!targetUrl) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(targetUrl);
                if (!cancelled && res.data?.success) {
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
    }, [targetUrl]);

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md w-full max-w-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold tracking-wider text-slate-800 flex items-center gap-2.5">
                    {isBaseball ? (
                        <i className="fas fa-baseball-bat-ball text-amber-500"></i>
                    ) : isJanggi ? (
                        <i className="fas fa-chess-knight text-amber-500"></i>
                    ) : (
                        <i className="fas fa-trophy text-amber-500"></i>
                    )}
                    {isBaseball ? 'TOP TEAMS' : isJanggi ? '대국 다승 랭킹' : 'TOP PLAYERS'}
                </h3>
                {(isBaseball || isJanggi) && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        다승·승률 순
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

                        const isJanggiEntry = isJanggi && (entry.wins !== undefined || !!entry.tierRecords);
                        const isBaseballEntry = !isJanggiEntry && (isBaseball || entry.wins !== undefined);

                        return (
                            <div
                                key={index}
                                className={`flex flex-col gap-2 p-3 rounded-xl border ${bgColor} transition-colors hover:bg-slate-50`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 min-w-0">
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

                                    {isJanggiEntry ? (
                                        <div className="text-right flex flex-col items-end shrink-0 pl-2">
                                            <div className="font-mono font-extrabold text-sm leading-tight flex items-center gap-1">
                                                <span className="text-emerald-600">{entry.wins ?? 0}승</span>
                                                {(entry.draws ?? 0) > 0 && (
                                                    <span className="text-slate-400 text-xs">{entry.draws}무</span>
                                                )}
                                                <span className="text-rose-600">{entry.losses ?? 0}패</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">
                                                승률 {Number(entry.winRate || 0).toFixed(0)}%
                                            </div>
                                        </div>
                                    ) : isBaseballEntry ? (
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

                                {isJanggiEntry && entry.tierRecords && (
                                    <div className="grid grid-cols-5 gap-1 pt-1.5 border-t border-slate-200/60">
                                        {JANGGI_TIER_LABELS.map((t) => {
                                            const r = entry.tierRecords?.[t.key] || { wins: 0, losses: 0, draws: 0 };
                                            const hasRecord = r.wins + r.losses + r.draws > 0;
                                            return (
                                                <div
                                                    key={t.key}
                                                    className={`px-1 py-0.5 rounded border text-center flex flex-col items-center justify-center ${
                                                        hasRecord
                                                            ? 'bg-amber-50/70 border-amber-200 text-slate-800'
                                                            : 'bg-white/70 border-slate-100 text-slate-400'
                                                    }`}
                                                >
                                                    <span className="text-[9px] font-extrabold leading-tight">{t.label}</span>
                                                    <span className="text-[9px] font-mono font-bold leading-tight">
                                                        {r.wins}승{r.losses}패
                                                    </span>
                                                </div>
                                            );
                                        })}
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
