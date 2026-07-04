import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { SmartTagParser } from '../components/lounge/SmartTagParser';
import type { Post } from './LoungePage';

export default function LoungeTopicPage() {
    const { topicName } = useParams<{ topicName: string }>();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [topicLabel, setTopicLabel] = useState('');
    const [isStock, setIsStock] = useState(false);

    // 독립 페르소나
    const [persona] = useState(() => {
        const savedHandle = localStorage.getItem('vera_lounge_handle');
        const savedName = localStorage.getItem('vera_lounge_name');
        return {
            name: savedName || (user?.name ? `${user.name} 라운지` : '베라 프렌즈'),
            handle: savedHandle || (user?.name ? `@${user.name.toLowerCase()}_king` : '@user_1234'),
            avatar: '🦊'
        };
    });

    // 1. 토픽 이름 분석 및 기본 프리필 콘텐츠 설정
    useEffect(() => {
        if (!topicName) return;
        const cleanName = decodeURIComponent(topicName);
        
        // 주식 종목인지 단순 해시태그인지 판별
        const stocks = ['엔비디아', '삼성전자', '테슬라', '애플', '비트코인'];
        const isStockTopic = stocks.some(s => cleanName.includes(s));
        setIsStock(isStockTopic);

        const prefix = isStockTopic ? '$' : '#';
        setTopicLabel(`${prefix}${cleanName}`);

        // 글 작성 기본 템플릿 프리필
        setNewPostContent(` ${prefix}${cleanName} `);

        // 피드 로드
        const savedPosts = localStorage.getItem('vera_lounge_posts');
        if (savedPosts) {
            setPosts(JSON.parse(savedPosts));
        }
    }, [topicName]);

    // 2. 글 등록
    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
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

        const savedPosts = localStorage.getItem('vera_lounge_posts');
        const currentPosts = savedPosts ? JSON.parse(savedPosts) : [];
        const updated = [newPost, ...currentPosts];
        
        localStorage.setItem('vera_lounge_posts', JSON.stringify(updated));
        setPosts(updated);
        setNewPostContent(` ${topicLabel} `);
        alert(`토픽 룸에 피드가 성공적으로 공유되었습니다! 🚀`);
    };

    // 3. 좋아요
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

    // 4. 필터링된 포스트
    const filteredPosts = posts.filter(post => {
        if (!topicLabel) return true;
        return post.content.toLowerCase().includes(topicLabel.toLowerCase());
    });

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
            <PageSEO
                title={`VERA Lounge - ${topicLabel} 토픽 룸`}
                description={`VERA Lounge의 ${topicLabel} 전용 토론 공간입니다. 실시간 피드와 유입 트래픽을 관측해보세요.`}
                path={`/lounge/topic/${topicName}`}
            />

            {/* 헤더 유지 */}
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-xl mx-auto px-4 py-8 w-full">
                <div className="flex flex-col gap-5">
                    
                    {/* 상단 네비게이션 헤더 */}
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <button 
                            onClick={() => navigate('/lounge')}
                            className="flex items-center gap-1.5 text-xs font-black text-slate-550 hover:text-slate-900 transition-colors"
                        >
                            <i className="fas fa-arrow-left"></i> 라운지 홈으로
                        </button>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">VERA TOPIC ROOM</span>
                    </div>

                    {/* 토픽 룸 타이틀 카드 */}
                    <div className="p-5 bg-white border border-slate-200/80 rounded-2xl text-center shadow-sm relative overflow-hidden bg-gradient-to-br from-violet-50/20 to-indigo-50/20">
                        <span className="bg-violet-50 border border-violet-200 text-violet-600 text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                            {isStock ? '📈 주식 토론룸' : '💬 유틸·관심 주제룸'}
                        </span>
                        <h2 className="text-xl font-black text-slate-900 mt-2 mb-1 tracking-tight">{topicLabel}</h2>
                        <p className="text-xs text-slate-500 font-medium">이 방에서는 {topicLabel} 관련 대화 및 실시간 라이브 카드만 집계됩니다.</p>
                    </div>

                    {/* 토픽 룸 전용 글쓰기 */}
                    <form onSubmit={handleCreatePost} className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col gap-3">
                        <textarea
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder={`이 방에 글을 쓰면 자동으로 ${topicLabel} 해시가 생성됩니다!`}
                            rows={3}
                            className="w-full bg-transparent border-none outline-none resize-none text-slate-800 placeholder-slate-400 font-bold text-sm leading-relaxed"
                        />
                        <div className="flex justify-between items-center border-t border-slate-100 pt-2.5 mt-1">
                            <span className="text-[10px] text-slate-450 font-bold">태그 필수 포함됨</span>
                            <button
                                type="submit"
                                className="px-4.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-750 text-white font-extrabold text-xs shadow transition-all cursor-pointer"
                            >
                                등록하기
                            </button>
                        </div>
                    </form>

                    {/* 필터링된 피드 리스트 */}
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
                                                <span className="font-extrabold text-sm text-slate-850">{post.author.name}</span>
                                                <p className="text-[10px] text-slate-400 font-bold font-mono mt-0.5">{post.author.handle}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-semibold">{post.createdAt}</span>
                                    </div>

                                    <div className="text-sm font-semibold text-slate-700 break-keep border-b border-slate-100 pb-3 leading-relaxed">
                                        <SmartTagParser text={post.content} />
                                    </div>

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
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center justify-center bg-white border border-slate-200 rounded-2xl border-dashed">
                                <i className="fas fa-comment-dots text-3xl text-slate-350 mb-3 animate-pulse"></i>
                                <p className="font-bold text-slate-400 text-xs">아직 등록된 글이 없습니다.</p>
                                <p className="text-[10px] text-slate-500 mt-1">이 방에 첫 번째 의견을 올려보세요!</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* 푸터 유지 */}
            <Footer />
        </div>
    );
}
