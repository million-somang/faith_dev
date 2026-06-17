import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Header, Footer, Card, NewsCard } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

const API_BASE_URL = '';
const PAGE_SIZE = 20;

export default function NewsBySourcePage() {
    const { user, logout } = useAuth();
    const { source } = useParams<{ source: string }>();
    const publisher = decodeURIComponent(source || '');

    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const loadNews = async (pageNum: number, isReset: boolean) => {
        if (!publisher) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/news`, {
                params: {
                    publisher,
                    limit: PAGE_SIZE,
                    offset: (pageNum - 1) * PAGE_SIZE,
                    includeStocks: true,
                },
            });
            if (res.data.success) {
                const items = res.data.news || [];
                if (items.length < PAGE_SIZE) setHasMore(false);
                setNews((prev) => (isReset ? items : [...prev, ...items]));
            }
        } catch (error) {
            console.error('Load news by source error:', error);
        } finally {
            setLoading(false);
        }
    };

    // 언론사가 바뀌면 초기화 후 첫 페이지 로드
    useEffect(() => {
        setNews([]);
        setPage(1);
        setHasMore(true);
        loadNews(1, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publisher]);

    useEffect(() => {
        if (page > 1) loadNews(page, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <PageSEO
                title={`${publisher} 뉴스`}
                description={`${publisher}의 최신 뉴스만 모아서 확인하세요.`}
                path={`/news/source/${encodeURIComponent(publisher)}`}
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-8 w-full">
                {/* 상단: 언론사명 + 언론사 목록으로 돌아가기 */}
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <i className="fas fa-building-columns text-brand-green"></i>
                        {publisher}
                    </h1>
                    <Link to="/news/sources" className="text-sm font-bold text-gray-500 hover:text-brand-green flex items-center gap-1 transition-colors">
                        <i className="fas fa-chevron-left text-xs"></i>
                        언론사 목록
                    </Link>
                </div>

                <Card className="!p-0 sm:!p-6 overflow-hidden">
                    <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{publisher} 최신 뉴스</h2>
                        <button
                            onClick={() => { setNews([]); setPage(1); setHasMore(true); loadNews(1, true); }}
                            className="text-gray-400 hover:text-brand-green transition-colors"
                            aria-label="새로고침"
                        >
                            <i className="fas fa-sync-alt"></i>
                        </button>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {news.map((n) => (
                            <NewsCard key={n.id} news={n} hideActions={true} />
                        ))}

                        {loading && (
                            <div className="p-12 text-center text-gray-400">
                                <div className="animate-spin w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full mx-auto mb-4"></div>
                                <p>뉴스를 불러오는 중입니다...</p>
                            </div>
                        )}

                        {!loading && news.length === 0 && (
                            <div className="p-12 text-center text-gray-400">
                                <i className="fas fa-newspaper text-5xl mb-4 opacity-20"></i>
                                <p>해당 언론사의 뉴스가 없습니다.</p>
                            </div>
                        )}

                        {hasMore && !loading && news.length > 0 && (
                            <div className="p-4">
                                <button
                                    onClick={() => setPage((prev) => prev + 1)}
                                    className="w-full py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-brand-green hover:border-brand-green transition-all"
                                >
                                    기사 더보기
                                    <i className="fas fa-chevron-down text-xs"></i>
                                </button>
                            </div>
                        )}
                    </div>
                </Card>
            </main>

            <Footer />
        </div>
    );
}
