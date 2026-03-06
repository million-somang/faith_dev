import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Header, Footer, Card, NewsCard } from '@faithportal/ui';
import axios from 'axios';
const API_BASE = '';
export default function MyPage() {
    const [keywords, setKeywords] = useState([]);
    const [keywordNews, setKeywordNews] = useState([]);
    const [bookmarks, setBookmarks] = useState([]);
    const [watchlist, setWatchlist] = useState([]);
    const [gameStats, setGameStats] = useState([]);
    const [utilHistory, setUtilHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const instance = axios.create({ withCredentials: true });
                const [kwRes, kwNewsRes, bmRes, wlRes, gsRes, utRes] = await Promise.all([
                    instance.get(`${API_BASE}/api/user/keywords`),
                    instance.get(`${API_BASE}/api/user/news/keywords?limit=5`),
                    instance.get(`${API_BASE}/api/user/bookmarks`),
                    instance.get(`${API_BASE}/api/user/watchlist`),
                    instance.get(`${API_BASE}/api/user/game-stats`),
                    instance.get(`${API_BASE}/api/user/utils/history`)
                ]);
                setKeywords(kwRes.data.keywords || []);
                setKeywordNews(kwNewsRes.data.news || []);
                setBookmarks(bmRes.data.bookmarks || bmRes.data.items || []);
                setWatchlist(wlRes.data.stocks || []);
                setGameStats(gsRes.data.stats || []);
                setUtilHistory(utRes.data.history || []);
            }
            catch (error) {
                console.error('Failed to fetch mypage data:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-green" }) }));
    }
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("main", { className: "flex-1 max-w-6xl mx-auto px-4 py-12 w-full", children: [_jsxs("header", { className: "mb-12", children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-2", children: "\uB9C8\uC774\uD398\uC774\uC9C0" }), _jsx("p", { className: "text-gray-500", children: "\uB098\uC758 \uC2A4\uD06C\uB7A9\uACFC \uD65C\uB3D9 \uB0B4\uC5ED\uC744 \uD55C\uB208\uC5D0 \uD655\uC778\uD558\uC138\uC694." })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [_jsxs("div", { className: "lg:col-span-2 space-y-8", children: [_jsxs(Card, { className: "p-8", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900 mb-6 flex items-center justify-between", children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx("i", { className: "fas fa-hashtag text-sky-500" }), " \uD0A4\uC6CC\uB4DC \uAD6C\uB3C5 \uB274\uC2A4"] }) }), _jsx("div", { className: "space-y-4", children: keywordNews.length > 0 ? (keywordNews.map((news) => (_jsx(NewsCard, { news: news }, news.id)))) : (_jsx("p", { className: "text-center py-12 text-gray-400", children: "\uAD6C\uB3C5 \uD0A4\uC6CC\uB4DC\uC640 \uC77C\uCE58\uD558\uB294 \uB274\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })) })] }), _jsxs(Card, { className: "p-8", children: [_jsxs("h3", { className: "text-xl font-bold text-gray-900 mb-6 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-bookmark text-amber-500" }), " \uBD81\uB9C8\uD06C\uD55C \uB274\uC2A4"] }), _jsx("div", { className: "space-y-4", children: bookmarks.length > 0 ? (bookmarks.map((news) => (_jsx(NewsCard, { news: news }, news.id)))) : (_jsx("p", { className: "text-center py-12 text-gray-400", children: "\uBD81\uB9C8\uD06C\uD55C \uB274\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })) })] }), _jsxs(Card, { className: "p-8", children: [_jsxs("h3", { className: "text-xl font-bold text-gray-900 mb-6 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-gamepad text-purple-500" }), " \uAC8C\uC784 \uD65C\uB3D9 \uD1B5\uACC4"] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: gameStats.length > 0 ? (gameStats.map((stat) => (_jsxs("div", { className: "bg-gray-50 p-4 rounded-xl border border-gray-100", children: [_jsx("p", { className: "text-xs font-bold text-gray-400 uppercase mb-1", children: stat.game_type }), _jsx("p", { className: "text-2xl font-black text-gray-900", children: stat.high_score.toLocaleString() }), _jsxs("p", { className: "text-[10px] text-gray-500 mt-1", children: [stat.play_count, "\uD68C \uD50C\uB808\uC774"] })] }, stat.game_type)))) : (_jsx("p", { className: "text-sm text-gray-400 col-span-3", children: "\uAC8C\uC784 \uD50C\uB808\uC774 \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })) })] })] }), _jsxs("div", { className: "space-y-8", children: [_jsxs(Card, { className: "p-6", children: [_jsxs("h3", { className: "font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-tags text-brand-green" }), " \uAD6C\uB3C5 \uD0A4\uC6CC\uB4DC"] }), _jsx("div", { className: "flex flex-wrap gap-2", children: keywords.length > 0 ? (keywords.map((kw) => (_jsxs("span", { className: "px-3 py-1 bg-green-50 text-brand-green text-sm font-bold rounded-full border border-green-100 flex items-center gap-2", children: ["#", kw.keyword, _jsx("button", { className: "hover:text-red-500 transition-colors", children: _jsx("i", { className: "fas fa-times text-[10px]" }) })] }, kw.id)))) : (_jsx("p", { className: "text-xs text-gray-400", children: "\uAD6C\uB3C5 \uC911\uC778 \uD0A4\uC6CC\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })) }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx("input", { type: "text", placeholder: "\uD0A4\uC6CC\uB4DC \uCD94\uAC00", className: "flex-1 bg-gray-100 border-none rounded-lg py-2 px-4 text-xs focus:ring-2 focus:ring-brand-green transition-all" }), _jsx("button", { className: "p-2 bg-brand-green text-white rounded-lg hover:bg-brand-green-hover", children: _jsx("i", { className: "fas fa-plus text-xs" }) })] })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("h3", { className: "font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-chart-line text-blue-500" }), " \uAD00\uC2EC \uC885\uBAA9"] }), _jsx("div", { className: "space-y-4", children: watchlist.length > 0 ? (watchlist.map((stock) => (_jsxs("div", { className: "flex items-center justify-between group", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-gray-900", children: stock.stock_name }), _jsx("p", { className: "text-[10px] text-gray-400 font-mono", children: stock.stock_symbol })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-xs font-bold text-gray-700", children: "\uC885\uBAA9 \uC815\uBCF4" }), _jsx("button", { className: "text-[10px] text-red-500 opacity-0 group-hover:opacity-100 transition-opacity", children: "\uC0AD\uC81C" })] })] }, stock.id)))) : (_jsx("p", { className: "text-xs text-gray-400", children: "\uAD00\uC2EC \uC885\uBAA9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })) })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("h3", { className: "font-bold text-gray-900 mb-4 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-history text-gray-500" }), " \uCD5C\uADFC \uB3C4\uAD6C \uC0AC\uC6A9 \uAE30\uB85D"] }), _jsx("div", { className: "space-y-3", children: utilHistory.length > 0 ? (utilHistory.map((h) => (_jsxs("div", { className: "text-xs border-b border-gray-50 pb-2 last:border-0", children: [_jsxs("div", { className: "flex justify-between mb-1", children: [_jsx("span", { className: "font-bold text-gray-700", children: h.util_type }), _jsx("span", { className: "text-[10px] text-gray-400", children: new Date(h.created_at).toLocaleDateString() })] }), _jsxs("p", { className: "text-gray-500 truncate italic", children: ["\"", JSON.stringify(h.input_data).substring(0, 30), "...\""] })] }, h.id)))) : (_jsx("p", { className: "text-xs text-gray-400", children: "\uCD5C\uADFC \uAE30\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })) })] })] })] })] }), _jsx(Footer, {})] }));
}
