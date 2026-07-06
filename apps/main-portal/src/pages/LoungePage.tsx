import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
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
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // 1. 활성화 탭 관리 (PC 좌측 메뉴 / 모바일용 탭 전환)
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

    // 4. 피드 목록 상태
    const [points] = useState<number>(() => {
        const saved = localStorage.getItem('vera_points');
        return saved ? parseInt(saved, 10) : 120;
    });
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');

    // 알림 리스트
    const [notifications] = useState([
        { id: '1', type: 'like', user: '@invest_queen', msg: '님이 회원님의 $엔비디아 투자 분석 글에 좋아요를 눌렀습니다.', time: '2분 전' },
        { id: '2', type: 'comment', user: '@toss_developer', msg: '님이 "#사다리타기 커피 내기 결과"에 댓글을 남겼습니다.', time: '15분 전' },
        { id: '3', type: 'mention', user: '@saju_master', msg: '님이 회원님을 띠별 운세 공유 룸에서 멘션했습니다.', time: '1시간 전' }
    ]);

    // 5. 초기 피드 덤프 생성 및 로드
    useEffect(() => {
        const savedPosts = localStorage.getItem('vera_lounge_posts');
        let currentPosts = [];
        if (savedPosts) {
            currentPosts = JSON.parse(savedPosts);
        } else {
            currentPosts = [
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
            localStorage.setItem('vera_lounge_posts', JSON.stringify(currentPosts));
        }

        // 지뢰찾기나 사주 등에서 넘어온 공유 데이터가 있는지 체크
        const pendingShare = localStorage.getItem('vera_lounge_pending_share');
        if (pendingShare) {
            try {
                const shareData = JSON.parse(pendingShare);
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
                
                localStorage.removeItem('vera_lounge_pending_share');
                currentPosts = [newSharePost, ...currentPosts];
                localStorage.setItem('vera_lounge_posts', JSON.stringify(currentPosts));
            } catch (e) {
                console.error('Pending share parse error:', e);
            }
        }
        setPosts(currentPosts);
    }, [persona]);

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
        setActiveTab('home');
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

    // 9. 게시글 삭제 핸들러
    const handleDeletePost = (postId: string) => {
        if (!window.confirm('정말 이 피드를 삭제하시겠습니까?')) return;
        const updated = posts.filter(post => post.id !== postId);
        setPosts(updated);
        localStorage.setItem('vera_lounge_posts', JSON.stringify(updated));
        alert('피드가 성공적으로 삭제되었습니다.');
    };

    // 필터링된 피드
    const filteredPosts = posts.filter(post => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            post.content.toLowerCase().includes(q) ||
            post.author.name.toLowerCase().includes(q) ||
            post.author.handle.toLowerCase().includes(q)
        );
    });

    const handleBackToPortal = () => {
        navigate('/');
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
            <PageSEO
                title="VERA Lounge - 베라 마이크로 커뮤니티"
                description="VERA 메가 포털 회원들의 핫 이슈, 실시간 주식 토론, 사다리타기 미니게임이 글 속에서 바로 실행되는 커뮤니티 피드 공간"
                path="/lounge"
            />

            {/* 헤더 유지 */}
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-6xl mx-auto px-2 sm:px-4 py-8 w-full">
                {/* 3단 레이아웃 분할 그리드 */}
                <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* 1) 좌측 네비게이션 컬럼 */}
                    <aside className="hidden md:flex md:w-[200px] lg:w-[220px] shrink-0 flex-col gap-4">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                            <h3 className="font-extrabold text-sm text-slate-900 mb-3 px-2 flex items-center gap-1.5" onClick={handleBackToPortal}>
                                <i className="fas fa-comments text-violet-500"></i> VERA 라운지
                            </h3>
                            <nav className="flex flex-col gap-1">
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                                        activeTab === 'home'
                                            ? 'bg-violet-50 text-violet-600'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <i className="fas fa-home text-sm"></i> 홈 피드
                                </button>
                                <button
                                    onClick={() => setActiveTab('search')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                                        activeTab === 'search'
                                            ? 'bg-violet-50 text-violet-600'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <i className="fas fa-search text-sm"></i> 검색 / 트렌드
                                </button>
                                <button
                                    onClick={() => setActiveTab('write')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                                        activeTab === 'write'
                                            ? 'bg-violet-50 text-violet-600'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <i className="fas fa-edit text-sm"></i> 글 작성하기
                                </button>
                                <button
                                    onClick={() => setActiveTab('notifications')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                                        activeTab === 'notifications'
                                            ? 'bg-violet-50 text-violet-600'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <i className="fas fa-bell text-sm"></i> 알림 내역
                                </button>
                                <button
                                    onClick={() => setActiveTab('profile')}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-extrabold transition-all text-left ${
                                        activeTab === 'profile'
                                            ? 'bg-violet-50 text-violet-600'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                >
                                    <i className="fas fa-user-circle text-sm"></i> 내 페르소나
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* 2) 중앙 피드 타임라인 */}
                    <section className="flex-1 max-w-[640px] flex flex-col gap-5">
                        
                        {/* 모바일 탭 바 상단 대시보드 탭 (md 미만 뷰 전용) */}
                        <div className="flex md:hidden gap-1 bg-slate-200/70 p-1 rounded-xl mb-1">
                            <button onClick={() => setActiveTab('home')} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeTab==='home'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>홈</button>
                            <button onClick={() => setActiveTab('search')} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeTab==='search'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>검색</button>
                            <button onClick={() => setActiveTab('write')} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeTab==='write'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>글쓰기</button>
                            <button onClick={() => setActiveTab('notifications')} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeTab==='notifications'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>알림</button>
                            <button onClick={() => setActiveTab('profile')} className={`flex-1 py-2 text-xs font-black rounded-lg ${activeTab==='profile'?'bg-white text-slate-800 shadow-sm':'text-slate-500'}`}>프로필</button>
                        </div>

                        {/* [Home 탭 뷰] */}
                        {activeTab === 'home' && (
                            <div className="flex flex-col gap-5">
                                
                                {/* 피드 글쓰기 카드 */}
                                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-lg">
                                            {persona.avatar}
                                        </div>
                                        <div className="flex-1">
                                            <textarea
                                                value={newPostContent}
                                                onChange={(e) => setNewPostContent(e.target.value)}
                                                placeholder="주식종목 $엔비디아, 커피내기 #사다리타기, 뉴스기사요약 @링크 등을 적어서 실시간 위젯 카드를 연동해 보세요!"
                                                rows={3}
                                                className="w-full bg-transparent border-none outline-none resize-none text-slate-800 placeholder-slate-400 font-bold text-sm leading-relaxed"
                                            />
                                            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-2">
                                                <div className="flex gap-2 text-[10px] font-black text-slate-400">
                                                    <span className="text-violet-500">$ 주식위젯</span>
                                                    <span className="text-sky-500"># 유틸위젯</span>
                                                    <span className="text-amber-500">@ 뉴스분석</span>
                                                </div>
                                                <button
                                                    onClick={handleCreatePost}
                                                    className="px-4.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-extrabold text-xs shadow transition-all cursor-pointer"
                                                >
                                                    게시하기
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 피드 목록 */}
                                <div className="flex flex-col gap-4">
                                    {filteredPosts.length > 0 ? (
                                        filteredPosts.map((post) => (
                                            <article 
                                                key={post.id}
                                                className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col gap-3"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-inner">
                                                            {post.author.avatar}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-extrabold text-sm text-slate-850">{post.author.name}</span>
                                                                {post.author.badge && (
                                                                    <span className="bg-rose-50 border border-rose-200 text-[9px] text-rose-500 font-extrabold px-1.5 py-0.5 rounded">
                                                                        {post.author.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{post.author.handle}</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-[10px] text-slate-400 font-semibold">{post.createdAt}</span>
                                                </div>

                                                {/* 피드 본문 */}
                                                <div className="text-sm font-semibold text-slate-700 break-keep border-b border-slate-100 pb-3 leading-relaxed">
                                                    <SmartTagParser text={post.content} />
                                                </div>

                                                {/* 피드 풋 정보바 */}
                                                <div className="flex items-center gap-5 text-xs text-slate-400 font-extrabold">
                                                    <button 
                                                        onClick={() => handleLikeToggle(post.id)}
                                                        className={`flex items-center gap-1.5 transition-colors ${
                                                            post.hasLiked ? 'text-rose-500' : 'hover:text-rose-500'
                                                        }`}
                                                    >
                                                        <i className={`${post.hasLiked ? 'fas' : 'far'} fa-heart`}></i>
                                                        <span>{post.likes}</span>
                                                    </button>
                                                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-violet-600">
                                                        <i className="far fa-comment"></i>
                                                        <span>{post.commentsCount}</span>
                                                    </div>
                                                </div>
                                            </article>
                                        ))
                                    ) : (
                                        <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl border-dashed">
                                            <i className="fas fa-comment-slash text-3xl text-slate-300 mb-3"></i>
                                            <p className="font-bold text-slate-400 text-xs">등록된 피드 글이 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* [Search 탭 뷰] */}
                        {activeTab === 'search' && (
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center gap-2 p-3 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                                    <i className="fas fa-search text-slate-400 ml-1"></i>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="키워드나 해시태그를 검색하세요"
                                        className="flex-1 bg-transparent border-none outline-none font-bold text-sm text-slate-800 placeholder-slate-400"
                                    />
                                </div>

                                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                                    <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3">🔥 실시간 트렌드 주제</h3>
                                    <div className="flex flex-col gap-2.5">
                                        {trends.map((t, idx) => (
                                            <div 
                                                key={idx}
                                                onClick={() => {
                                                    setSearchQuery(t.tag);
                                                    setActiveTab('home');
                                                }}
                                                className="flex justify-between items-center cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-xs font-black text-violet-500">0{idx + 1}</span>
                                                    <div>
                                                        <span className="font-black text-xs text-slate-700 group-hover:text-violet-600 transition-colors">
                                                            {t.type === 'stock' ? `$${t.tag}` : `#${t.tag}`}
                                                        </span>
                                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">인기글 수 {t.count}</p>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] bg-slate-100 text-slate-500 font-extrabold px-1.5 py-0.5 rounded">HOT</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* [Write 탭 뷰] */}
                        {activeTab === 'write' && (
                            <form onSubmit={handleCreatePost} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col gap-4">
                                <h3 className="font-black text-sm text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                                    <i className="fas fa-edit text-violet-500"></i> 새 글 쓰기
                                </h3>
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="글을 작성해 보세요. 주식 종목 감지는 $엔비디아, 사다리타기는 #사다리타기 형태로 입력 가능합니다."
                                    rows={5}
                                    className="w-full border border-slate-200 rounded-xl p-3 outline-none text-slate-800 placeholder-slate-400 font-semibold text-xs leading-relaxed focus:ring-1 focus:ring-violet-500"
                                />
                                <button
                                    type="submit"
                                    className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-extrabold text-xs transition-all cursor-pointer"
                                >
                                    등록하기
                                </button>
                            </form>
                        )}

                        {/* [Notifications 탭 뷰] */}
                        {activeTab === 'notifications' && (
                            <div className="flex flex-col gap-4 p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                                <h3 className="font-black text-sm text-slate-800 border-b border-slate-100 pb-2 mb-1">🔔 실시간 라운지 알림</h3>
                                <div className="flex flex-col gap-3">
                                    {notifications.map((n) => (
                                        <div key={n.id} className="p-3 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-2xl transition-all flex justify-between items-start gap-2">
                                            <div className="flex-1 text-xs">
                                                <span className="font-extrabold text-violet-600 mr-1">{n.user}</span>
                                                <span className="text-slate-600 font-medium leading-relaxed">{n.msg}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-semibold shrink-0">{n.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* [Profile 탭 뷰] */}
                        {activeTab === 'profile' && (
                            <div className="flex flex-col gap-5">
                                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center relative overflow-hidden">
                                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
                                        <span className="text-amber-500 text-xs"><i className="fas fa-coins"></i></span>
                                        <span className="text-xs font-black text-amber-600 font-mono">{points}P</span>
                                    </div>

                                    <div className="w-14 h-14 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center text-3xl mx-auto shadow-sm mb-3">
                                        {persona.avatar}
                                    </div>
                                    <h3 className="text-sm font-black text-slate-850">{persona.name}</h3>
                                    <p className="text-[10px] text-slate-400 font-black font-mono mt-0.5">{persona.handle}</p>
                                    <p className="text-xs text-slate-500 font-medium mt-3 max-w-sm mx-auto leading-relaxed">{persona.bio}</p>

                                    {!isEditingProfile && (
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="mt-4 px-4 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
                                        >
                                            프로필 설정
                                        </button>
                                    )}
                                </div>

                                {isEditingProfile && (
                                    <form onSubmit={handleSaveProfile} className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col gap-4 animate-fade-in">
                                        <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">독립 페르소나 설정</h4>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-400">닉네임</label>
                                            <input
                                                type="text"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-extrabold text-slate-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-400">핸들명</label>
                                            <input
                                                type="text"
                                                value={editHandle}
                                                onChange={(e) => setEditHandle(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-extrabold text-slate-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-slate-400">소개글</label>
                                            <textarea
                                                value={editBio}
                                                onChange={(e) => setEditBio(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 leading-relaxed"
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setIsEditingProfile(false)} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-black">취소</button>
                                            <button type="submit" className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-xs font-black">저장</button>
                                        </div>
                                    </form>
                                )}

                                {/* 마이 스토리 & 피드 아카이브 섹션 */}
                                <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm mt-3 text-left">
                                    <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center gap-1.5">
                                        <i className="fas fa-camera-retro text-violet-500"></i> 📸 마이 스토리 & 피드 아카이브
                                    </h3>
                                    
                                    {/* 인스타그램 스토리 하이라이트 느낌의 원형 칩 배치 */}
                                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-3 mb-4 border-b border-slate-100/60">
                                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer" onClick={() => setActiveTab('write')}>
                                            <div className="w-12 h-12 rounded-full border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-violet-500 hover:text-violet-500 transition-all bg-slate-50">
                                                <i className="fas fa-plus text-xs"></i>
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-extrabold">새 스토리</span>
                                        </div>
                                        {posts.filter(p => p.author.handle === persona.handle).slice(0, 5).map((p, idx) => (
                                            <div key={p.id} className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                                <div className="w-12 h-12 rounded-full border-2 border-violet-400 p-0.5 flex items-center justify-center bg-white shadow-inner animate-pulse-slow">
                                                    <span className="w-full h-full rounded-full bg-violet-50 flex items-center justify-center text-base">
                                                        🔮
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-slate-600 font-extrabold truncate w-12 text-center">스토리 #{idx + 1}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 내가 쓴 피드 리스트 */}
                                    <div className="flex flex-col gap-3">
                                        {posts.filter(p => p.author.handle === persona.handle).length > 0 ? (
                                            posts.filter(p => p.author.handle === persona.handle).map((post) => (
                                                <div key={post.id} className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl relative group">
                                                    <button 
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer text-xs"
                                                        title="피드 삭제"
                                                    >
                                                        <i className="far fa-trash-alt"></i>
                                                    </button>
                                                    <span className="text-[9px] text-slate-400 font-bold block mb-1">{post.createdAt}</span>
                                                    <div className="text-xs font-semibold text-slate-700 break-keep leading-relaxed pr-6">
                                                        <SmartTagParser text={post.content} />
                                                    </div>
                                                    <div className="flex gap-3 text-[10px] text-slate-400 font-bold mt-2 pt-2 border-t border-slate-200/40">
                                                        <span><i className="fas fa-heart text-rose-450 mr-1"></i>{post.likes}</span>
                                                        <span><i className="fas fa-comment text-violet-450 mr-1"></i>{post.commentsCount}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-8 text-center bg-slate-50/50 border border-slate-100 rounded-xl border-dashed">
                                                <i className="far fa-images text-2xl text-slate-300 mb-2"></i>
                                                <p className="font-bold text-slate-400 text-[10px]">아직 작성한 스토리 피드가 없습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* 3) 우측 사이드바 컬럼 */}
                    <aside className="hidden md:flex md:w-[220px] lg:w-[240px] shrink-0 flex-col gap-5">
                        {/* 실시간 핫 트렌드 */}
                        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                            <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 mb-3">🔥 실시간 트렌드</h3>
                            <div className="flex flex-col gap-2.5">
                                {trends.map((t, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => {
                                            setSearchQuery(t.tag);
                                            setActiveTab('home');
                                        }}
                                        className="cursor-pointer hover:bg-slate-50 p-1.5 rounded-lg transition-colors group"
                                    >
                                        <span className="text-xs font-black text-slate-700 group-hover:text-violet-600 transition-colors">
                                            {t.type === 'stock' ? `$${t.tag}` : `#${t.tag}`}
                                        </span>
                                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">언급 횟수 {t.count}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* AI 여론 요약 리포트 */}
                        <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                            <h3 className="text-xs font-black text-violet-600 border-b border-slate-100 pb-2 mb-3 flex items-center gap-1">
                                <i className="fas fa-chart-line"></i> AI 여론 요약
                            </h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-650 mb-1">
                                        <span>$엔비디아</span>
                                        <span className="text-rose-500 font-black">긍정적 (82%)</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: '82%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-650 mb-1">
                                        <span>$비트코인</span>
                                        <span className="text-blue-500 font-black">중립/우려 (68%)</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-550" style={{ width: '32%' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                </div>
            </main>

            {/* 푸터 유지 */}
            <Footer />
        </div>
    );
}
