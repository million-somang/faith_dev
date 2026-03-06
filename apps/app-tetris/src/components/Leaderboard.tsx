import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star } from 'lucide-react';

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
        <div className="bg-slate-800 rounded-xl p-6 border-2 border-slate-700 shadow-xl w-full max-w-sm mt-8">
            <h3 className="text-xl font-bold tracking-widest text-white mb-6 flex items-center gap-3">
                <Trophy className="text-yellow-400" />
                TOP PLAYERS
            </h3>

            {loading ? (
                <div className="text-center text-slate-400 py-8 animate-pulse">
                    Loading Ranks...
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="text-center text-slate-400 py-8 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
                    아직 기록이 없습니다.<br />첫 번째 랭커에 도전하세요!
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {leaderboard.map((entry, index) => {
                        let Icon = null;
                        let rankColor = "text-slate-400";
                        let bgColor = "bg-slate-900/40 border-slate-700/50";

                        if (index === 0) {
                            Icon = <Trophy size={18} className="text-yellow-400" />;
                            rankColor = "text-yellow-400 font-bold";
                            bgColor = "bg-yellow-500/10 border-yellow-500/30";
                        } else if (index === 1) {
                            Icon = <Medal size={18} className="text-slate-300" />;
                            rankColor = "text-slate-300 font-bold";
                            bgColor = "bg-slate-300/10 border-slate-300/30";
                        } else if (index === 2) {
                            Icon = <Medal size={18} className="text-amber-600" />;
                            rankColor = "text-amber-600 font-bold";
                            bgColor = "bg-amber-600/10 border-amber-600/30";
                        } else {
                            Icon = <Star size={14} className="text-slate-600" />;
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
                                className={`flex items-center justify-between p-3 rounded-lg border ${bgColor} transition-colors hover:bg-slate-700/50`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-6 text-center ${rankColor} font-mono flex items-center justify-center gap-1`}>
                                        {Icon ? Icon : index + 1}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white font-medium">{displayName}</span>
                                        <span className="text-xs text-slate-500 tracking-wider">
                                            {dateStr}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-emerald-400 font-mono font-bold tracking-widest text-lg">
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
