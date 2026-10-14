'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { getCategoryName, getCategoryColor, decodeHtmlEntities } from '@faithportal/core-utils';
import { useAuth } from '@/context/AuthContext';
import { NewsInsightWidget } from '@/components/news/NewsInsightWidget';
import { NewsRelatedToolsWidget } from '@/components/news/NewsRelatedToolsWidget';

export interface NewsItem {
    id: number;
    title: string;
    summary?: string;
    description?: string;
    content?: string;
    category?: string;
    publisher?: string;
    source?: string;
    link?: string;
    image_url?: string;
    thumbnail?: string;
    pubDate?: string;
    published_at?: string;
    created_at?: string;
    view_count?: number;
    vote_up?: number;
    vote_down?: number;
    ai_summary?: string;
}

interface NewsDetailClientProps {
    newsId: string;
    initialNews: NewsItem | null;
}

export default function NewsDetailClient({ newsId, initialNews }: NewsDetailClientProps) {
    const router = useRouter();
    const { user } = useAuth();

    const [news, setNews] = useState<NewsItem | null>(initialNews);
    const [loading, setLoading] = useState(!initialNews);
    const [error, setError] = useState<string | null>(null);
    const [voting, setVoting] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!newsId || initialNews) return;
        fetchNewsDetail();
    }, [newsId, initialNews]);

    const fetchNewsDetail = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/api/news/${newsId}`);
            if (res.data?.success && res.data?.news) {
                setNews(res.data.news);
            } else {
                setError('기사를 찾을 수 없습니다.');
            }
        } catch (err: any) {
            console.error('Fetch news detail error:', err);
            setError(err?.response?.data?.message || '기사를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 북마크 상태 확인
    useEffect(() => {
        if (!user || !newsId) return;
        checkBookmark();
    }, [user, newsId]);

    const checkBookmark = async () => {
        try {
            const res = await axios.get('/api/user/bookmarks', { params: { limit: 200 }, withCredentials: true });
            if (res.data?.success) {
                const bookmarked = (res.data.bookmarks || []).some(
                    (b: any) => String(b.news_id) === String(newsId)
                );
                setIsBookmarked(bookmarked);
            }
        } catch {
            // Not logged in or error
        }
    };

    const handleToggleBookmark = async () => {
        if (!user) {
            alert('로그인이 필요한 서비스입니다.');
            router.push('/login');
            return;
        }

        try {
            if (isBookmarked) {
                await axios.delete(`/api/user/bookmarks/${newsId}`, { withCredentials: true });
                setIsBookmarked(false);
            } else {
                await axios.post('/api/user/bookmarks', { newsId: Number(newsId) }, { withCredentials: true });
                setIsBookmarked(true);
            }
        } catch (err) {
            console.error('Bookmark toggle error', err);
            alert('북마크 처리 중 오류가 발생했습니다.');
        }
    };

    const handleVote = async (type: 'up' | 'down') => {
        if (!user) {
            alert('로그인이 필요한 서비스입니다.');
            router.push('/login');
            return;
        }
        if (voting) return;

        setVoting(true);
        try {
            const res = await axios.post(`/api/news/${newsId}/vote`, { type }, { withCredentials: true });
            if (res.data?.success) {
                const action = res.data.action;
                let upChange = 0;
                let downChange = 0;

                if (action === 'voted') {
                    if (type === 'up') upChange = 1;
                    else downChange = 1;
                } else if (action === 'cancelled') {
                    if (type === 'up') upChange = -1;
                    else downChange = -1;
                } else if (action === 'changed') {
                    if (type === 'up') {
                        upChange = 1;
                        downChange = -1;
                    } else {
                        upChange = -1;
                        downChange = 1;
                    }
                }

                setNews((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        vote_up: Math.max(0, (prev.vote_up || 0) + upChange),
                        vote_down: Math.max(0, (prev.vote_down || 0) + downChange),
                    };
                });
            }
        } catch (err) {
            console.error('Vote error:', err);
            alert('투표 처리 중 오류가 발생했습니다.');
        } finally {
            setVoting(false);
        }
    };

    const handleShare = async () => {
        if (typeof window === 'undefined') return;
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            alert('주소 복사에 실패했습니다.');
        }
    };

    // HTML 엔티티 정리
    const cleanEntities = (text: string): string =>
        decodeHtmlEntities(text || '')
            .replace(/\s+/g, ' ')
            .trim();

    // 제목 뒤의 " - 언론사" 분리
    const splitTitle = (raw: string): { title: string; publisher: string } => {
        const t = cleanEntities(raw);
        const sepIdx = t.lastIndexOf(' - ');
        if (sepIdx > 0 && t.length - sepIdx - 3 <= 25) {
            return { title: t.slice(0, sepIdx).trim(), publisher: t.slice(sepIdx + 3).trim() };
        }
        return { title: t, publisher: '' };
    };

    const articleInfo = splitTitle(news?.title || '');
    const displayPublisher = news?.publisher || news?.source || articleInfo.publisher || 'VERA 뉴스';

    // 본문 첫머리에 H1 제목이 그대로 붙어있으면 떼어낸다
    const stripDuplicateTitle = (text: string): string => {
        const t = cleanEntities(text);
        const title = articleInfo.title;
        if (title.length >= 8 && t.startsWith(title)) {
            return t.slice(title.length).replace(/^[\s,.;:·・\-\+\/\\]+/, '').trim();
        }
        return t;
    };

    // 요약문 라인 파싱
    const getSummaryLines = (): string[] => {
        const raw = news?.summary || news?.description || '';
        return raw
            .split(/&nbsp;&nbsp;|&amp;nbsp;&amp;nbsp;|\s{2,}/)
            .map((line: string) =>
                cleanEntities(line)
                    .replace(/&[a-z#0-9]{0,7}$/i, '')
                    .replace(/^(?:[a-z0-9-]+\.)+[a-z]{2,6}(?=[가-힣ㄱ-ㅎㅏ-ㅣ[(])/i, '')
                    .trim()
            )
            .filter((line: string) => line.length >= 12)
            .filter((line: string) => {
                const title = articleInfo.title;
                if (title.length < 8) return true;
                return !(line === title || line.startsWith(title) || title.startsWith(line));
            });
    };

    // 스마트 문단 분할기
    const formatArticleParagraphs = (rawContent: string): string[] => {
        if (!rawContent) return [];
        let text = stripDuplicateTitle(rawContent);
        text = text
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .trim();
        text = cleanEntities(text);
        text = text.replace(/([가-힣\w\)]+[.?!])([가-힣0-9[(A-Z])/g, '$1 $2');
        text = text.replace(/,([가-힣A-Za-z])/g, ', $1');

        const paragraphs = text
            .split(/\n+/)
            .map((p) => p.trim())
            .filter((p) => p.length > 0);

        if (paragraphs.length > 0) return paragraphs;
        return [text];
    };

    // 날짜 포맷
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const hours = String(d.getHours()).padStart(2, '0');
            const minutes = String(d.getMinutes()).padStart(2, '0');
            return `${year}.${month}.${day} ${hours}:${minutes}`;
        } catch {
            return dateStr;
        }
    };

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse">
                <div className="h-6 w-32 bg-slate-200 rounded-lg mb-4"></div>
                <div className="h-10 w-3/4 bg-slate-200 rounded-xl mb-6"></div>
                <div className="h-5 w-48 bg-slate-200 rounded-lg mb-8"></div>
                <div className="h-44 bg-slate-200 rounded-3xl mb-6"></div>
                <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                </div>
            </div>
        );
    }

    if (error || !news) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-16 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl border border-rose-100">
                    <i className="fas fa-triangle-exclamation"></i>
                </div>
                <h1 className="text-xl font-black text-slate-800 mb-2">기사를 찾을 수 없습니다</h1>
                <p className="text-sm text-slate-500 mb-6">{error || '요청하신 기사가 삭제되었거나 존재하지 않습니다.'}</p>
                <Link
                    href="/news"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-colors shadow-xs"
                >
                    <i className="fas fa-arrow-left text-xs"></i>
                    <span>뉴스 목록으로 돌아가기</span>
                </Link>
            </div>
        );
    }

    const categorySlug = news.category || 'general';
    const categoryName = getCategoryName(categorySlug);
    const categoryColor = getCategoryColor(categorySlug);
    const formattedParagraphs = formatArticleParagraphs(news.content || news.summary || '');
    const summaryLines = getSummaryLines();

    return (
        <div className="min-h-screen bg-slate-50/60 pb-16">
            <main className="max-w-4xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8">
                {/* 1. 상단 경로 (Breadcrumb) */}
                <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-4" aria-label="브레드크럼">
                    <Link href="/" className="hover:text-blue-600 transition-colors">홈</Link>
                    <i className="fas fa-chevron-right text-[9px] text-slate-400"></i>
                    <Link href="/news" className="hover:text-blue-600 transition-colors">뉴스</Link>
                    <i className="fas fa-chevron-right text-[9px] text-slate-400"></i>
                    <span className="text-slate-800 font-bold">{categoryName}</span>
                </nav>

                {/* 2. 기사 헤더 영역 */}
                <header className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-8 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${categoryColor}`}>
                            {categoryName}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                            {displayPublisher}
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl lg:text-[26px] font-black text-slate-900 leading-snug sm:leading-tight mb-4 break-keep">
                        {articleInfo.title}
                    </h1>

                    {/* 메타 정보 바 */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3.5 border-t border-slate-100 text-xs text-slate-500">
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5">
                                <i className="far fa-clock text-slate-400"></i>
                                {formatDate(news.pubDate || news.published_at || news.created_at)}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="far fa-eye text-slate-400"></i>
                                조회 {(news.view_count || 0) + 1}
                            </span>
                        </div>

                        {/* 우측 액션: 북마크 & 공유 */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleToggleBookmark}
                                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                                    isBookmarked
                                        ? 'bg-amber-50 text-amber-600 border-amber-200'
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                                title="북마크 저장"
                            >
                                <i className={`${isBookmarked ? 'fas text-amber-500' : 'far'} fa-bookmark`}></i>
                                <span>{isBookmarked ? '저장됨' : '북마크'}</span>
                            </button>
                            <button
                                onClick={handleShare}
                                className="px-3 py-1.5 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="기사 링크 복사"
                            >
                                <i className="fas fa-share-nodes text-slate-400"></i>
                                <span>{copied ? '복사완료!' : '공유'}</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* 3. AI 핵심 요약 & 실생활 영향 분석 위젯 */}
                <NewsInsightWidget
                    title={articleInfo.title}
                    category={categoryName}
                    summaryLines={summaryLines}
                    content={news.content || news.summary || ''}
                    aiSummary={news.ai_summary}
                />

                {/* 4. 기사 본문 영역 */}
                <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-9 space-y-6">
                    {/* 대표 썸네일 이미지 (있을 경우) */}
                    {(news.image_url || news.thumbnail) && (
                        <div className="overflow-hidden rounded-2xl border border-slate-200/80 mb-6 bg-slate-50 max-h-96 flex items-center justify-center">
                            <img
                                src={news.image_url || news.thumbnail}
                                alt={articleInfo.title}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    )}

                    {/* 본문 문단들 */}
                    {formattedParagraphs.length > 0 ? (
                        <div className="article-body">
                            {formattedParagraphs.map((paragraph, idx) => (
                                <p
                                    key={idx}
                                    className="text-[17px] sm:text-[18px] text-slate-800 leading-[1.9] tracking-[-0.015em] break-keep mb-6 font-normal selection:bg-blue-100"
                                >
                                    {paragraph}
                                </p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-base text-slate-500 py-6">
                            기사의 전문 정보는 아래 원문보기를 통해 확인해 주세요.
                        </p>
                    )}

                    {/* 기사 원문 출처 링크 박스 */}
                    {news.link && (
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                                            기사 원문 출처 (ORIGINAL SOURCE)
                                        </p>
                                    </div>
                                    <p className="text-xs text-slate-600 truncate font-mono">{news.link}</p>
                                </div>
                                <a
                                    href={news.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all shrink-0 cursor-pointer"
                                >
                                    <span>원문 기사 전문보기</span>
                                    <i className="fas fa-external-link-alt text-[10px] text-slate-400"></i>
                                </a>
                            </div>
                        </div>
                    )}
                </article>

                {/* 5. 기사 연계 맞춤 생활도구 위젯 */}
                <NewsRelatedToolsWidget
                    title={articleInfo.title}
                    category={categoryName}
                    content={news.content || news.summary || ''}
                />

                {/* 6. 기사 평가 (좋아요/싫어요 투표) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-6 my-6 text-center">
                    <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">
                        기사와 AI 분석 정보가 도움이 되셨나요?
                    </p>
                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => handleVote('up')}
                            disabled={voting}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-blue-500 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all shadow-2xs">
                                <i className="fas fa-thumbs-up text-xl"></i>
                            </div>
                            <span className="text-xs font-black text-slate-600">{news.vote_up || 0}</span>
                        </button>
                        <button
                            onClick={() => handleVote('down')}
                            disabled={voting}
                            className="flex flex-col items-center gap-2 group cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-rose-500 group-hover:text-rose-600 group-hover:bg-rose-50 transition-all shadow-2xs">
                                <i className="fas fa-thumbs-down text-xl"></i>
                            </div>
                            <span className="text-xs font-black text-slate-600">{news.vote_down || 0}</span>
                        </button>
                    </div>
                </div>

                {/* 7. 하단 네비게이션 액션 */}
                <footer className="pt-2 flex justify-between items-center">
                    <Link
                        href="/news"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-sm transition-colors shadow-2xs"
                    >
                        <i className="fas fa-arrow-left text-xs"></i>
                        <span>뉴스 목록으로</span>
                    </Link>
                    <button
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-colors shadow-2xs cursor-pointer"
                    >
                        <i className="fas fa-arrow-up text-xs"></i>
                        <span>맨 위로</span>
                    </button>
                </footer>
            </main>
        </div>
    );
}
