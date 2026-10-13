import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header, Footer, Card } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

const API_BASE_URL = '';

interface SourceItem {
    publisher: string;
    count: number;
}

export default function NewsSourcesPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sources, setSources] = useState<SourceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        const fetchSources = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/news/sources`);
                if (res.data.success) {
                    setSources(res.data.sources || []);
                }
            } catch (error) {
                console.error('Fetch news sources error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSources();
    }, []);

    const filtered = useMemo(() => {
        const kw = keyword.trim();
        if (!kw) return sources;
        return sources.filter((s) => s.publisher.includes(kw));
    }, [sources, keyword]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <PageSEO
                title="언론사별 뉴스"
                description="원하는 언론사를 선택해 해당 언론사의 뉴스만 모아 볼 수 있습니다."
                path="/news/sources"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-8 w-full">
                {/* 상단: 제목 + 뉴스로 돌아가기 */}
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-building-columns text-brand-green"></i>
                        언론사별 보기
                    </h1>
                    <Link to="/news" className="text-sm font-bold text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                        <i className="fas fa-chevron-left text-xs"></i>
                        뉴스로
                    </Link>
                </div>

                <Card className="!p-0 sm:!p-6 overflow-hidden">
                    <div className="bg-white p-6 border-b border-gray-100">
                        <p className="text-sm text-gray-500 mb-4">언론사를 선택하면 해당 언론사의 뉴스만 모아서 볼 수 있습니다.</p>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="언론사 검색..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 pr-12 text-sm focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
                            />
                            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="py-12 text-center text-gray-400">
                                <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p>언론사 목록을 불러오는 중입니다...</p>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-12 text-center text-gray-400">
                                <i className="fas fa-building-columns text-5xl mb-4 opacity-20"></i>
                                <p>표시할 언론사가 없습니다.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filtered.map((s) => (
                                    <button
                                        key={s.publisher}
                                        onClick={() => navigate(`/news/source/${encodeURIComponent(s.publisher)}`)}
                                        className="flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-brand-green hover:bg-green-50 transition-all text-left group"
                                    >
                                        <span className="font-bold text-gray-800 text-sm truncate group-hover:text-brand-green">{s.publisher}</span>
                                        <span className="flex-shrink-0 text-xs font-bold text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{s.count}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
