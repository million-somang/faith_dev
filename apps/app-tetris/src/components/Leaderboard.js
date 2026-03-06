import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Medal, Star } from 'lucide-react';
const Leaderboard = ({ refreshTrigger = false }) => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get('/api/tetris/leaderboard');
                if (res.data.success) {
                    setLeaderboard(res.data.leaderboard);
                }
            }
            catch (err) {
                console.error('Failed to fetch leaderboard', err);
            }
            finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [refreshTrigger]);
    return (_jsxs("div", { className: "bg-slate-800 rounded-xl p-6 border-2 border-slate-700 shadow-xl w-full max-w-sm mt-8", children: [_jsxs("h3", { className: "text-xl font-bold tracking-widest text-white mb-6 flex items-center gap-3", children: [_jsx(Trophy, { className: "text-yellow-400" }), "TOP PLAYERS"] }), loading ? (_jsx("div", { className: "text-center text-slate-400 py-8 animate-pulse", children: "Loading Ranks..." })) : leaderboard.length === 0 ? (_jsxs("div", { className: "text-center text-slate-400 py-8 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed", children: ["\uC544\uC9C1 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", _jsx("br", {}), "\uCCAB \uBC88\uC9F8 \uB7AD\uCEE4\uC5D0 \uB3C4\uC804\uD558\uC138\uC694!"] })) : (_jsx("div", { className: "flex flex-col gap-3", children: leaderboard.map((entry, index) => {
                    let Icon = null;
                    let rankColor = "text-slate-400";
                    let bgColor = "bg-slate-900/40 border-slate-700/50";
                    if (index === 0) {
                        Icon = _jsx(Trophy, { size: 18, className: "text-yellow-400" });
                        rankColor = "text-yellow-400 font-bold";
                        bgColor = "bg-yellow-500/10 border-yellow-500/30";
                    }
                    else if (index === 1) {
                        Icon = _jsx(Medal, { size: 18, className: "text-slate-300" });
                        rankColor = "text-slate-300 font-bold";
                        bgColor = "bg-slate-300/10 border-slate-300/30";
                    }
                    else if (index === 2) {
                        Icon = _jsx(Medal, { size: 18, className: "text-amber-600" });
                        rankColor = "text-amber-600 font-bold";
                        bgColor = "bg-amber-600/10 border-amber-600/30";
                    }
                    else {
                        Icon = _jsx(Star, { size: 14, className: "text-slate-600" });
                    }
                    // 이름 마스킹 처리 (이메일 도메인 제거 및 앞 3글자만 표시)
                    const displayName = entry.email
                        ? entry.email.split('@')[0].slice(0, 3) + '***'
                        : 'Anonymous';
                    // 날짜 포맷
                    const dateStr = new Date(entry.created_at).toLocaleDateString('ko-KR', {
                        month: 'short', day: 'numeric'
                    });
                    return (_jsxs("div", { className: `flex items-center justify-between p-3 rounded-lg border ${bgColor} transition-colors hover:bg-slate-700/50`, children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: `w-6 text-center ${rankColor} font-mono flex items-center justify-center gap-1`, children: Icon ? Icon : index + 1 }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-white font-medium", children: displayName }), _jsx("span", { className: "text-xs text-slate-500 tracking-wider", children: dateStr })] })] }), _jsx("div", { className: "text-emerald-400 font-mono font-bold tracking-widest text-lg", children: entry.score.toLocaleString() })] }, index));
                }) }))] }));
};
export default Leaderboard;
