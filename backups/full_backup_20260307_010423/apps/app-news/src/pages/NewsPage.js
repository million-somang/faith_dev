import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useRef } from 'react';
import { Header, Footer, Card, NewsCard } from '@faithportal/ui';
import axios from 'axios';
const API_BASE_URL = '';
export default function NewsPage() {
    const [news, setNews] = useState([]);
    const [hotNews, setHotNews] = useState([]);
    const [category, setCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    // User features
    const [bookmarkedNewsIds, setBookmarkedNewsIds] = useState([]);
    const [subscribedKeywords, setSubscribedKeywords] = useState([]);
    const [newKeyword, setNewKeyword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const categories = [
        { id: 'all', name: '전체' },
        { id: 'general', name: '일반' },
        { id: 'politics', name: '정치' },
        { id: 'economy', name: '경제' },
        { id: 'tech', name: 'IT/과학' },
        { id: 'sports', name: '스포츠' },
        { id: 'entertainment', name: '엔터' },
        { id: 'stock', name: '주식' },
        { id: 'keyword', name: '키워드' }
    ];
    useEffect(() => {
        checkAuthAndFetchUserData();
    }, []);
    const checkAuthAndFetchUserData = async () => {
        try {
            const authRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { withCredentials: true });
            if (authRes.data.success && authRes.data.user) {
                setIsLoggedIn(true);
                fetchBookmarks();
                fetchKeywords();
            }
        }
        catch (error) {
            // Not logged in or error
        }
    };
    const fetchBookmarks = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/user/bookmarks`, { params: { limit: 200 }, withCredentials: true });
            if (res.data.success) {
                setBookmarkedNewsIds(res.data.bookmarks.map((b) => b.news_id));
            }
        }
        catch (error) {
            console.error('Fetch bookmarks error', error);
        }
    };
    const fetchKeywords = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/user/keywords`, { withCredentials: true });
            if (res.data.success) {
                setSubscribedKeywords(res.data.keywords);
            }
        }
        catch (error) {
            console.error('Fetch keywords error', error);
        }
    };
    const handleBookmarkToggle = async (newsId) => {
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }
        const isBookmarked = bookmarkedNewsIds.includes(newsId);
        try {
            if (isBookmarked) {
                await axios.delete(`${API_BASE_URL}/api/user/bookmarks/${newsId}`, { withCredentials: true });
                setBookmarkedNewsIds(prev => prev.filter(id => id !== newsId));
            }
            else {
                await axios.post(`${API_BASE_URL}/api/user/bookmarks`, { newsId }, { withCredentials: true });
                setBookmarkedNewsIds(prev => [...prev, newsId]);
            }
        }
        catch (error) {
            console.error('Bookmark toggle error', error);
        }
    };
    const handleAddKeyword = async (e) => {
        e.preventDefault();
        if (!newKeyword.trim())
            return;
        if (!isLoggedIn) {
            alert('로그인이 필요한 서비스입니다.');
            return;
        }
        try {
            const res = await axios.post(`${API_BASE_URL}/api/user/keywords`, { keyword: newKeyword.trim() }, { withCredentials: true });
            if (res.data.success) {
                setNewKeyword('');
                fetchKeywords();
                if (category === 'keyword') {
                    setNews([]);
                    setPage(1);
                    setHasMore(true);
                    loadNews(1, true);
                }
            }
        }
        catch (error) {
            console.error('Add keyword error', error);
            alert('키워드 추가 중 오류가 발생했습니다.');
        }
    };
    const handleRemoveKeyword = async (keywordId) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/user/keywords/${keywordId}`, { withCredentials: true });
            fetchKeywords();
            if (category === 'keyword') {
                setNews([]);
                setPage(1);
                setHasMore(true);
                loadNews(1, true);
            }
        }
        catch (error) {
            console.error('Remove keyword error', error);
        }
    };
    useEffect(() => {
        setNews([]);
        setPage(1);
        setHasMore(true);
        loadNews(1, true);
    }, [category]);
    useEffect(() => {
        fetchHotNews();
    }, []);
    useEffect(() => {
        if (page > 1) {
            loadNews(page, false);
        }
    }, [page]);
    const loaderRef = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !loading && hasMore) {
                setPage(prev => prev + 1);
            }
        }, { threshold: 0.1 });
        if (loaderRef.current)
            observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [loading, hasMore]);
    const loadNews = async (pageNum, isReset = false) => {
        if (!hasMore && !isReset)
            return;
        setLoading(true);
        try {
            const limit = 20;
            const offset = (pageNum - 1) * limit;
            let url = `${API_BASE_URL}/api/news`;
            let params = { limit, offset, includeStocks: true };
            if (searchTerm.trim()) {
                url = `${API_BASE_URL}/api/news/search`;
                params.q = searchTerm.trim();
            }
            else if (category === 'keyword') {
                if (!isLoggedIn) {
                    setLoading(false);
                    return; // Needs login UI
                }
                url = `${API_BASE_URL}/api/user/news/keywords`;
                params = { limit, offset, includeStocks: true }; // Override for keywords
            }
            else {
                params.category = category;
            }
            const res = await axios.get(url, { params, withCredentials: true });
            if (res.data.success) {
                const newItems = res.data.newsletters || res.data.news || [];
                if (newItems.length < limit) {
                    setHasMore(false);
                }
                setNews(prev => isReset ? newItems : [...prev, ...newItems]);
            }
        }
        catch (error) {
            console.error('Load news error:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchHotNews = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/news/hot`);
            if (res.data.success) {
                setHotNews(res.data.news);
            }
        }
        catch (error) {
            console.error('Fetch hot news error:', error);
        }
    };
    const handleSearch = (e) => {
        e.preventDefault();
        setNews([]);
        setPage(1);
        setHasMore(true);
        loadNews(1, true);
    };
    return (_jsxs("div", { className: "flex flex-col min-h-screen bg-gray-50", children: [_jsx(Header, {}), _jsxs("main", { className: "flex-1 max-w-6xl mx-auto px-4 py-8 w-full", children: [_jsxs("div", { className: "mb-8", children: [_jsxs("form", { onSubmit: handleSearch, className: "relative mb-6", children: [_jsx("input", { type: "text", placeholder: "\uB274\uC2A4 \uAC80\uC0C9...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full px-6 py-4 rounded-2xl border-none shadow-sm text-lg focus:ring-2 focus:ring-brand-green transition-all" }), _jsx("button", { type: "submit", className: "absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-green text-white rounded-xl flex items-center justify-center", children: _jsx("i", { className: "fas fa-search" }) })] }), _jsx("div", { className: "flex flex-wrap gap-2", children: categories.map((cat) => (_jsx("button", { onClick: () => setCategory(cat.id), className: `px-5 py-2 rounded-full font-bold text-sm transition-all ${category === cat.id
                                        ? 'bg-brand-green text-white shadow-md'
                                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'}`, children: cat.name }, cat.id))) })] }), _jsxs("div", { className: "flex flex-col lg:flex-row gap-8", children: [_jsx("div", { className: "flex-1", children: _jsxs(Card, { className: "p-0 overflow-hidden", children: [_jsxs("div", { className: "bg-white p-6 border-b border-gray-100 flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-bold text-gray-900", children: "\uCD5C\uC2E0 \uB274\uC2A4" }), _jsx("button", { onClick: () => { setNews([]); setPage(1); setHasMore(true); loadNews(1, true); }, className: "text-gray-400 hover:text-brand-green transition-colors", children: _jsx("i", { className: "fas fa-sync-alt" }) })] }), _jsxs("div", { className: "divide-y divide-gray-50", children: [category === 'keyword' && !isLoggedIn && (_jsxs("div", { className: "p-12 text-center", children: [_jsx("i", { className: "fas fa-lock text-5xl text-gray-300 mb-4" }), _jsx("p", { className: "text-gray-700 font-bold mb-2", children: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD55C \uC11C\uBE44\uC2A4\uC785\uB2C8\uB2E4" }), _jsx("p", { className: "text-gray-500 text-sm mb-4", children: "\uD0A4\uC6CC\uB4DC \uB274\uC2A4\uB97C \uBCF4\uB824\uBA74 \uBA3C\uC800 \uB85C\uADF8\uC778\uD574\uC8FC\uC138\uC694" })] })), news.map((n) => (_jsx(NewsCard, { news: n, isBookmarked: bookmarkedNewsIds.includes(n.id), onBookmarkToggle: handleBookmarkToggle }, n.id))), loading && (_jsxs("div", { className: "p-12 text-center text-gray-400", children: [_jsx("div", { className: "animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4" }), _jsx("p", { children: "\uB274\uC2A4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4..." })] })), !loading && news.length === 0 && (_jsxs("div", { className: "p-12 text-center text-gray-400", children: [_jsx("i", { className: "fas fa-newspaper text-5xl mb-4 opacity-20" }), _jsx("p", { children: "\uAC80\uC0C9 \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4." })] })), hasMore && !loading && category !== 'keyword' && news.length > 0 && (_jsx("div", { ref: loaderRef, className: "h-10 w-full" }))] })] }) }), _jsxs("aside", { className: "w-full lg:w-80 space-y-6", children: [_jsxs(Card, { className: "p-6", children: [_jsxs("h3", { className: "text-lg font-bold text-gray-900 mb-6 flex items-center", children: [_jsx("i", { className: "fas fa-fire text-red-500 mr-2" }), _jsx("span", { children: "\uC2E4\uC2DC\uAC04 HOT \uC774\uC288" })] }), _jsx("div", { className: "space-y-4", children: hotNews.map((n, idx) => (_jsxs("a", { href: `/news/${n.id}`, className: "flex items-start gap-3 group", children: [_jsx("span", { className: `text-sm font-black ${idx < 3 ? 'text-red-500' : 'text-gray-400'}`, children: idx + 1 }), _jsx("p", { className: "text-sm text-gray-700 font-medium line-clamp-2 group-hover:text-brand-green leading-snug", children: n.title })] }, n.id))) })] }), _jsxs(Card, { className: "p-6", children: [_jsxs("h3", { className: "text-lg font-bold text-gray-900 mb-6 flex items-center", children: [_jsx("i", { className: "fas fa-bookmark text-purple-500 mr-2" }), _jsx("span", { children: "\uD0A4\uC6CC\uB4DC \uAD6C\uB3C5" })] }), _jsx("div", { className: "mb-4 relative", children: _jsxs("form", { onSubmit: handleAddKeyword, children: [_jsx("input", { type: "text", placeholder: "\uD0A4\uC6CC\uB4DC \uC785\uB825...", value: newKeyword, onChange: (e) => setNewKeyword(e.target.value), className: "w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all" }), _jsx("button", { type: "submit", className: "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-brand-green text-white rounded-lg hover:bg-brand-green-hover transition-colors", children: _jsx("i", { className: "fas fa-plus text-xs" }) })] }) }), _jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar", children: !isLoggedIn ? (_jsx("p", { className: "text-sm text-gray-500 text-center py-4", children: "\uB85C\uADF8\uC778\uC774 \uD544\uC694\uD569\uB2C8\uB2E4" })) : subscribedKeywords.length > 0 ? (subscribedKeywords.map((kw) => (_jsxs("div", { className: "flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors", children: [_jsxs("span", { className: "text-sm font-medium text-gray-700", children: ["#", kw.keyword] }), _jsx("button", { onClick: () => handleRemoveKeyword(kw.id), className: "text-gray-400 hover:text-red-500 transition-colors p-1", title: "\uC0AD\uC81C", children: _jsx("i", { className: "fas fa-times text-sm" }) })] }, kw.id)))) : (_jsx("p", { className: "text-sm text-gray-500 text-center py-4", children: "\uAD6C\uB3C5\uD55C \uD0A4\uC6CC\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4" })) })] }), _jsxs("div", { className: "rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-6 text-white shadow-lg overflow-hidden relative", children: [_jsxs("div", { className: "relative z-10", children: [_jsx("p", { className: "text-xs font-bold opacity-80 mb-2", children: "ADVERTISEMENT" }), _jsx("h4", { className: "font-bold text-lg mb-4", children: "\uD504\uB9AC\uBBF8\uC5C4 \uBA64\uBC84\uC2ED \uC624\uD508" }), _jsx("button", { className: "px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold transition-all", children: "\uC790\uC138\uD788 \uBCF4\uAE30" })] }), _jsx("i", { className: "fas fa-crown absolute -right-4 -bottom-4 text-8xl opacity-10" })] })] })] })] }), _jsx(Footer, {})] }));
}
