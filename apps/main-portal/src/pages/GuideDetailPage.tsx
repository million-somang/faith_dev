import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
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

    // JSON-LD Schema
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        author: {
            '@type': 'Organization',
            name: article.author,
            url: 'https://veranex.app',
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
        dateModified: article.publishedAt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://veranex.app/guides/${article.slug}`,
        },
        keywords: article.tags.join(', '),
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
                                <span className="text-slate-400 text-xs font-medium">
                                    <i className="far fa-calendar-alt mr-1"></i>{article.publishedAt}
                                </span>
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
                        <div className="flex items-center justify-between py-4 mb-8 border-y border-slate-100 text-xs text-slate-500">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                    V
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{article.author}</p>
                                    <p className="text-[11px] text-slate-400">VERA 공인 에디터</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
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
                        <div className="mt-12 pt-6 border-t border-slate-100">
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
