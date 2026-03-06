import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer, Card, Button } from '@faithportal/ui';
import { getCategoryName, getCategoryColor, getTimeAgo } from '@faithportal/core-utils';
import axios from 'axios';
const API_BASE_URL = '';
export default function NewsDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState(null);
    useEffect(() => {
        fetchNewsDetail();
    }, [id]);
    const fetchNewsDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/news/${id}`);
            if (res.data.success) {
                setNews(res.data.news);
                if (res.data.news.ai_processed) {
                    setAiSummary(res.data.news.ai_summary);
                }
            }
        }
        catch (error) {
            console.error('Fetch news detail error:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleVote = async (type) => {
        if (voting)
            return;
        setVoting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/news/${id}/vote`, { type });
            if (res.data.success) {
                // Update local state for immediate feedback
                setNews((prev) => ({
                    ...prev,
                    vote_up: type === 'up' ? (res.data.action === 'voted' ? prev.vote_up + 1 : prev.vote_up - 1) : prev.vote_up,
                    vote_down: type === 'down' ? (res.data.action === 'voted' ? prev.vote_down + 1 : prev.vote_down - 1) : prev.vote_down
                }));
            }
        }
        catch (error) {
            console.error('Vote error:', error);
        }
        finally {
            setVoting(false);
        }
    };
    const handleSummarize = async () => {
        if (summarizing || aiSummary)
            return;
        setSummarizing(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/news/${id}/summarize`);
            if (res.data.success) {
                setAiSummary(res.data.ai_summary);
            }
        }
        catch (error) {
            console.error('Summarize error:', error);
        }
        finally {
            setSummarizing(false);
        }
    };
    if (loading) {
        return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx(Header, {}), _jsx("main", { className: "flex-1 flex items-center justify-center", children: _jsx("div", { className: "animate-spin w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full" }) }), _jsx(Footer, {})] }));
    }
    if (!news) {
        return (_jsxs("div", { className: "flex flex-col min-h-screen", children: [_jsx(Header, {}), _jsxs("main", { className: "flex-1 max-w-4xl mx-auto px-4 py-20 text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-4", children: "\uB274\uC2A4\uB97C \uCC3E\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4." }), _jsx(Button, { onClick: () => navigate('/news'), className: "bg-brand-green text-white", children: "\uB274\uC2A4 \uBAA9\uB85D\uC73C\uB85C \uB3CC\uC544\uAC00\uAE30" })] }), _jsx(Footer, {})] }));
    }
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("main", { className: "flex-1 max-w-4xl mx-auto px-4 py-8 w-full", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium", children: [_jsx("a", { href: "/", className: "hover:text-gray-600", children: "\uD648" }), _jsx("i", { className: "fas fa-chevron-right text-[8px]" }), _jsx("a", { href: "/news", className: "hover:text-gray-600", children: "\uB274\uC2A4" }), _jsx("i", { className: "fas fa-chevron-right text-[8px]" }), _jsx("span", { className: "text-gray-600", children: getCategoryName(news.category) })] }), _jsxs("article", { className: "space-y-8", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(news.category)}`, children: getCategoryName(news.category) }), _jsx("span", { className: "text-xs text-gray-400 font-medium", children: getTimeAgo(news.published_at) })] }), _jsx("h1", { className: "text-3xl sm:text-4xl font-black text-gray-900 leading-tight", children: news.title }), _jsxs("div", { className: "flex items-center justify-between pb-6 border-b border-gray-100", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400", children: _jsx("i", { className: "fas fa-user-edit" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-bold text-gray-900", children: news.publisher || news.source || '기자 정보 없음' }), _jsx("p", { className: "text-xs text-gray-400", children: "FaithPortal News Service" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-500 transition-colors flex items-center justify-center shadow-sm", children: _jsx("i", { className: "fas fa-share-alt" }) }), _jsx("button", { className: "w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-yellow-500 transition-colors flex items-center justify-center shadow-sm", children: _jsx("i", { className: "far fa-bookmark" }) })] })] })] }), _jsxs(Card, { className: "bg-gradient-to-br from-blue-50 to-indigo-50 border-none relative overflow-hidden", children: [_jsxs("div", { className: "relative z-10", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "font-bold text-indigo-900 flex items-center gap-2", children: [_jsx("i", { className: "fas fa-magic" }), " AI 3\uC904 \uC694\uC57D"] }), !aiSummary && !summarizing && (_jsx("button", { onClick: handleSummarize, className: "text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all", children: "\uC694\uC57D \uC0DD\uC131\uD558\uAE30" }))] }), summarizing ? (_jsxs("div", { className: "space-y-2 animate-pulse", children: [_jsx("div", { className: "h-4 bg-indigo-100 rounded w-full" }), _jsx("div", { className: "h-4 bg-indigo-100 rounded w-5/6" }), _jsx("div", { className: "h-4 bg-indigo-100 rounded w-4/6" })] })) : aiSummary ? (_jsx("div", { className: "space-y-2 text-indigo-800 text-sm leading-relaxed font-medium", children: aiSummary.split('\n').map((line, idx) => (_jsx("p", { children: line }, idx))) })) : (_jsx("p", { className: "text-indigo-400 text-sm italic", children: "AI\uAC00 \uAE30\uC0AC \uB0B4\uC6A9\uC744 \uC694\uC57D\uD574 \uB4DC\uB9BD\uB2C8\uB2E4." }))] }), _jsx("i", { className: "fas fa-brain absolute -right-4 -bottom-4 text-7xl text-indigo-500 opacity-5" })] }), _jsxs("div", { className: "text-lg text-gray-800 leading-loose space-y-6", children: [news.content ? (_jsx("div", { dangerouslySetInnerHTML: { __html: news.content } })) : (_jsx("p", { children: news.summary || news.description || '이 기사의 상세 정보는 외부 링크를 통해 확인해 주세요.' })), news.link && (_jsxs("div", { className: "mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-xs text-gray-400 font-bold mb-1", children: "ORIGINAL SOURCE" }), _jsx("p", { className: "text-sm font-medium text-gray-600 truncate", children: news.link })] }), _jsxs("a", { href: news.link, target: "_blank", rel: "noopener noreferrer", className: "shrink-0 px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2", children: [_jsx("span", { children: "\uC6D0\uBB38\uBCF4\uAE30" }), _jsx("i", { className: "fas fa-external-link-alt text-[10px]" })] })] }))] }), _jsxs("div", { className: "py-12 border-t border-b border-gray-100 flex flex-col items-center gap-6", children: [_jsx("p", { className: "text-sm font-bold text-gray-500 uppercase tracking-widest", children: "\uAE30\uC0AC\uAC00 \uB3C4\uC6C0\uC774 \uB418\uC168\uB098\uC694?" }), _jsxs("div", { className: "flex gap-6", children: [_jsxs("button", { onClick: () => handleVote('up'), className: "flex flex-col items-center gap-2 group", disabled: voting, children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-all shadow-sm", children: _jsx("i", { className: "fas fa-thumbs-up text-2xl" }) }), _jsx("span", { className: "text-sm font-bold text-gray-500", children: news.vote_up || 0 })] }), _jsxs("button", { onClick: () => handleVote('down'), className: "flex flex-col items-center gap-2 group", disabled: voting, children: [_jsx("div", { className: "w-16 h-16 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-red-500 group-hover:text-red-500 transition-all shadow-sm", children: _jsx("i", { className: "fas fa-thumbs-down text-2xl" }) }), _jsx("span", { className: "text-sm font-bold text-gray-500", children: news.vote_down || 0 })] })] })] }), _jsxs("div", { className: "pt-8 flex justify-between", children: [_jsxs(Button, { onClick: () => navigate('/news'), className: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50", children: [_jsx("i", { className: "fas fa-arrow-left mr-2" }), " \uB274\uC2A4 \uBAA9\uB85D"] }), _jsxs(Button, { onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }), className: "bg-gray-900 text-white", children: [_jsx("i", { className: "fas fa-arrow-up mr-2" }), " \uB9E8 \uC704\uB85C"] })] })] })] }), _jsx(Footer, {})] }));
}
