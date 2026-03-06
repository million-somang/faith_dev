import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer, Card, Button } from '@faithportal/ui';
import { getCategoryName, getCategoryColor, getTimeAgo } from '@faithportal/core-utils';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = '';

export default function NewsDetailPage() {
    const { user, logout } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [aiSummary, setAiSummary] = useState<string | null>(null);

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
        } catch (error) {
            console.error('Fetch news detail error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (voting) return;
        setVoting(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/news/${id}/vote`, { type });
            if (res.data.success) {
                // Update local state for immediate feedback
                setNews((prev: any) => ({
                    ...prev,
                    vote_up: type === 'up' ? (res.data.action === 'voted' ? prev.vote_up + 1 : prev.vote_up - 1) : prev.vote_up,
                    vote_down: type === 'down' ? (res.data.action === 'voted' ? prev.vote_down + 1 : prev.vote_down - 1) : prev.vote_down
                }));
            }
        } catch (error) {
            console.error('Vote error:', error);
        } finally {
            setVoting(false);
        }
    };

    const handleSummarize = async () => {
        if (summarizing || aiSummary) return;
        setSummarizing(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/news/${id}/summarize`);
            if (res.data.success) {
                setAiSummary(res.data.ai_summary);
            }
        } catch (error) {
            console.error('Summarize error:', error);
        } finally {
            setSummarizing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header user={user} onLogout={logout} />
                <main className="flex-1 flex items-center justify-center">
                    <div className="animate-spin w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full"></div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!news) {
        return (
            <div className="flex flex-col min-h-screen">
                <Header user={user} onLogout={logout} />
                <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">뉴스를 찾을 수 없습니다.</h2>
                    <Button onClick={() => navigate('/news')} className="bg-brand-green text-white">뉴스 목록으로 돌아가기</Button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
                    <a href="/" className="hover:text-gray-600">홈</a>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <a href="/news" className="hover:text-gray-600">뉴스</a>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <span className="text-gray-600">{getCategoryName(news.category)}</span>
                </div>

                <article className="space-y-8">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(news.category)}`}>
                                {getCategoryName(news.category)}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">{getTimeAgo(news.published_at)}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                            {news.title}
                        </h1>
                        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <i className="fas fa-user-edit"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{news.publisher || news.source || '기자 정보 없음'}</p>
                                    <p className="text-xs text-gray-400">FaithPortal News Service</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-500 transition-colors flex items-center justify-center shadow-sm">
                                    <i className="fas fa-share-alt"></i>
                                </button>
                                <button className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-yellow-500 transition-colors flex items-center justify-center shadow-sm">
                                    <i className="far fa-bookmark"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* AI Summary Section */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                    <i className="fas fa-magic"></i> AI 3줄 요약
                                </h3>
                                {!aiSummary && !summarizing && (
                                    <button
                                        onClick={handleSummarize}
                                        className="text-xs font-bold text-indigo-600 bg-white px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all"
                                    >
                                        요약 생성하기
                                    </button>
                                )}
                            </div>

                            {summarizing ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-4 bg-indigo-100 rounded w-full"></div>
                                    <div className="h-4 bg-indigo-100 rounded w-5/6"></div>
                                    <div className="h-4 bg-indigo-100 rounded w-4/6"></div>
                                </div>
                            ) : aiSummary ? (
                                <div className="space-y-2 text-indigo-800 text-sm leading-relaxed font-medium">
                                    {aiSummary.split('\n').map((line, idx) => (
                                        <p key={idx}>{line}</p>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-indigo-400 text-sm italic">AI가 기사 내용을 요약해 드립니다.</p>
                            )}
                        </div>
                        <i className="fas fa-brain absolute -right-4 -bottom-4 text-7xl text-indigo-500 opacity-5"></i>
                    </Card>

                    {/* Main Content */}
                    <div className="text-lg text-gray-800 leading-loose space-y-6">
                        {news.content ? (
                            <div dangerouslySetInnerHTML={{ __html: news.content }}></div>
                        ) : (
                            <p>{news.summary || news.description || '이 기사의 상세 정보는 외부 링크를 통해 확인해 주세요.'}</p>
                        )}

                        {news.link && (
                            <div className="mt-12 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-400 font-bold mb-1">ORIGINAL SOURCE</p>
                                    <p className="text-sm font-medium text-gray-600 truncate">{news.link}</p>
                                </div>
                                <a
                                    href={news.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="shrink-0 px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-xl font-bold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                >
                                    <span>원문보기</span>
                                    <i className="fas fa-external-link-alt text-[10px]"></i>
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Interaction Bar */}
                    <div className="py-12 border-t border-b border-gray-100 flex flex-col items-center gap-6">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">기사가 도움이 되셨나요?</p>
                        <div className="flex gap-6">
                            <button
                                onClick={() => handleVote('up')}
                                className="flex flex-col items-center gap-2 group"
                                disabled={voting}
                            >
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-all shadow-sm">
                                    <i className="fas fa-thumbs-up text-2xl"></i>
                                </div>
                                <span className="text-sm font-bold text-gray-500">{news.vote_up || 0}</span>
                            </button>
                            <button
                                onClick={() => handleVote('down')}
                                className="flex flex-col items-center gap-2 group"
                                disabled={voting}
                            >
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-red-500 group-hover:text-red-500 transition-all shadow-sm">
                                    <i className="fas fa-thumbs-down text-2xl"></i>
                                </div>
                                <span className="text-sm font-bold text-gray-500">{news.vote_down || 0}</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-8 flex justify-between">
                        <Button onClick={() => navigate('/news')} className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
                            <i className="fas fa-arrow-left mr-2"></i> 뉴스 목록
                        </Button>
                        <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-gray-900 text-white">
                            <i className="fas fa-arrow-up mr-2"></i> 맨 위로
                        </Button>
                    </div>
                </article>
            </main>

            <Footer />
        </div>
    );
}
