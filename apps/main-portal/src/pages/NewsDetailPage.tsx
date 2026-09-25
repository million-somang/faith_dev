import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer, Button } from '@faithportal/ui';
import { getCategoryName, getCategoryColor, getTimeAgo, decodeHtmlEntities } from '@faithportal/core-utils';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { NewsRelatedToolsWidget } from '../components/news/NewsRelatedToolsWidget';
import { BannerSlot } from '../components/BannerSlot';
import { useAppLauncher } from '../hooks/useAppLauncher';

const API_BASE_URL = '';

export default function NewsDetailPage() {
    const { user, logout } = useAuth();
    const { id } = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);
    const { launchApp } = useAppLauncher();

    const handleOpenMiniApp = (url: string) => {
        const appId = url.replace(/\/$/, '').split('/').pop() || 'miniapp';
        launchApp(url, appId);
    };

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

    // 3가지 핵심 요약 추출 (DB의 ai_summary 최우선 파싱 -> 정확히 3개 항목 보장)
    const getThreeKeyPoints = (): string[] => {
        if (news?.ai_summary) {
            const lines = String(news.ai_summary)
                .split(/\n+/)
                .map(line => cleanEntities(line).replace(/^[•\-\*0-9\.\s]+/, '').trim())
                .filter(line => line.length > 0);
            if (lines.length > 0) return lines.slice(0, 3);
        }
        const fallbackLines = getSummaryLines();
        if (fallbackLines.length >= 3) return fallbackLines.slice(0, 3);
        if (fallbackLines.length > 0) return fallbackLines;
        return [cleanEntities(news?.title || '')];
    };

    // 스마트 문단 분할 및 띄어쓰기·줄바꿈 정제 엔진
    const formatArticleParagraphs = (rawContent: string): string[] => {
        if (!rawContent) return [];

        // 1. H1 제목 중복 제거
        let text = stripDuplicateTitle(rawContent);

        // 2. HTML 줄바꿈 태그 변환 및 태그 제거
        text = text
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .trim();

        // 3. 엔티티 디코딩
        text = cleanEntities(text);

        // 4. 문장 부호 뒤 띄어쓰기 누락 자동 보정 (예: '다.이번' -> '다. 이번')
        text = text.replace(/([가-힣\w\)]+[.?!])([가-힣“"‘\[(A-Z])/g, '$1 $2');
        text = text.replace(/,([가-힣A-Za-z])/g, ', $1');

        // 5. 1차 문단 분할 (\n\n 또는 \n)
        let paragraphs = text
            .split(/\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);

        // 6. 긴 통문장(줄바꿈 없이 200자 이상)인 경우 2~3문장 단위로 스마트 단락 호흡 분할
        const formattedParagraphs: string[] = [];
        for (const p of paragraphs) {
            if (p.length > 200) {
                const sentences = p.match(/[^.!?]+[.!?]+(?:["'”’]?\s*|$)/g) || [p];
                let currentChunk = '';
                for (let i = 0; i < sentences.length; i++) {
                    currentChunk += sentences[i];
                    if ((i + 1) % 2 === 0 || currentChunk.length >= 180) {
                        formattedParagraphs.push(currentChunk.trim());
                        currentChunk = '';
                    }
                }
                if (currentChunk.trim()) {
                    formattedParagraphs.push(currentChunk.trim());
                }
            } else {
                formattedParagraphs.push(p);
            }
        }

        return formattedParagraphs.filter(p => p.length > 0);
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
                <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-20 text-center">
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
                    title={`${news.title} - VERA 뉴스 & 실무 분석`}
                    description={(news.content || news.summary || '').replace(/<[^>]*>/g, '').substring(0, 160)}
                    path={`/news/${id}`}
                    type="article"
                    robots="noindex, follow"
                    jsonLd={{
                        '@context': 'https://schema.org',
                        '@type': 'NewsArticle',
                        headline: news.title,
                        description: (news.content || news.summary || '').replace(/<[^>]*>/g, '').substring(0, 160),
                        datePublished: news.published_at || news.created_at,
                        dateModified: news.updated_at || news.published_at || news.created_at,
                        author: {
                            '@type': 'Organization',
                            name: splitTitle(news.title).publisher || news.publisher || news.source || 'VERA 뉴스데스크'
                        },
                        publisher: { 
                            '@type': 'Organization', 
                            name: 'VERA',
                            logo: {
                                '@type': 'ImageObject',
                                url: 'https://veranex.app/logo-512.png'
                            }
                        },
                        mainEntityOfPage: {
                            '@type': 'WebPage',
                            '@id': `https://veranex.app/news/${id}`
                        }
                    }}
                />
            )}
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-3 sm:px-4 py-8 w-full">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-6 font-medium">
                    <a href="/" className="hover:text-gray-600">홈</a>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <a href="/news" className="hover:text-gray-600">뉴스</a>
                    <i className="fas fa-chevron-right text-[8px]"></i>
                    <span className="text-gray-600">{getCategoryName(String(news.category || '').split(',')[0])}</span>
                </div>

                <article className="space-y-6">
                    {/* Header Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {String(news.category || '').split(',').map((s: string) => s.trim()).filter(Boolean).map((cat: string) => (
                                <span key={cat} className={`px-3 py-1 rounded-full text-xs font-bold ${getCategoryColor(cat)}`}>
                                    {getCategoryName(cat)}
                                </span>
                            ))}
                            <span className="text-xs text-slate-400 font-medium">{getTimeAgo(news.created_at || news.published_at)}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-[1.3] tracking-tight">
                            {splitTitle(news.title).title}
                        </h1>
                        <div className="flex items-center justify-between pb-6 border-b border-slate-200/80">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-indigo-50 border border-slate-200 flex items-center justify-center text-indigo-600 shadow-2xs">
                                    <i className="fas fa-newspaper text-lg"></i>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-extrabold text-slate-900">
                                            {splitTitle(news.title).publisher || news.publisher || news.source || 'VERA 뉴스룸'}
                                        </p>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                                            <i className="fas fa-check-circle text-[9px]"></i> 팩트체크
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">VERA 분석 데스크 큐레이션</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-blue-500 transition-colors flex items-center justify-center shadow-xs" title="공유하기">
                                    <i className="fas fa-share-alt"></i>
                                </button>
                                <button className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-500 hover:text-yellow-500 transition-colors flex items-center justify-center shadow-xs" title="북마크">
                                    <i className="far fa-bookmark"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 대표 이미지 */}
                    {news.thumbnail && (
                        <div className="rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 bg-slate-100">
                            <img
                                src={news.thumbnail}
                                alt={news.title}
                                className="w-full max-h-[460px] object-cover"
                                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }}
                            />
                        </div>
                    )}

                    {/* 핵심 3줄 요약 카드 (가독성 높은 3-Points Brief) */}
                    {getThreeKeyPoints().length > 0 && (
                        <div className="bg-gradient-to-br from-indigo-50/60 via-slate-50 to-white rounded-3xl border border-indigo-150 p-5 sm:p-7 shadow-xs">
                            <div className="flex items-center justify-between pb-3.5 border-b border-indigo-100/70 mb-4">
                                <div className="flex items-center gap-2.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                                        <i className="fas fa-list-check text-indigo-600 text-sm"></i>
                                        <span>핵심 요약 3가지</span>
                                    </h3>
                                </div>
                                <span className="text-[11px] font-black text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                                    3-Points Brief
                                </span>
                            </div>
                            <ul className="space-y-3">
                                {getThreeKeyPoints().map((point, idx) => (
                                    <li key={idx} className="flex items-start gap-3.5 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs hover:border-indigo-200 transition-colors">
                                        <span className="w-6 h-6 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                                            {idx + 1}
                                        </span>
                                        <span className="text-[15px] sm:text-base text-slate-800 leading-relaxed font-semibold break-keep">
                                            {point}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Main Content Card (단락별 여유로운 호흡과 프리미엄 타이포그래피) */}
                    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-6">
                        {formatArticleParagraphs(news.content || news.summary || '').length > 0 ? (
                            <div className="article-body">
                                {formatArticleParagraphs(news.content || news.summary || '').map((paragraph, idx) => (
                                    <p
                                        key={idx}
                                        className="text-[17px] sm:text-[18px] text-slate-800 leading-[1.9] tracking-[-0.015em] break-keep mb-6 font-normal selection:bg-indigo-100"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <p className="text-base text-slate-500 py-6">이 기사의 상세 정보는 아래 원문보기를 통해 확인해 주세요.</p>
                        )}

                        {news.link && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">기사 원문 출처 (ORIGINAL SOURCE)</p>
                                        </div>
                                        <p className="text-xs text-slate-600 truncate font-mono">{news.link}</p>
                                    </div>
                                    <a
                                        href={news.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs hover:shadow-xs transition-all shrink-0"
                                    >
                                        <span>원문 기사 전문보기</span>
                                        <i className="fas fa-external-link-alt text-[10px] text-slate-400"></i>
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 기사 연계 맞춤 도구 (본문 하단에 깔끔하게 배치) */}
                    <NewsRelatedToolsWidget 
                        title={news.title}
                        category={String(news.category || '')}
                        content={news.content || news.summary || ''}
                        onOpenTool={handleOpenMiniApp}
                    />

                    {/* 본문 하단 스폰서/애드센스 슬롯 (배너/광고 데이터가 존재할 때만 안전하게 노출) */}
                    <BannerSlot 
                        slotKey="news_detail_bottom" 
                        label="ADVERTISEMENT"
                        wrapperClassName="w-full flex flex-col items-center justify-center bg-gray-50/80 rounded-2xl border border-gray-200/60 p-4 overflow-hidden my-4"
                        className="min-h-[200px] w-full" 
                    />

                    {/* Interaction Bar */}
                    <div className="py-6 border-t border-b border-gray-100 flex flex-col items-center gap-4">
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">기사와 분석 정보가 도움이 되셨나요?</p>
                        <div className="flex gap-6">
                            <button
                                onClick={() => handleVote('up')}
                                className="flex flex-col items-center gap-2 group"
                                disabled={voting}
                            >
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-blue-500 group-hover:text-blue-500 transition-all shadow-xs">
                                    <i className="fas fa-thumbs-up text-2xl"></i>
                                </div>
                                <span className="text-sm font-bold text-gray-500">{news.vote_up || 0}</span>
                            </button>
                            <button
                                onClick={() => handleVote('down')}
                                className="flex flex-col items-center gap-2 group"
                                disabled={voting}
                            >
                                <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-400 group-hover:border-red-500 group-hover:text-red-500 transition-all shadow-xs">
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
