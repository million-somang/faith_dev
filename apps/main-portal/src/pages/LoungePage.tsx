import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { SmartTagParser } from '../components/lounge/SmartTagParser';

export interface Post {
    id: string;
    author: {
        name: string;
        handle: string;
        avatar: string;
        badge?: string;
    };
    content: string;
    createdAt: string;
    likes: number;
    commentsCount: number;
    hasLiked?: boolean;
}

export default function LoungePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // 1. 모바일 탭 바 활성화 탭 관리
    const [activeTab, setActiveTab] = useState<'home' | 'search' | 'write' | 'notifications' | 'profile'>('home');

    // 2. 검색 쿼리 및 트렌드
    const [searchQuery, setSearchQuery] = useState('');
    const [trends] = useState([
        { tag: '엔비디아', count: '12.4K', type: 'stock' },
        { tag: '사다리타기', count: '8.2K', type: 'utility' },
        { tag: '비트코인', count: '7.1K', type: 'stock' },
        { tag: 'HBM반도체', count: '5.9K', type: 'news' },
        { tag: '지뢰찾기1퍼센트', count: '3.4K', type: 'game' }
    ]);

    // 3. 독립 페르소나 (멀티 프로필 핸들)
    const [persona, setPersona] = useState(() => {
        const savedHandle = localStorage.getItem('vera_lounge_handle');
        const savedName = localStorage.getItem('vera_lounge_name');
        return {
            name: savedName || (user?.name ? `${user.name} 라운지` : '베라 프렌즈'),
            handle: savedHandle || (user?.name ? `@${user.name.toLowerCase()}_king` : '@user_1234'),
            avatar: '🦊',
            bio: 'VERA 메가 포털에서 투자의 기회를 찾는 똑똑한 유저입니다. 📈'
        };
    });

    // 프로필 편집 상태
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(persona.name);
    const [editHandle, setEditHandle] = useState(persona.handle);
    const [editBio, setEditBio] = useState(persona.bio);

    // 4. 피드 목록 상태 (로컬 스토리지 바인딩)
    const [points] = useState<number>(() => {
        const saved = localStorage.getItem('vera_points');
        return saved ? parseInt(saved, 10) : 120;
    });
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');

    // 알림 리스트 모킹
    const [notifications] = useState([
        { id: '1', type: 'like', user: '@invest_queen', msg: '님이 회원님의 $엔비디아 투자 분석 글에 좋아요를 눌렀습니다.', time: '2분 전' },
        { id: '2', type: 'comment', user: '@toss_developer', msg: '님이 "#사다리타기 커피 내기 결과"에 댓글을 남겼습니다.', time: '15분 전' },
        { id: '3', type: 'mention', user: '@saju_master', msg: '님이 회원님을 띠별 운세 공유 룸에서 멘션했습니다.', time: '1시간 전' }
    ]);

    // 5. 초기 피드 덤프 생성 및 로드
    useEffect(() => {
        const savedPosts = localStorage.getItem('vera_lounge_posts');
        if (savedPosts) {
            setPosts(JSON.parse(savedPosts));
        } else {
            const initialPosts: Post[] = [
                {
                    id: 'default-1',
                    author: { name: '서학개미 탑티어', handle: '@stock_tsunami', avatar: '🦁', badge: '주식 전문가' },
                    content: '오늘 국장 삼전 탈출하고 서학에 집중하길 잘했네요. $엔비디아 폭발 흐름 오늘 밤 뉴욕 증시도 기대해봅니다! 자세한 내용은 아래 뉴스 요약 참고해보세요 @http://news/rate',
                    createdAt: '10분 전',
                    likes: 42,
                    commentsCount: 8,
                    hasLiked: false
                },
                {
                    id: 'default-2',
                    author: { name: '지뢰찾기 고수', handle: '@mine_pro', avatar: '🐱' },
                    content: '아 지뢰찾기 99개 모드 오늘 120초 컷 찍고 VERA 랭킹 상위 1% 갱신 ㅋㅋㅋ 라운지에 기록 인증 박습니다!! 커피 한 잔 살 사람 구함 #사다리타기 고고',
                    createdAt: '35분 전',
                    likes: 18,
                    commentsCount: 3,
                    hasLiked: false
                },
                {
                    id: 'default-3',
                    author: { name: '비즈니스 마스터', handle: '@ceo_kim', avatar: '🐨', badge: 'B2B 사장' },
                    content: '이번 주 비즈니스 캘린더에서 강한 계약 문서 운이 들어왔다고 하더군요. 마침 오늘 신규 해외 바이어 납품 건 도장 찍었습니다! 역시 VERA 사주는 과학인가 봅니다.',
                    createdAt: '2시간 전',
                    likes: 29,
                    commentsCount: 5,
                    hasLiked: false
                }
            ];
            localStorage.setItem('vera_lounge_posts', JSON.stringify(initialPosts));
            setPosts(initialPosts);
        }

        // 지뢰찾기나 사주 등에서 넘어온 공유 데이터가 있는지 체크 (localStorage 징검다리)
        const pendingShare = localStorage.getItem('vera_lounge_pending_share');
        if (pendingShare) {
            try {
                const shareData = JSON.parse(pendingShare);
                // 공유된 글 피드 상단에 즉시 조립
                const newSharePost: Post = {
                    id: `share-${Date.now()}`,
                    author: {
                        name: persona.name,
                        handle: persona.handle,
                        avatar: persona.avatar
                    },
                    content: shareData.text,
                    createdAt: '방금 전',
                    likes: 0,
                    commentsCount: 0
                };
                
                // 중복 등록 방지를 위해 징검다리 즉시 청소
                localStorage.removeItem('vera_lounge_pending_share');
                
                setPosts(prev => {
                    const updated = [newSharePost, ...prev];
                    localStorage.setItem('vera_lounge_posts', JSON.stringify(updated));
                    return updated;
                });
            } catch (e) {
                console.error('Pending share parse error:', e);
            }
        }
    }, []);

    // 6. 프로필 세이브
    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        const updated = {
            ...persona,
            name: editName,
            handle: editHandle.startsWith('@') ? editHandle : `@${editHandle}`,
            bio: editBio
        };
        setPersona(updated);
        localStorage.setItem('vera_lounge_handle', updated.handle);
        localStorage.setItem('vera_lounge_name', updated.name);
        setIsEditingProfile(false);
        alert('멀티 페르소나 프로필이 성공적으로 변경되었습니다!');
    };

    // 7. 게시글 등록 핸들러
    const handleCreatePost = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newPostContent.trim()) {
            alert('피드 본문을 입력해 주세요.');
            return;
        }

        const newPost: Post = {
            id: `post-${Date.now()}`,
            author: {
                name: persona.name,
                handle: persona.handle,
                avatar: persona.avatar
            },
            content: newPostContent,
            createdAt: '방금 전',
            likes: 0,
            commentsCount: 0
        };

        const updated = [newPost, ...posts];
        setPosts(updated);
        localStorage.setItem('vera_lounge_posts', JSON.stringify(updated));
        setNewPostContent('');
        setActiveTab('home'); // 홈으로 복귀
        alert('새 피드 글이 등록되었습니다! 스마트 태그가 실시간 연동됩니다. 🚀');
    };

    // 8. 좋아요 토글
    const handleLikeToggle = (postId: string) => {
        const updated = posts.map(post => {
            if (post.id === postId) {
                const hasLiked = !post.hasLiked;
                return {
                    ...post,
                    hasLiked,
                    likes: hasLiked ? post.likes + 1 : post.likes - 1
                };
            }
            return post;
        });
        setPosts(updated);
        localStorage.setItem('vera_lounge_posts', JSON.stringify(updated));
    };

    // 9. 포털로 복귀
    const handleBackToPortal = () => {
        navigate('/');
    };

    // 필터링된 피드 (검색어 대응)
    const filteredPosts = posts.filter(post => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            post.content.toLowerCase().includes(q) ||
            post.author.name.toLowerCase().includes(q) ||
            post.author.handle.toLowerCase().includes(q)
        );
    });

    return (
        <div className="min-h-screen bg-[#090b1e] text-[#f8fafc] font-sans antialiased overflow-x-hidden selection:bg-violet-600 selection:text-white">
            <PageSEO
                title="VERA Lounge - 베라 마이크로 커뮤니티"
                description="VERA 메가 포털 회원들의 핫 이슈, 실시간 주식 토론, 사다리타기 미니게임이 글 속에서 바로 실행되는 3단 커뮤니티 피드 공간"
                path="/lounge"
            />

            {/* 오로라 백그라운드 디자인 */}
            <div className="fixed top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-violet-950/20 via-slate-900/0 to-transparent pointer-events-none z-0"></div>

            {/* --- PC/태블릿 3단 레이아웃 그리드 --- */}
            <div className="relative z-10 max-w-6xl mx-auto min-h-screen flex flex-col md:flex-row gap-6 md:px-4">
                
                {/* 1) 좌측 네비게이션 컬럼 (PC 전용) */}
                <aside className="hidden md:flex md:w-[220px] lg:w-[240px] shrink-0 flex-col gap-6 py-6 border-r border-slate-800/80 pr-4">
                    <div className="flex items-center gap-2 cursor-pointer mb-2" onClick={handleBackToPortal}>
                        <span className="text-xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 -webkit-background-clip-text -webkit-text-fill-color:transparent leading-none">
                            VERA LOUNGE
                        </span>
                        <span className="text-[10px] bg-violet-600/30 text-violet-300 font-extrabold px-1.5 py-0.5 rounded border border-violet-500/20">LITE</span>
                    </div>

                    <nav className="flex flex-col gap-2">
                        <button
                            onClick={() => { setActiveTab('home'); setPersona(p => ({ ...p })); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                                activeTab === 'home'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <i className="fas fa-home text-base"></i> 홈 피드
                        </button>
                        <button
                            onClick={() => setActiveTab('search')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                                activeTab === 'search'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <i className="fas fa-search text-base"></i> 검색 / 트렌드
                        </button>
                        <button
                            onClick={() => setActiveTab('write')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                                activeTab === 'write'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <i className="fas fa-edit text-base"></i> 글 작성하기
                        </button>
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                                activeTab === 'notifications'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <i className="fas fa-bell text-base"></i> 알림 내역
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                                activeTab === 'profile'
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <i className="fas fa-user-circle text-base"></i> 내 페르소나
                        </button>
                    </nav>

                    <button
                        onClick={handleBackToPortal}
                        className="mt-auto flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-extrabold text-sm hover:bg-white/10 active:scale-98 transition-all"
                    >
                        <i className="fas fa-arrow-left"></i> VERA 메인 포털 복귀
                    </button>
                </aside>

                {/* 2) 중앙 피드 타임라인 컬럼 (PC/모바일 공용 메인 컨텐츠) */}
                <main className="flex-1 min-h-[calc(100vh-60px)] md:py-6 md:max-w-[620px] flex flex-col gap-5 px-4 md:px-0">
                    
                    {/* 모바일 최상단 전용 커스텀 헤더 */}
                    <div className="flex md:hidden justify-between items-center py-4 border-b border-slate-900">
                        <span 
                            onClick={handleBackToPortal}
                            className="font-black text-base bg-gradient-to-r from-violet-400 to-indigo-400 -webkit-background-clip-text -webkit-text-fill-color:transparent"
                        >
                            VERA LOUNGE
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-violet-300 bg-violet-600/20 border border-violet-500/20 px-2 py-0.5 rounded-full font-black">
                                {persona.name.substring(0, 5)}
                            </span>
                            <button onClick={handleBackToPortal} className="text-slate-400 text-sm hover:text-white">
                                <i className="fas fa-right-from-bracket"></i>
                            </button>
                        </div>
                    </div>

                    {/* [Home 탭 뷰] */}
                    {activeTab === 'home' && (
                        <div className="flex flex-col gap-5">
                            
                            {/* PC 전용 글쓰기 상단 박스 */}
                            <div className="hidden md:block p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-base">
                                        {persona.avatar}
                                    </div>
                                    <div className="flex-1">
                                        <textarea
                                            value={newPostContent}
                                            onChange={(e) => setNewPostContent(e.target.value)}
                                            placeholder="주식정보 $엔비디아, 미팅내기 #사다리타기, 뉴스링크 @http:// 등을 섞어서 글을 써보세요!"
                                            rows={3}
                                            className="w-full bg-transparent border-none outline-none resize-none text-slate-100 placeholder-slate-500 font-bold text-sm leading-relaxed"
                                        />
                                        <div className="flex justify-between items-center border-t border-slate-800/80 pt-3 mt-2">
                                            <div className="flex gap-2 text-xs font-black text-slate-500">
                                                <span className="text-violet-400/80">$ 주식위젯</span>
                                                <span className="text-sky-400/80"># 유틸위젯</span>
                                                <span className="text-amber-400/80">@ 뉴스요약</span>
                                            </div>
                                            <button
                                                onClick={handleCreatePost}
                                                className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                                            >
                                                게시하기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 피드 리스트 */}
                            <div className="flex flex-col gap-4">
                                {filteredPosts.length > 0 ? (
                                    filteredPosts.map((post) => (
                                        <article 
                                            key={post.id}
                                            className="p-5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md flex flex-col gap-3 shadow-lg"
                                        >
                                            {/* 아바타 / 헤더 */}
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-lg shadow-inner">
                                                        {post.author.avatar}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-extrabold text-sm text-slate-100">{post.author.name}</span>
                                                            {post.author.badge && (
                                                                <span className="bg-rose-900/30 border border-rose-700/30 text-[9px] text-rose-300 font-extrabold px-1.5 py-0.5 rounded">
                                                                    {post.author.badge}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-bold font-mono mt-0.5">{post.author.handle}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-semibold">{post.createdAt}</span>
                                            </div>

                                            {/* 파싱된 본문 */}
                                            <div className="text-sm font-semibold text-slate-200 break-keep border-b border-slate-850 pb-3 leading-relaxed">
                                                <SmartTagParser text={post.content} />
                                            </div>

                                            {/* 피드 풋 터치바 (좋아요 / 댓글 수 등) */}
                                            <div className="flex items-center gap-6 text-xs text-slate-500 font-extrabold">
                                                <button 
                                                    onClick={() => handleLikeToggle(post.id)}
                                                    className={`flex items-center gap-1.5 transition-colors ${
                                                        post.hasLiked ? 'text-rose-500' : 'hover:text-rose-400'
                                                    }`}
                                                >
                                                    <i className={`${post.hasLiked ? 'fas' : 'far'} fa-heart`}></i>
                                                    <span>{post.likes}</span>
                                                </button>
                                                <div className="flex items-center gap-1.5 cursor-pointer hover:text-violet-400">
                                                    <i className="far fa-comment"></i>
                                                    <span>{post.commentsCount}</span>
                                                </div>
                                            </div>
                                        </article>
                                    ))
                                ) : (
                                    <div className="py-20 text-center flex flex-col items-center justify-center border border-white/5 bg-white/2 rounded-3xl border-dashed">
                                        <i className="fas fa-comment-slash text-4xl text-slate-600 mb-3 animate-pulse"></i>
                                        <p className="font-bold text-slate-500 text-sm">일치하는 피드 글이 존재하지 않습니다.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* [Search 탭 뷰 (모바일 등 대응)] */}
                    {activeTab === 'search' && (
                        <div className="flex flex-col gap-5">
                            <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                                <i className="fas fa-search text-slate-500 ml-1"></i>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="키워드나 해시태그를 검색하세요"
                                    className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-white placeholder-slate-500"
                                />
                                {searchQuery && (
                                    <button onClick={() => setSearchQuery('')} className="text-xs font-black text-slate-500 hover:text-white mr-1">
                                        초기화
                                    </button>
                                )}
                            </form>

                            {/* 트렌드 박스 */}
                            <div className="p-5 bg-white/5 border border-white/10 rounded-3xl">
                                <h3 className="text-sm font-black text-white border-b border-white/10 pb-2 mb-3">🔥 실시간 트렌드 주제</h3>
                                <div className="flex flex-col gap-3.5">
                                    {trends.map((t, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => {
                                                setSearchQuery(t.tag);
                                                setActiveTab('home');
                                            }}
                                            className="flex justify-between items-center cursor-pointer p-2.5 rounded-xl hover:bg-white/5 transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono text-sm font-black text-violet-400">0{idx + 1}</span>
                                                <div>
                                                    <span className="font-black text-sm text-slate-200 group-hover:text-violet-400 transition-colors">
                                                        {t.type === 'stock' ? `$${t.tag}` : t.type === 'utility' ? `#${t.tag}` : `#${t.tag}`}
                                                    </span>
                                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">실시간 피드 {t.count}회 분석됨</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] bg-slate-800 text-slate-400 font-extrabold px-2 py-0.5 rounded">핫토픽</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* [Write 탭 뷰] */}
                    {activeTab === 'write' && (
                        <div className="flex flex-col gap-4 p-5 bg-white/5 border border-white/10 rounded-3xl">
                            <h3 className="font-black text-base text-white flex items-center gap-2 border-b border-white/10 pb-3">
                                <i className="fas fa-edit text-violet-400"></i> 새 글 쓰기
                            </h3>
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="주식 종목명 감지는 $엔비디아 처럼 $를 붙여주세요. 사다리타기는 #사다리타기 를 기입하시면 됩니다!"
                                rows={6}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none text-slate-100 placeholder-slate-500 font-bold text-sm leading-relaxed focus:ring-2 focus:ring-violet-500"
                            />
                            <div className="flex flex-wrap gap-2 text-xs font-black text-slate-400 py-1">
                                <span onClick={() => setNewPostContent(prev => prev + ' $엔비디아')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer text-violet-300">$엔비디아 추가</span>
                                <span onClick={() => setNewPostContent(prev => prev + ' $삼성전자')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer text-violet-300">$삼성전자 추가</span>
                                <span onClick={() => setNewPostContent(prev => prev + ' #사다리타기')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer text-sky-300">#사다리타기 추가</span>
                                <span onClick={() => setNewPostContent(prev => prev + ' @http://news/samsung')} className="bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded cursor-pointer text-amber-300">@뉴스요약 추가</span>
                            </div>
                            <button
                                onClick={handleCreatePost}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm transition-all mt-2 cursor-pointer"
                            >
                                라운지 타임라인에 등록
                            </button>
                        </div>
                    )}

                    {/* [Notifications 탭 뷰] */}
                    {activeTab === 'notifications' && (
                        <div className="flex flex-col gap-4 p-5 bg-white/5 border border-white/10 rounded-3xl">
                            <h3 className="font-black text-base text-white border-b border-white/10 pb-2 mb-1">🔔 실시간 라운지 알림</h3>
                            <div className="flex flex-col gap-3">
                                {notifications.map((n) => (
                                    <div key={n.id} className="p-3 bg-white/3 border border-white/5 hover:bg-white/5 rounded-2xl transition-all flex justify-between items-start gap-2">
                                        <div className="flex-1 text-xs">
                                            <span className="font-extrabold text-violet-300 mr-1">{n.user}</span>
                                            <span className="text-slate-300 font-medium leading-relaxed">{n.msg}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-500 font-semibold shrink-0">{n.time}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* [Profile 탭 뷰 (내 페르소나)] */}
                    {activeTab === 'profile' && (
                        <div className="flex flex-col gap-5">
                            <div className="p-5 bg-white/5 border border-white/10 rounded-3xl text-center relative overflow-hidden">
                                <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                    <span className="text-amber-400 text-xs"><i className="fas fa-coins"></i></span>
                                    <span className="text-xs font-black text-amber-300 font-mono">{points}P</span>
                                </div>

                                <div className="w-16 h-16 rounded-3xl bg-violet-600/30 border-2 border-violet-500/50 flex items-center justify-center text-4xl mx-auto shadow-lg mb-3">
                                    {persona.avatar}
                                </div>
                                <h3 className="text-base font-black text-white">{persona.name}</h3>
                                <p className="text-xs text-slate-500 font-black font-mono mt-0.5">{persona.handle}</p>
                                <p className="text-xs text-slate-300 font-semibold mt-3 max-w-sm mx-auto leading-relaxed">{persona.bio}</p>

                                {!isEditingProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="mt-5 px-6 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs transition-colors"
                                    >
                                        페르소나 변경하기
                                    </button>
                                )}
                            </div>

                            {/* 프로필 편집 폼 */}
                            {isEditingProfile && (
                                <form onSubmit={handleSaveProfile} className="p-5 bg-white/5 border border-white/10 rounded-3xl flex flex-col gap-4 animate-fade-in">
                                    <h4 className="text-sm font-black text-white border-b border-white/10 pb-2">🦊 독립 페르소나 설정</h4>
                                    
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-400">닉네임</label>
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-extrabold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-400">핸들명 (예: @invest_king)</label>
                                        <input
                                            type="text"
                                            value={editHandle}
                                            onChange={(e) => setEditHandle(e.target.value)}
                                            className="w-full px-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-white font-extrabold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-xs font-bold text-slate-400">라운지 소개글</label>
                                        <textarea
                                            value={editBio}
                                            onChange={(e) => setEditBio(e.target.value)}
                                            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-semibold text-xs leading-relaxed"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs font-black"
                                        >
                                            취소
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black"
                                        >
                                            저장 완료
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    )}

                </main>

                {/* 3) 우측 사이드바 컬럼 (PC 전용 - 실시간 트렌드 및 AI 여론 대시보드 리포트) */}
                <aside className="hidden md:flex md:w-[240px] lg:w-[260px] shrink-0 flex-col gap-6 py-6 border-l border-slate-800/80 pl-4">
                    {/* 실시간 핫 트렌드 */}
                    <div className="p-4.5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                        <h3 className="text-xs font-black text-white border-b border-white/10 pb-2 mb-3">🔥 실시간 트렌드</h3>
                        <div className="flex flex-col gap-3">
                            {trends.map((t, idx) => (
                                <div 
                                    key={idx}
                                    onClick={() => {
                                        setSearchQuery(t.tag);
                                        setActiveTab('home');
                                    }}
                                    className="cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors group"
                                >
                                    <span className="text-xs font-black text-slate-200 group-hover:text-violet-400 transition-colors">
                                        {t.type === 'stock' ? `$${t.tag}` : `#${t.tag}`}
                                    </span>
                                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">실시간 피드 {t.count}개</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* AI 실시간 감성 분석 요약 리포트 */}
                    <div className="p-4.5 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-md">
                        <h3 className="text-xs font-black text-amber-300 border-b border-white/10 pb-2 mb-3 flex items-center gap-1">
                            📊 AI 여론 분석 요약
                        </h3>
                        <div className="space-y-3.5">
                            <div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                    <span>$엔비디아</span>
                                    <span className="text-rose-400 font-black">매우 긍정 (82%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                    <div className="h-full bg-rose-500 rounded-full" style={{ width: '82%' }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-300 mb-1">
                                    <span>$비트코인</span>
                                    <span className="text-blue-400 font-black">부정적 우세 (68%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '32%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* 관리자 업데이트 리포트 */}
                        <div className="border-t border-white/5 pt-3.5 mt-3.5">
                            <span className="text-[10px] text-slate-500 font-bold">이번 주 피드백 분석 리포트:</span>
                            <p className="text-[10px] text-slate-300 font-medium leading-relaxed mt-1 break-keep">
                                "유저들 사이에서 사주 결과 공유 이벤트 및 미니 주식 차트 임베딩 기능에 대한 만족도가 높음. 향후 다크모드 옵션 및 추가 주식 종목 위젯 확장을 우선순위 업데이트로 추천."
                            </p>
                        </div>
                    </div>
                </aside>

            </div>

            {/* --- 모바일 전용 고정 하단 탭 바 (h-[100dvh] 앱 구현용) --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#090b1e]/90 border-t border-slate-850/80 backdrop-blur-lg flex justify-around items-center z-50">
                <button
                    onClick={() => { setActiveTab('home'); setPersona(p => ({ ...p })); }}
                    className={`flex flex-col items-center gap-1 transition-all ${
                        activeTab === 'home' ? 'text-violet-400' : 'text-slate-500'
                    }`}
                >
                    <i className="fas fa-home text-lg"></i>
                    <span className="text-[9px] font-bold">홈 피드</span>
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                        activeTab === 'search' ? 'text-violet-400' : 'text-slate-500'
                    }`}
                >
                    <i className="fas fa-search text-lg"></i>
                    <span className="text-[9px] font-bold">검색</span>
                </button>
                <button
                    onClick={() => setActiveTab('write')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                        activeTab === 'write' ? 'text-violet-400' : 'text-slate-500'
                    }`}
                >
                    <i className="fas fa-circle-plus text-xl"></i>
                    <span className="text-[9px] font-bold">글쓰기</span>
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                        activeTab === 'notifications' ? 'text-violet-400' : 'text-slate-500'
                    }`}
                >
                    <i className="fas fa-bell text-lg"></i>
                    <span className="text-[9px] font-bold">알림</span>
                </button>
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex flex-col items-center gap-1 transition-all ${
                        activeTab === 'profile' ? 'text-violet-400' : 'text-slate-500'
                    }`}
                >
                    <i className="fas fa-user-circle text-lg"></i>
                    <span className="text-[9px] font-bold">프로필</span>
                </button>
            </div>
        </div>
    );
}
