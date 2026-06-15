import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer, Button } from '@faithportal/ui';
import { getCategoryName, getCategoryColor, getTimeAgo, decodeHtmlEntities } from '@faithportal/core-utils';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

const API_BASE_URL = '';

export default function NewsDetailPage() {
    const { user, logout } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        fetchNewsDetail();
    }, [id]);

    const fetchNewsDetail = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/news/${id}`);
            if (res.data.success) {
                setNews(res.data.news);
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

    // HTML 엔티티(&#039; &quot; &nbsp; 등) 정리 + 공백 정규화 — 기존 저장 데이터 호환용
    const cleanEntities = (text: string): string =>
        decodeHtmlEntities(text || '')
            .replace(/\s+/g, ' ')
            .trim();

    // 제목 끝의 " - 언론사" 분리
    const splitTitle = (raw: string): { title: string; publisher: string } => {
        const t = cleanEntities(raw);
        const sepIdx = t.lastIndexOf(' - ');
        if (sepIdx > 0 && t.length - sepIdx - 3 <= 25) {
            return { title: t.slice(0, sepIdx).trim(), publisher: t.slice(sepIdx + 3).trim() };
        }
        return { title: t, publisher: '' };
    };

    // 현재 기사 제목(언론사 제외) — 본문/요약에 그대로 반복되는 중복 제거 비교용
    const articleTitle = (): string => splitTitle(news?.title || '').title;

    // 본문 첫머리에 H1 제목이 그대로 붙어있으면 떼어낸다 (제목이 두 번 보이는 문제 방지)
    const stripDuplicateTitle = (text: string): string => {
        const t = cleanEntities(text);
        const title = articleTitle();
        if (title.length >= 8 && t.startsWith(title)) {
            return t.slice(title.length).replace(/^[\s,.;:·ㆍ・\-–—]+/, '').trim();
        }
        return t;
    };

    // 구글 뉴스 요약은 여러 헤드라인이 이어 붙은 형태 → 줄 단위로 분리해 가독성 개선
    const getSummaryLines = (): string[] => {
        const raw = news?.summary || news?.description || '';
        return raw
            .split(/&nbsp;&nbsp;|&amp;nbsp;&amp;nbsp;|\s{2,}/)
            .map((line: string) => cleanEntities(line)
                // 끝에 남은 불완전한 엔티티 조각 제거 (예: "...경고&nb")
                .replace(/&[a-z#0-9]{0,7}$/i, '')
                // 기존 데이터에서 앞에 붙어버린 매체 도메인 제거 (예: "v.daum.net한은총재...")
                .replace(/^(?:[a-z0-9-]+\.)+[a-z]{2,6}(?=[가-힣“"'‘\[(])/i, '')
                .trim())
            // 매체명만 남은 짧은 줄은 제외 (헤드라인은 충분히 긺)
            .filter((line: string) => line.length >= 12)
            // H1 제목과 동일·중복되는 줄 제외 (제목이 두 번 보이는 문제 방지)
            .filter((line: string) => {
                const title = articleTitle();
                if (title.length < 8) return true;
                return !(line === title || line.startsWith(title) || title.startsWith(line));
            });
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
            {news && (
                <PageSEO
                    title={`${news.title} - FaithLink 뉴스`}
                    description={(news.content || news.summary || '').replace(/<[^>]*>/g, '').substring(0, 160)}
                    path={`/news/${id}`}
                    type="article"
                    jsonLd={{
                        '@context': 'https://schema.org',
                        '@type': 'NewsArticle',
                        headline: news.title,
                        datePublished: news.published_at || news.created_at,
                        publisher: { '@type': 'Organization', name: 'FaithLink' },
                    }}
                />
            )}
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
                    <a href="/" className="hover:text-gray-600">홈</a>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <a href="/news" className="hover:text-gray-600">뉴스</a>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <span className="text-gray-600">{getCategoryName(String(news.category || '').split(',')[0])}</span>
                </div>

                <article className="space-y-5">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {String(news.category || '').split(',').map((s: string) => s.trim()).filter(Boolean).map((cat: string) => (
                                <span key={cat} className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(cat)}`}>
                                    {getCategoryName(cat)}
                                </span>
                            ))}
                            <span className="text-xs text-gray-400 font-medium">{getTimeAgo(news.published_at)}</span>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
                            {splitTitle(news.title).title}
                        </h1>
                        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                                    <i className="fas fa-user-edit"></i>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">
                                        {splitTitle(news.title).publisher || news.publisher || news.source || '기자 정보 없음'}
                                    </p>
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

                    {/* 대표 이미지 */}
                    {news.thumbnail && (
                        <div className="rounded-2xl overflow-hidden shadow-sm bg-gray-100">
                            <img
                                src={news.thumbnail}
                                alt={news.title}
                                className="w-full max-h-[420px] object-cover"
                                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* Main Content */}
                    <div className="text-gray-800 leading-relaxed space-y-6">
                        {news.content ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                <p className="text-lg leading-loose whitespace-pre-line">{stripDuplicateTitle(news.content)}</p>
                            </div>
                        ) : getSummaryLines().length > 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
                                {getSummaryLines().map((line, idx) => (
                                    <p key={idx} className="px-6 py-4 text-base leading-relaxed flex gap-3">
                                        <i className="fas fa-angle-right text-blue-400 mt-1.5 flex-shrink-0"></i>
                                        <span>{line}</span>
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-lg">이 기사의 상세 정보는 외부 링크를 통해 확인해 주세요.</p>
                        )}

                        {news.link && (
                            <div className="mt-5 p-5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-4">
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
                    <div className="py-6 border-t border-b border-gray-100 flex flex-col items-center gap-4">
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
                    <div className="pt-1 flex justify-between">
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
