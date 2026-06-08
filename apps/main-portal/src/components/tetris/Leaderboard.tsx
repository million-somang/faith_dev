import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ScoreEntry {
    score: number;
    email: string | null;
    created_at: string;
}

interface LeaderboardProps {
    refreshTrigger?: boolean;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ refreshTrigger = false }) => {
    const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('/api/tetris/leaderboard');
                if (res.data.success) {
                    setLeaderboard(res.data.leaderboard);
                }
            } catch (err) {
                console.error('Failed to fetch leaderboard', err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [refreshTrigger]);

    return (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-md w-full max-w-sm">
            <h3 className="text-lg font-extrabold tracking-wider text-slate-800 mb-6 flex items-center gap-2.5">
                <i className="fas fa-trophy text-amber-500"></i>
                TOP PLAYERS
            </h3>

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

                        // 이름 마스킹 처리 (이메일 도메인 제거 및 앞 3글자만 표시)
                        const displayName = entry.email
                            ? entry.email.split('@')[0].slice(0, 3) + '***'
                            : 'Anonymous';

                        // 날짜 포맷
                        const dateStr = new Date(entry.created_at).toLocaleDateString('ko-KR', {
                            month: 'short', day: 'numeric'
                        });

                        return (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-xl border ${bgColor} transition-colors hover:bg-slate-50`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 text-center ${rankColor} font-mono flex items-center justify-center gap-1`}>
                                        {Icon ? Icon : index + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-slate-800 font-bold text-sm">{displayName}</span>
                                        <span className="text-[10px] text-slate-400 tracking-wider">
                                            {dateStr}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-emerald-600 font-mono font-bold tracking-wider text-base">
                                    {entry.score.toLocaleString()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
