import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { BannerSlot } from '../components/BannerSlot';
import { getGuideBySlug, getRelatedGuides } from '../data/guidesData';

export default function GuideDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [copied, setCopied] = useState(false);
    const [activeSection, setActiveSection] = useState<string>('');

    const article = slug ? getGuideBySlug(slug) : undefined;
    const relatedArticles = article ? getRelatedGuides(article.slug, article.category) : [];

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [slug]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-20% 0% -60% 0%' }
        );

        if (article) {
            article.tableOfContents.forEach((item) => {
                const el = document.getElementById(item.id);
                if (el) observer.observe(el);
            });
        }

        return () => observer.disconnect();
    }, [article]);

    if (!article) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
                <Header user={user} onLogout={logout} />
                <main className="flex-1 max-w-4xl mx-auto px-4 py-20 text-center">
                    <i className="fas fa-exclamation-triangle text-amber-500 text-4xl mb-4"></i>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">요청하신 가이드를 찾을 수 없습니다.</h2>
                    <p className="text-slate-500 text-sm mb-6">존재하지 않거나 삭제된 아티클입니다.</p>
                    <button
                        onClick={() => navigate('/guides')}
                        className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        가이드 목록으로 돌아가기
                    </button>
                </main>
                <Footer />
            </div>
        );
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: article.title,
                text: article.description,
                url: window.location.href,
            }).catch(() => {});
        } else {
            handleCopyLink();
        }
    };

    const getAuthorBio = (category: string, _role?: string): string => {
        switch (category) {
            case 'finance':
                return '글로벌 거시경제 지표와 금융시장 통계(한국은행, 미 연준, 금융감독원 등)를 분석하여 초보자부터 숙련된 투자자까지 실천할 수 있는 객관적이고 체계적인 자산배분 및 배당 투자 가이드를 연구·제공합니다.';
            case 'saju':
                return '동양학 고전 문헌과 사주명리학의 천문역법 원리를 현대 인문학 및 라이프사이클 관점에서 재해석하여, 맹신을 지양하고 합리적인 성향 분석과 자기이해를 돕는 깊이 있는 해석을 전달합니다.';
            case 'novel':
                return '디지털 스토리텔링 플랫폼의 독자 반응과 서사 구조를 정밀 분석하여, 기승전결 플롯 설계, 입체적 인물 갈등, 웹소설 장르 문법 등 창작자가 현업에서 즉시 활용 가능한 실전 작법 솔루션을 집필합니다.';
            case 'lifestyle':
                return '정부 공공데이터, 법령 개정안, 금융소비자 가이드라인을 기반으로 실생활에서 직면하는 복잡한 수치와 제도(평수 환산, 만나이 계산, 대출 상환 등)를 가장 쉽고 정확하게 풀이합니다.';
            case 'game':
                return '조합론, 확률론, 게임 이론 및 최적화 휴리스틱을 접목하여 스도쿠, 프리셀, 2048 등 클래식 두뇌 게임의 수학적 승리 전략과 알고리즘적 사고 훈련법을 심층 분석합니다.';
            case 'tech':
                return 'W3C 국제 웹 표준, IETF RFC 프로토콜 규격 및 최신 시스템 아키텍처 설계를 기반으로, 웹 개발자와 데이터 엔지니어가 신뢰할 수 있는 정확한 기술 명세와 성능 최적화 가이드를 제공합니다.';
            default:
                return '정확한 1차 자료와 체계적인 데이터 분석을 바탕으로 독자에게 실질적인 통찰을 제공하는 전문 지식 콘텐츠를 연구하고 집필합니다.';
        }
    };

    // JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': article.category === 'tech' ? 'TechArticle' : 'Article',
        headline: article.title,
        description: article.description,
        author: {
            '@type': 'Person',
            name: article.author,
            jobTitle: article.authorRole,
            worksFor: {
                '@type': 'Organization',
                name: 'VERA Knowledge Center',
                url: 'https://veranex.app',
            },
        },
        publisher: {
            '@type': 'Organization',
            name: 'VERA',
            url: 'https://veranex.app',
            logo: {
                '@type': 'ImageObject',
                url: 'https://veranex.app/logo-512.png',
            },
        },
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://veranex.app/guides/${article.slug}`,
        },
        keywords: article.tags.join(', '),
        articleSection: article.categoryLabel,
        inLanguage: 'ko-KR',
    };

    // Markdown formatted simple HTML rendering
    const renderFormattedContent = (content: string) => {
        // Sections splitting by lines
        const lines = content.trim().split('\n');
        const elements: React.ReactNode[] = [];
        let tableRows: string[][] = [];
        let isTable = false;
        let inCodeBlock = false;
        let codeContent: string[] = [];
        let sectionCount = 0;

        lines.forEach((line, idx) => {
            const trimmed = line.trim();

            if (trimmed.startsWith('```')) {
                if (inCodeBlock) {
                    elements.push(
                        <pre key={`code-${idx}`} className="bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto text-xs sm:text-sm font-mono my-4 border border-slate-800">
                            <code>{codeContent.join('\n')}</code>
                        </pre>
                    );
                    codeContent = [];
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                }
                return;
            }

            if (inCodeBlock) {
                codeContent.push(line);
                return;
            }

            // Table detection
            if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
                isTable = true;
                const cols = trimmed.split('|').slice(1, -1).map(c => c.trim());
                if (!cols.every(c => /^:?-+:?$/.test(c))) {
                    tableRows.push(cols);
                }
                return;
            } else if (isTable) {
                if (tableRows.length > 0) {
                    const header = tableRows[0];
                    const rows = tableRows.slice(1);
                    elements.push(
                        <div key={`table-${idx}`} className="overflow-x-auto my-6 rounded-2xl border border-slate-200 shadow-sm">
                            <table className="min-w-full divide-y divide-slate-200 text-sm text-left">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {header.map((th, thIdx) => (
                                            <th key={thIdx} className="px-4 py-3 font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                                                {th.replace(/\*\*/g, '')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {rows.map((r, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                                            {r.map((td, tdIdx) => (
                                                <td key={tdIdx} className="px-4 py-3 text-slate-600 text-xs sm:text-sm">
                                                    {td.replace(/\*\*/g, '')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                    tableRows = [];
                }
                isTable = false;
            }

            if (trimmed.startsWith('## ')) {
                sectionCount++;

                // 2번째 섹션 완료 후 (3번째 섹션 직전) 인아티클 광고 배너 배치
                if (sectionCount === 3) {
                    elements.push(
                        <BannerSlot
                            key="guide_in_article_banner"
                            slotKey="guide_in_article"
                            fallbackSlotKey="home_main_top"
                            label="SPONSORED LINK"
                            wrapperClassName="my-8 py-4 border-y border-slate-100 flex flex-col items-center w-full"
                            className="w-full"
                        />
                    );
                }

                const headerText = trimmed.replace('## ', '');
                // ID 매칭
                const matchingToc = article.tableOfContents.find(t => headerText.includes(t.title) || t.title.includes(headerText) || headerText.startsWith(t.title.slice(0, 5)));
                const id = matchingToc ? matchingToc.id : `section-${idx}`;
                elements.push(
                    <h2
                        key={`h2-${idx}`}
                        id={id}
                        className="text-xl sm:text-2xl font-black text-slate-900 mt-10 mb-4 pt-4 border-t border-slate-100 flex items-center gap-2 scroll-mt-24"
                    >
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                        <span>{headerText}</span>
                    </h2>
                );
            } else if (trimmed.startsWith('### ')) {
                elements.push(
                    <h3 key={`h3-${idx}`} className="text-lg sm:text-xl font-bold text-slate-800 mt-6 mb-3">
                        {trimmed.replace('### ', '')}
                    </h3>
                );
            } else if (trimmed.startsWith('- ')) {
                elements.push(
                    <li key={`li-${idx}`} className="text-slate-600 text-sm sm:text-base leading-relaxed ml-4 list-disc mb-1.5">
                        {trimmed.replace('- ', '')}
                    </li>
                );
            } else if (trimmed.startsWith('> ')) {
                elements.push(
                    <blockquote key={`quote-${idx}`} className="p-4 my-4 bg-blue-50/60 border-l-4 border-blue-500 rounded-r-xl text-slate-700 italic text-sm sm:text-base">
                        {trimmed.replace('> ', '')}
                    </blockquote>
                );
            } else if (trimmed.length > 0 && !trimmed.startsWith('---')) {
                elements.push(
                    <p key={`p-${idx}`} className="text-slate-700 text-sm sm:text-base leading-relaxed mb-4 font-normal">
                        {trimmed}
                    </p>
                );
            }
        });

        return elements;
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <PageSEO
                title={`${article.title} - VERA 가이드`}
                description={article.description}
                path={`/guides/${article.slug}`}
                type="article"
                article={{
                    author: article.author,
                    authorRole: article.authorRole,
                    publishedAt: article.publishedAt,
                    updatedAt: article.updatedAt,
                    section: article.categoryLabel,
                    tags: article.tags,
                    isTech: article.category === 'tech',
                }}
                jsonLd={jsonLd}
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
                {/* Breadcrumbs */}
                <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6 overflow-x-auto whitespace-nowrap">
                    <Link to="/" className="hover:text-slate-700 transition-colors">홈</Link>
                    <i className="fas fa-chevron-right text-[10px]"></i>
                    <Link to="/guides" className="hover:text-slate-700 transition-colors">가이드 & 칼럼</Link>
                    <i className="fas fa-chevron-right text-[10px]"></i>
                    <span className="text-slate-600">{article.categoryLabel}</span>
                </nav>

                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Main Content Body */}
                    <article className="flex-1 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
                        {/* Header metadata */}
                        <div className="mb-6">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${article.categoryColor}`}>
                                    {article.categoryLabel}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 shadow-2xs">
                                    <i className="fas fa-shield-check text-emerald-600"></i>
                                    <span>🛡️ 팩트체크 완료 · {article.factCheckedBy || 'VERA 검증팀'}</span>
                                </span>
                                <span className="text-slate-400 text-xs font-medium">
                                    <i className="far fa-calendar-alt mr-1"></i>발행 {article.publishedAt}
                                </span>
                                {article.updatedAt && (
                                    <span className="text-slate-600 text-xs font-medium bg-slate-100 px-2 py-0.5 rounded-md">
                                        <i className="fas fa-history mr-1 text-slate-400"></i>개정 {article.updatedAt}
                                    </span>
                                )}
                                <span className="text-slate-400 text-xs font-medium">
                                    <i className="far fa-clock mr-1"></i>{article.readTime} 소요
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                                {article.title}
                            </h1>
                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                                {article.description}
                            </p>
                        </div>

                        {/* Author & Actions Bar */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 mb-8 border-y border-slate-100 text-xs text-slate-500">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-sm shadow-sm ring-2 ring-white">
                                    {article.author.slice(0, 1)}
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-bold text-slate-900 text-sm">{article.author}</p>
                                        {article.authorRole && (
                                            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                                {article.authorRole}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        최종 감수: {article.updatedAt || article.publishedAt} · 검증: <span className="text-slate-600 font-medium">{article.factCheckedBy || 'VERA 데이터 검증팀'}</span> · <Link to="/editorial-policy" className="text-teal-700 font-bold hover:underline">편집 가이드라인 준수</Link>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                    onClick={handleCopyLink}
                                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition-colors flex items-center gap-1.5"
                                    title="링크 복사"
                                >
                                    <i className={`fas ${copied ? 'fa-check text-green-600' : 'fa-link'}`}></i>
                                    <span>{copied ? '복사됨' : '공유'}</span>
                                </button>
                                <button
                                    onClick={handleShare}
                                    className="p-1.5 w-8 h-8 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center"
                                    title="소셜 공유"
                                >
                                    <i className="fas fa-share-alt"></i>
                                </button>
                            </div>
                        </div>

                        {/* Article Content */}
                        <div className="prose max-w-none text-slate-800">
                            {renderFormattedContent(article.content)}
                        </div>

                        {/* Tags */}
                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">관련 태그</h4>
                            <div className="flex flex-wrap gap-2">
                                {article.tags.map(tag => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* E-E-A-T Author Profile Card Box */}
                        <div className="mt-10 rounded-3xl bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-900 to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-md ring-4 ring-white">
                                        {article.author.slice(0, 1)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">집필진 소개 · Author Profile</span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100/70 text-emerald-800 border border-emerald-300">
                                                <i className="fas fa-check-circle text-emerald-600"></i> 공인 필진
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 mt-0.5">
                                            {article.author}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-600">
                                            {article.authorRole || '수석 전문 연구원'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right w-full sm:w-auto">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 text-xs font-medium shadow-2xs">
                                        <i className="fas fa-shield-check text-emerald-600"></i>
                                        <span>검증: <strong>{article.factCheckedBy || 'VERA 데이터 검증팀'}</strong></span>
                                    </span>
                                </div>
                            </div>

                            <div className="pt-5 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide">
                                        <i className="fas fa-user-check text-blue-600"></i> 전문 분야 및 연구 기여
                                    </h4>
                                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                                        {getAuthorBio(article.category, article.authorRole)}
                                    </p>
                                </div>

                                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2">
                                    <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                                        <i className="fas fa-certificate text-amber-500"></i>
                                        <span>편집국 신뢰성 서약 (Editorial Commitment)</span>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        본 아티클은 정확하고 검증된 공공 및 학술 데이터를 기반으로 작성되었으며, 상업적 이해관계나 외부 스폰서십의 왜곡 없이 독립적으로 검수되었습니다. 사실관계 오류 제보 및 정정 요청은 <Link to="/editorial-policy" className="text-blue-600 font-bold underline">편집국 팩트체크 정책</Link>에 따라 신속히 반영됩니다.
                                    </p>
                                </div>

                                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 leading-normal flex items-start gap-1.5">
                                    <i className="fas fa-info-circle text-slate-400 mt-0.5 shrink-0"></i>
                                    <span>
                                        <strong>면책 공지:</strong> 본 콘텐츠는 일반적인 지식 제공을 목적으로 하며, 개별 재정·법률·의료 자문을 대체할 수 없습니다. 중요한 의사결정은 반드시 공인 전문가의 개별 상담을 거치시기 바랍니다.
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 기사 하단 배너 슬롯 */}
                        <BannerSlot 
                            slotKey="guide_bottom" 
                            fallbackSlotKey="guides_detail_bottom" 
                            label="SPONSORED LINK"
                            wrapperClassName="my-10 pt-6 border-t border-slate-100 flex flex-col items-center w-full"
                            className="w-full" 
                        />

                        {/* Bottom Navigation */}
                        <div className="mt-10 pt-6 border-t border-slate-100 flex items-center justify-between">
                            <button
                                onClick={() => navigate('/guides')}
                                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                                <i className="fas fa-arrow-left"></i>
                                <span>가이드 목록으로</span>
                            </button>
                            <button
                                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-200 transition-colors flex items-center gap-1.5"
                            >
                                <i className="fas fa-arrow-up"></i>
                                <span>맨 위로</span>
                            </button>
                        </div>
                    </article>

                    {/* Right Sticky Sidebar (TOC & Related) */}
                    <aside className="w-full lg:w-72 shrink-0 space-y-6">
                        {/* Table of Contents */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm sticky top-6">
                            <h3 className="font-black text-slate-900 text-sm mb-4 flex items-center gap-2">
                                <i className="fas fa-list-ol text-blue-600"></i>
                                <span>목차</span>
                            </h3>
                            <ul className="space-y-2.5 text-xs">
                                {article.tableOfContents.map(item => {
                                    const isActive = activeSection === item.id;
                                    return (
                                        <li key={item.id}>
                                            <a
                                                href={`#${item.id}`}
                                                className={`block leading-snug transition-colors py-1 pl-2 border-l-2 ${
                                                    isActive
                                                        ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-r'
                                                        : 'border-transparent text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                {item.title}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>

                            {/* Related Guides Widget */}
                            {relatedArticles.length > 0 && (
                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <h4 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5">
                                        <i className="fas fa-sparkles text-amber-500"></i>
                                        <span>추천 연관 가이드</span>
                                    </h4>
                                    <div className="space-y-3">
                                        {relatedArticles.map(rel => (
                                            <Link
                                                key={rel.slug}
                                                to={`/guides/${rel.slug}`}
                                                className="block p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                                            >
                                                <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 line-clamp-2 leading-snug">
                                                    {rel.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 mt-1 block">
                                                    {rel.categoryLabel} · {rel.readTime}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
