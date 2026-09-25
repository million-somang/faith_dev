import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { BannerSlot } from '../components/BannerSlot';
import EntertainmentSubMenu from '../components/EntertainmentSubMenu';

const API_BASE_URL = '';

interface TravelArticle {
    id: number;
    title: string;
    destination: string;
    region: string;
    category: string;
    summary: string | null;
    ai_summary: string | null;
    content: string;
    travel_tips: string | null;
    thumbnail: string | null;
    gallery: string | null;
    best_season: string | null;
    duration: string | null;
    estimated_cost: string | null;
    location_address: string | null;
    tags: string | null;
    author: string | null;
    source: string | null;
    source_url: string | null;
    view_count: number;
    like_count: number;
    published_at: string;
}

export default function TravelDetailPage() {
    const { user, logout } = useAuth();
    const { id } = useParams();
    const [article, setArticle] = useState<TravelArticle | null>(null);

    const [related, setRelated] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (id) {
            fetchArticleDetail(id);
        }
    }, [id]);

    const fetchArticleDetail = async (articleId: string) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/api/travel/${articleId}`);
            if (res.data?.success && res.data.article) {
                const data: TravelArticle = res.data.article;
                setArticle(data);
                setLikeCount(data.like_count || 0);
                setRelated(res.data.related || []);
            }
        } catch (error) {
            console.error('[Fetch Travel Detail Error]', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!article || liked) return;
        try {
            setLiked(true);
            setLikeCount(prev => prev + 1);
            await axios.post(`${API_BASE_URL}/api/travel/${article.id}/like`);
        } catch (error) {
            console.error('[Like Error]', error);
        }
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    // AI 핵심 3대 포인트 파싱
    const getThreeKeyPoints = (): string[] => {
        if (article?.ai_summary) {
            const lines = article.ai_summary
                .split('\n')
                .map(line => line.replace(/^[•\-\*0-9\.\s]+/, '').trim())
                .filter(line => line.length > 0);
            if (lines.length > 0) return lines.slice(0, 3);
        }
        if (article?.summary) {
            return [article.summary];
        }
        return [article?.title || ''];
    };

    // 스마트 문단 분할 및 가독성 개선
    const formatParagraphs = (rawContent: string): string[] => {
        if (!rawContent) return [];
        return rawContent
            .replace(/<br\s*[\/]?>/gi, '\n')
            .replace(/<\/p>/gi, '\n\n')
            .replace(/<[^>]*>/g, '')
            .split(/\n{2,}|\r\n\r\n/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
    };

    // 갤러리 파싱
    const getGalleryImages = (): string[] => {
        if (!article?.gallery) return [];
        try {
            const parsed = JSON.parse(article.gallery);
            if (Array.isArray(parsed)) return parsed.filter(url => typeof url === 'string');
        } catch {
            return article.gallery.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [];
    };

    const getRegionName = (reg: string) => {
        switch (reg) {
            case 'domestic': return '국내 여행';
            case 'asia': return '일본·아시아';
            case 'europe': return '유럽 낭만';
            case 'americas': return '미주·대양주';
            default: return '해외 여행';
        }
    };

    const getCategoryName = (cat: string) => {
        switch (cat) {
            case 'healing': return '🌿 힐링·휴양';
            case 'food': return '🍜 미식·맛집';
            case 'culture': return '🏛️ 문화·역사';
            case 'nature': return '🌊 자연·액티비티';
            case 'city': return '🏙️ 도시·쇼핑';
            case 'camping': return '⛺ 캠핑·차박';
            default: return '✈️ 테마 여행';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Header user={user} onLogout={logout} />
                <EntertainmentSubMenu />
                <div className="max-w-4xl mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin"></div>
                    <p className="text-xs font-bold text-slate-500">여행기를 불러오는 중입니다...</p>
                </div>
                <Footer />
            </div>
        );
    }

    if (!article) {
        return (
            <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
                <Header user={user} onLogout={logout} />
                <EntertainmentSubMenu />
                <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
                    <div className="text-4xl">🏝️</div>
                    <h2 className="text-lg font-black text-slate-800">여행기를 찾을 수 없습니다</h2>
                    <p className="text-xs text-slate-500">존재하지 않거나 비공개 처리된 여행기입니다.</p>
                    <Link
                        to="/entertainment/travel"
                        className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all shadow-xs"
                    >
                        여행 목록으로 돌아가기
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const keyPoints = getThreeKeyPoints();
    const paragraphs = formatParagraphs(article.content);
    const galleryImages = getGalleryImages();

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
            <PageSEO
                title={`${article.title} - VERA 여행 큐레이션`}
                description={article.summary || article.title}
                path={`/entertainment/travel/${article.id}`}
                image={article.thumbnail || undefined}
            />
            <Header user={user} onLogout={logout} />
            
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-6 sm:py-8 w-full space-y-6">
                
                {/* 1. 상단 네비게이션 브레드크럼 */}
                <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                    <Link to="/" className="hover:text-slate-600">홈</Link>
                    <i className="fas fa-chevron-right text-[9px]"></i>
                    <Link to="/entertainment" className="hover:text-slate-600">재미</Link>
                    <i className="fas fa-chevron-right text-[9px]"></i>
                    <Link to="/entertainment/travel" className="hover:text-emerald-600">여행</Link>
                    <i className="fas fa-chevron-right text-[9px]"></i>
                    <span className="text-slate-600 font-extrabold truncate max-w-[180px]">{article.destination}</span>
                </nav>

                {/* 2. 대형 대표 커버 비주얼 */}
                <div className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden shadow-md">
                    <img
                        src={article.thumbnail || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80'}
                        alt={article.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent"></div>
                    
                    {/* 커버 텍스트 오버레이 */}
                    <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[11px] font-black shadow-xs">
                                📍 {article.destination}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black border border-white/30">
                                {getRegionName(article.region)}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-black border border-white/30">
                                {getCategoryName(article.category)}
                            </span>
                        </div>
                        <h1 className="text-xl sm:text-3xl font-black leading-tight drop-shadow-md">
                            {article.title}
                        </h1>
                    </div>
                </div>

                {/* 3. 여행 메타 정보 바 (일정, 시즌, 경비, 작성자) */}
                <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600 font-bold">
                        {article.duration && (
                            <div className="flex items-center gap-1.5">
                                <i className="fas fa-clock text-emerald-600"></i>
                                <span>추천 일정: <strong className="text-slate-900">{article.duration}</strong></span>
                            </div>
                        )}
                        {article.best_season && (
                            <div className="flex items-center gap-1.5">
                                <i className="fas fa-calendar-check text-emerald-600"></i>
                                <span>베스트 시즌: <strong className="text-slate-900">{article.best_season}</strong></span>
                            </div>
                        )}
                        {article.estimated_cost && (
                            <div className="flex items-center gap-1.5">
                                <i className="fas fa-coins text-emerald-600"></i>
                                <span>예상 예산: <strong className="text-slate-900">{article.estimated_cost}</strong></span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>에디터: <strong className="text-slate-600">{article.author || 'RoofAI 큐레이터'}</strong></span>
                        <span>·</span>
                        <span>조회수: {article.view_count.toLocaleString()}</span>
                    </div>
                </div>

                {/* 4. 📌 AI 추천 핵심 포인트 3가지 (Key Highlights) */}
                {keyPoints.length > 0 && (
                    <section className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-5 sm:p-7 border border-emerald-200/90 shadow-xs space-y-3.5">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
                                <i className="fas fa-sparkles"></i>
                            </div>
                            <h2 className="text-sm sm:text-base font-black text-emerald-950">
                                AI가 짚어주는 이 여행지의 3대 매력 포인트
                            </h2>
                        </div>
                        <div className="space-y-2 pt-1">
                            {keyPoints.map((point, index) => (
                                <div key={index} className="flex items-start gap-2.5 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-emerald-100 shadow-2xs">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-black shrink-0 mt-0.5">
                                        {index + 1}
                                    </span>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                                        {point}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. 추가 갤러리 이미지 (존재할 경우) */}
                {galleryImages.length > 0 && (
                    <section className="space-y-3">
                        <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <i className="fas fa-camera text-emerald-600"></i>
                            <span>현장 갤러리</span>
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {galleryImages.map((imgUrl, idx) => (
                                <div key={idx} className="rounded-2xl overflow-hidden aspect-[4/3] shadow-xs">
                                    <img
                                        src={imgUrl}
                                        alt={`여행 사진 ${idx + 1}`}
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 6. 상세 여행 스토리 본문 */}
                <article className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/90 shadow-xs space-y-5">
                    <div className="prose prose-slate max-w-none">
                        {paragraphs.map((para, idx) => (
                            <p key={idx} className="text-sm sm:text-base text-slate-700 leading-loose">
                                {para}
                            </p>
                        ))}
                    </div>

                    {/* 출처 고지 */}
                    {article.source && (
                        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
                            출처: {article.source} {article.source_url && (
                                <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline ml-1">
                                    [원문 바로가기]
                                </a>
                            )}
                        </div>
                    )}
                </article>

                {/* 7. 💡 여행 꿀팁 & 주의사항 (Travel Tips) */}
                {article.travel_tips && (
                    <section className="bg-amber-50/70 rounded-3xl p-5 sm:p-7 border border-amber-200/80 shadow-xs space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                            <i className="fas fa-lightbulb text-amber-600 text-base"></i>
                            <span>여행 꿀팁 & 실전 방문 가이드</span>
                        </div>
                        <div className="text-xs sm:text-sm text-amber-950/80 leading-relaxed whitespace-pre-line pl-1">
                            {article.travel_tips}
                        </div>
                    </section>
                )}

                {/* 8. 상세 위치 안내 (있을 경우) */}
                {article.location_address && (
                    <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                            <i className="fas fa-location-dot text-rose-500 text-sm"></i>
                            <span>위치 안내: <strong className="text-slate-900">{article.location_address}</strong></span>
                        </div>
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(article.location_address || '');
                                alert('주소가 클립보드에 복사되었습니다.');
                            }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all cursor-pointer shrink-0"
                        >
                            주소 복사
                        </button>
                    </div>
                )}

                {/* 9. 좋아요 & 공유 액션 독 */}
                <div className="flex items-center justify-center gap-3 py-4">
                    <button
                        onClick={handleLike}
                        disabled={liked}
                        className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95 ${
                            liked
                                ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                : 'bg-white border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600'
                        }`}
                    >
                        <i className={`fas fa-heart ${liked ? 'text-rose-500' : 'text-slate-400'}`}></i>
                        <span>추천해요 {likeCount}</span>
                    </button>

                    <button
                        onClick={handleShare}
                        className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:text-emerald-600 font-black text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                        <i className="fas fa-share-nodes text-slate-400"></i>
                        <span>{copied ? '링크 복사됨! ✨' : '여행기 공유하기'}</span>
                    </button>
                </div>

                {/* 10. 관련 추천 여행지 (3선) */}
                {related.length > 0 && (
                    <section className="space-y-4 pt-4">
                        <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                            <i className="fas fa-compass text-emerald-600"></i>
                            <span>함께 둘러보기 좋은 {getRegionName(article.region)} 명소</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {related.map(item => (
                                <Link
                                    key={item.id}
                                    to={`/entertainment/travel/${item.id}`}
                                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:border-emerald-300 hover:shadow-sm transition-all group"
                                >
                                    <div className="aspect-[16/10] overflow-hidden">
                                        <img
                                            src={item.thumbnail || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80'}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-3.5 space-y-1">
                                        <span className="text-[10px] font-bold text-emerald-600">📍 {item.destination}</span>
                                        <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-600">
                                            {item.title}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* 11. 애드센스 배너 슬롯 */}
                <div className="pt-6">
                    <BannerSlot slotKey="travel-detail-bottom" label="SPONSORED AD" />
                </div>
            </main>

            <Footer />
        </div>
    );
}
