import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { Header, Footer, Card, NewsCard } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

const API_BASE_URL = '';

interface CatalogItem {
    label: string;
    desc: string;
    href: string;
    icon: string;
    color: string;
    bg: string;
    keywords: string[];
}

// 사이트 전체 콘텐츠 카탈로그 (섹션 · 게임 · 생활도구)
const CATALOG: CatalogItem[] = [
    { label: '뉴스', desc: '실시간 속보·분야별 뉴스', href: '/news', icon: 'fa-newspaper', color: 'text-blue-600', bg: 'bg-blue-50', keywords: ['뉴스', 'news', '속보', '기사'] },
    { label: '금융', desc: '환율·증시·예적금 계산기', href: '/finance', icon: 'fa-won-sign', color: 'text-orange-600', bg: 'bg-orange-50', keywords: ['금융', '환율', '주가', '증시', '코스피', '대출', '예금', '적금', '이자'] },
    { label: '게임', desc: '무료 미니게임 모음', href: '/game', icon: 'fa-gamepad', color: 'text-purple-600', bg: 'bg-purple-50', keywords: ['게임', 'game', '미니게임'] },
    { label: '생활도구', desc: '계산기·변환기·맞춤법', href: '/lifestyle', icon: 'fa-tools', color: 'text-green-600', bg: 'bg-green-50', keywords: ['생활도구', '유틸리티', '도구', 'tool'] },
    { label: '테트리스', desc: '클래식 블록 게임', href: '/game/tetris', icon: 'fa-th', color: 'text-emerald-600', bg: 'bg-emerald-50', keywords: ['테트리스', 'tetris', '블록'] },
    { label: '스도쿠', desc: '숫자 퍼즐 게임', href: '/game/sudoku', icon: 'fa-table-cells', color: 'text-violet-600', bg: 'bg-violet-50', keywords: ['스도쿠', 'sudoku', '숫자', '퍼즐'] },
    { label: '2048', desc: '숫자 합치기 퍼즐', href: '/game/2048', icon: 'fa-grip', color: 'text-cyan-600', bg: 'bg-cyan-50', keywords: ['2048', '숫자', '퍼즐'] },
    { label: '지뢰찾기', desc: '클래식 지뢰찾기', href: '/game/minesweeper', icon: 'fa-bomb', color: 'text-red-600', bg: 'bg-red-50', keywords: ['지뢰찾기', 'minesweeper', '지뢰'] },
    { label: '계산기', desc: '다기능 온라인 계산기', href: '/app/calculator/', icon: 'fa-calculator', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['계산기', 'calculator', '사칙연산', '퍼센트', 'bmi'] },
    { label: '맞춤법 검사기', desc: '글자수·맞춤법 교정', href: '/app/text-checker/', icon: 'fa-spell-check', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['맞춤법', '글자수', '검사기', '띄어쓰기'] },
    { label: '만 나이 계산기', desc: '생년월일로 나이 계산', href: '/app/age-calc/', icon: 'fa-cake-candles', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['만나이', '나이', 'age', '생년월일'] },
    { label: 'D-Day 계산기', desc: '디데이·기념일 계산', href: '/app/dday-calc/', icon: 'fa-calendar-day', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['디데이', 'd-day', 'dday', '기념일', '날짜'] },
    { label: '평수 계산기', desc: '평↔㎡ 면적 변환', href: '/app/pyeong-calc/', icon: 'fa-ruler-combined', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['평수', '평', '제곱미터', '면적'] },
    { label: 'JSON 포맷터', desc: 'JSON 정렬·검증', href: '/app/json-formatter/', icon: 'fa-code', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['json', '포맷터', 'formatter'] },
    { label: 'Base64 변환기', desc: '인코딩·디코딩', href: '/app/base64-converter/', icon: 'fa-right-left', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['base64', '인코딩', '디코딩', '변환'] },
    { label: 'SVG 변환기', desc: 'SVG 편집·변환', href: '/app/svg-converter/', icon: 'fa-bezier-curve', color: 'text-slate-600', bg: 'bg-slate-100', keywords: ['svg', '변환', 'vector'] },
];

function matchCatalog(q: string): CatalogItem[] {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return CATALOG.filter(c =>
        c.label.toLowerCase().includes(t) ||
        c.keywords.some(k => k.toLowerCase().includes(t) || t.includes(k.toLowerCase()))
    );
}

export default function SearchPage() {
    const { user, logout } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const q = searchParams.get('q') || '';

    const [term, setTerm] = useState(q);
    const [newsResults, setNewsResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setTerm(q);
        if (!q.trim()) {
            setNewsResults([]);
            return;
        }
        let active = true;
        setLoading(true);
        axios.get(`${API_BASE_URL}/api/news/search`, { params: { q: q.trim(), limit: 20 } })
            .then(res => {
                if (!active) return;
                setNewsResults(res.data?.news || []);
            })
            .catch(err => {
                console.error('검색 오류:', err);
                if (active) setNewsResults([]);
            })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [q]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const next = term.trim();
        if (next) setSearchParams({ q: next });
    };

    const catalogMatches = matchCatalog(q);

    return (
        <div className="flex flex-col min-h-screen bg-slate-50">
            <PageSEO title={q ? `'${q}' 검색 결과` : '통합 검색'} description="FaithLink 통합 검색 — 뉴스, 게임, 생활도구를 한 번에 검색하세요." path="/search" />
            <Helmet><meta name="robots" content="noindex,follow" /></Helmet>
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-5xl mx-auto px-1 sm:px-4 py-10 w-full">
                {/* 검색 입력 */}
                <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center px-5 py-3 mb-8">
                    <i className="fas fa-search text-blue-500 mr-3"></i>
                    <input
                        type="text"
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                        placeholder="무엇을 찾으시나요?"
                        autoFocus
                        className="flex-1 bg-transparent border-none outline-none text-base text-gray-900 placeholder-gray-400 font-medium"
                    />
                    <button type="submit" className="flex items-center justify-center px-5 py-2 rounded-full bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all ml-3">
                        검색
                    </button>
                </form>

                {!q.trim() ? (
                    <div className="py-24 flex flex-col items-center justify-center text-slate-400">
                        <i className="fas fa-magnifying-glass text-4xl mb-4 text-slate-300"></i>
                        <p className="font-semibold text-slate-500">검색어를 입력해 주세요.</p>
                        <p className="text-sm mt-1">뉴스, 게임, 생활도구를 한 번에 찾을 수 있어요.</p>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-slate-500 mb-6"><b className="text-slate-800">'{q}'</b> 검색 결과</p>

                        {/* 바로가기 (섹션·게임·도구) */}
                        {catalogMatches.length > 0 && (
                            <section className="mb-10">
                                <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i className="fas fa-compass text-blue-500"></i> 바로가기
                                </h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {catalogMatches.map(c => (
                                        <a key={c.href} href={c.href} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all group">
                                            <span className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
                                                <i className={`fas ${c.icon} ${c.color} text-lg`}></i>
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{c.label}</span>
                                                <span className="block text-xs text-slate-400 truncate">{c.desc}</span>
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 뉴스 검색 결과 */}
                        <section>
                            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <i className="fas fa-newspaper text-blue-500"></i> 뉴스
                                {!loading && <span className="text-sm font-medium text-slate-400">{newsResults.length}건</span>}
                            </h2>

                            {loading ? (
                                <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                                    <i className="fas fa-circle-notch fa-spin text-2xl mb-3 text-blue-300"></i>
                                    <span className="animate-pulse">검색 중...</span>
                                </div>
                            ) : newsResults.length === 0 ? (
                                <Card className="py-16 text-center text-slate-500">
                                    <i className="fas fa-ghost text-3xl mb-3 text-slate-300"></i>
                                    <p className="font-semibold text-slate-600">'{q}'에 대한 뉴스가 없습니다.</p>
                                    {catalogMatches.length === 0 && <p className="text-sm mt-1 text-slate-400">다른 검색어로 시도해 보세요.</p>}
                                </Card>
                            ) : (
                                <Card className="p-2 sm:p-4">
                                    <div className="space-y-1">
                                        {newsResults.map((item, index) => (
                                            <NewsCard key={item.id || index} news={item} index={index} hideActions={true} />
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </section>
                    </>
                )}
            </main>
            <Footer />
        </div>
    );
}
