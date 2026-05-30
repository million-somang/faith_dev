import React, { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import './MiniAppCommunity.css';

export interface PostComment {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
    isAdmin?: boolean;
}

export interface Post {
    id: string;
    authorName: string;
    content: string;
    createdAt: string;
    likes: number;
    likedByMe?: boolean;
    isNotice?: boolean;
    comments: PostComment[];
}

interface MiniAppCommunityProps {
    appId: string;
}

export function MiniAppCommunity({ appId }: MiniAppCommunityProps) {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [isNoticeOnly, setIsNoticeOnly] = useState(false);
    
    // 댓글 입력 상태 (postId -> 입력 문자열)
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    
    // 금지어 상태
    const [forbiddenWords, setForbiddenWords] = useState<string[]>([]);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [tempForbiddenInput, setTempForbiddenInput] = useState('');

    const isAdmin = user?.role === 'admin';

    // 1. 초기 데이터 및 금지어 로드
    useEffect(() => {
        const localPostsKey = `mini_app_posts_${appId}`;
        const localWordsKey = `mini_app_forbidden_words_${appId}`;

        // 1-1. 게시글 데이터 복원
        const storedPosts = localStorage.getItem(localPostsKey);
        if (storedPosts) {
            try {
                setPosts(JSON.parse(storedPosts));
            } catch (e) {
                console.error('Failed to parse stored posts:', e);
            }
        } else {
            // 기본 안내 피드 샘플 탑재
            const initialSample: Post[] = [
                {
                    id: 'sample-1',
                    authorName: '관리자',
                    content: '✨ 안녕하세요! 자유 토론 공간에 오신 것을 환영합니다! \n\n이곳은 누구나 자유롭게 텍스트 분석에 관해 토론하고 이야기를 나누는 프리미엄 광장입니다. 비방이나 욕설 등은 필터링되어 차단되오니 배려 있고 따뜻한 대화를 부탁드립니다. 감사합니다!',
                    createdAt: new Date().toISOString(),
                    likes: 12,
                    likedByMe: false,
                    isNotice: true,
                    comments: [
                        {
                            id: 'comment-1',
                            authorName: '유저1',
                            content: '와 인스타그램 스타일이라 너무 예쁘고 깔끔하네요! 모듈화가 아주 잘 된 것 같습니다.',
                            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                            isAdmin: false
                        }
                    ]
                }
            ];
            setPosts(initialSample);
            localStorage.setItem(localPostsKey, JSON.stringify(initialSample));
        }

        // 1-2. 금지어 데이터 복원
        const storedWords = localStorage.getItem(localWordsKey);
        if (storedWords) {
            try {
                setForbiddenWords(JSON.parse(storedWords));
            } catch (e) {
                console.error('Failed to parse stored forbidden words:', e);
            }
        } else {
            const defaultWords = ['비방', '욕설', '광고', '스팸'];
            setForbiddenWords(defaultWords);
            localStorage.setItem(localWordsKey, JSON.stringify(defaultWords));
        }
    }, [appId]);

    // 2. 데이터 저장 헬퍼
    const savePostsToLocal = (updatedPosts: Post[]) => {
        localStorage.setItem(`mini_app_posts_${appId}`, JSON.stringify(updatedPosts));
        setPosts(updatedPosts);
    };

    // 3. 금지어 실시간 유효성 검사 함수
    const checkForbiddenWords = (text: string): string | null => {
        for (const word of forbiddenWords) {
            if (word.trim() && text.includes(word.trim())) {
                return word.trim();
            }
        }
        return null;
    };

    // 4. 새 게시글 등록 로직
    const handleCreatePost = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        // 금지어 검증
        const caughtWord = checkForbiddenWords(newPostContent);
        if (caughtWord) {
            alert(`⚠️ 등록 불가: 입력하신 텍스트에 금지어 [${caughtWord}]가 포함되어 있어 글을 게시할 수 없습니다.`);
            return;
        }

        const newPost: Post = {
            id: `post-${Date.now()}`,
            authorName: user?.name || '익명 사용자',
            content: newPostContent,
            createdAt: new Date().toISOString(),
            likes: 0,
            likedByMe: false,
            isNotice: isAdmin && isNoticeOnly,
            comments: []
        };

        const updated = [newPost, ...posts];
        savePostsToLocal(updated);
        setNewPostContent('');
        setIsNoticeOnly(false);
    };

    // 5. 게시글 삭제 로직
    const handleDeletePost = (postId: string) => {
        if (!window.confirm('이 게시글을 정말로 삭제하시겠습니까?')) return;
        const updated = posts.filter(p => p.id !== postId);
        savePostsToLocal(updated);
    };

    // 6. 좋아요 증감 토글
    const handleLikeToggle = (postId: string) => {
        const updated = posts.map(p => {
            if (p.id === postId) {
                const likedByMe = !p.likedByMe;
                return {
                    ...p,
                    likedByMe,
                    likes: likedByMe ? p.likes + 1 : p.likes - 1
                };
            }
            return p;
        });
        savePostsToLocal(updated);
    };

    // 7. 댓글 등록 로직
    const handleCreateComment = (e: React.FormEvent, postId: string) => {
        e.preventDefault();
        const commentText = commentInputs[postId] || '';
        if (!commentText.trim()) return;

        // 금지어 검증
        const caughtWord = checkForbiddenWords(commentText);
        if (caughtWord) {
            alert(`⚠️ 등록 불가: 입력하신 댓글에 금지어 [${caughtWord}]가 포함되어 있어 게시할 수 없습니다.`);
            return;
        }

        const newComment: PostComment = {
            id: `comment-${Date.now()}`,
            authorName: user?.name || '익명 사용자',
            content: commentText,
            createdAt: new Date().toISOString(),
            isAdmin: isAdmin
        };

        const updated = posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: [...p.comments, newComment]
                };
            }
            return p;
        });

        savePostsToLocal(updated);
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    };

    // 8. 댓글 삭제 로직
    const handleDeleteComment = (postId: string, commentId: string) => {
        if (!window.confirm('이 댓글을 정말로 삭제하시겠습니까?')) return;
        const updated = posts.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    comments: p.comments.filter(c => c.id !== commentId)
                };
            }
            return p;
        });
        savePostsToLocal(updated);
    };

    // 9. 금지어 리스트 저장 및 동기화
    const handleSaveForbiddenWords = () => {
        const wordsArray = tempForbiddenInput
            .split(',')
            .map(w => w.trim())
            .filter(w => w.length > 0);
        
        localStorage.setItem(`mini_app_forbidden_words_${appId}`, JSON.stringify(wordsArray));
        setForbiddenWords(wordsArray);
        setShowAdminModal(false);
        alert('금지어 설정이 안전하게 업데이트되었습니다!');
    };

    const openAdminSettings = () => {
        setTempForbiddenInput(forbiddenWords.join(', '));
        setShowAdminModal(true);
    };

    // 정렬 규칙
    const sortedPosts = [...posts].sort((a, b) => {
        if (a.isNotice && !b.isNotice) return -1;
        if (!a.isNotice && b.isNotice) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // 경과 시간 계산
    const getElapsedTime = (isoString: string) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return '방금 전';
        if (mins < 60) return `${mins}분 전`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        return `${days}일 전`;
    };


    // 아바타 전용 인라인 스타일 매핑 테이블 (Tailwind 컴파일 누락을 완전히 방어하기 위해 고정 파스텔톤 컬러 정의)
    const getAvatarStyle = (name: string) => {
        const pairs = [
            { bg: '#ffe4e6', text: '#be123c' }, // rose
            { bg: '#fef3c7', text: '#b45309' }, // amber
            { bg: '#d1fae5', text: '#047857' }, // emerald
            { bg: '#ccfbf1', text: '#0f766e' }, // teal
            { bg: '#e0f2fe', text: '#0369a1' }, // sky
            { bg: '#e0e7ff', text: '#4338ca' }, // indigo
            { bg: '#f3e8ff', text: '#6b21a8' }, // purple
            { bg: '#fae8ff', text: '#86198f' }  // fuchsia
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return pairs[Math.abs(hash) % pairs.length];
    };

    return (
        <div className="mac-container">
            {/* 상단 컨트롤 헤더 바 */}
            <div className="mac-header-bar">
                <div className="mac-header-title-box">
                    <h2>
                        <i className="fab fa-instagram"></i>
                        자유 토론 피드
                    </h2>
                    <p>유틸리티 서비스 관련 의견을 자유롭게 나눠주세요.</p>
                </div>
                {isAdmin && (
                    <button onClick={openAdminSettings} className="mac-admin-btn">
                        <i className="fas fa-cog"></i>
                        금지어 관리
                    </button>
                )}
            </div>

            {/* 글 작성 폼 */}
            <form onSubmit={handleCreatePost} className="mac-feed-form">
                <div className="mac-form-row">
                    <div 
                        className="mac-avatar" 
                        style={{ 
                            backgroundColor: getAvatarStyle(user?.name || '익명').bg,
                            color: getAvatarStyle(user?.name || '익명').text
                        }}
                    >
                        {(user?.name || '익명')[0]}
                    </div>
                    <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="이야기하고 싶은 생각이나 제안을 자유롭게 남겨보세요..."
                        rows={3}
                    />
                </div>
                
                <div className="mac-form-footer">
                    <div className="mac-notice-check">
                        {isAdmin && (
                            <label className="mac-notice-checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={isNoticeOnly}
                                    onChange={(e) => setIsNoticeOnly(e.target.checked)}
                                />
                                필독 공지 지정
                            </label>
                        )}
                    </div>
                    <button
                        type="submit"
                        disabled={!newPostContent.trim()}
                        className="mac-submit-btn"
                    >
                        공유하기
                    </button>
                </div>
            </form>

            {/* 피드 리스트 */}
            <div className="mac-feed-list">
                {sortedPosts.length === 0 ? (
                    <div className="mac-empty-feed">
                        <i className="far fa-comments"></i>
                        <p>등록된 게시글이 없습니다. 첫 이야기를 남겨보세요!</p>
                    </div>
                ) : (
                    sortedPosts.map(post => (
                        <article 
                            key={post.id} 
                            className={`mac-feed-card ${post.isNotice ? 'mac-notice-card' : ''}`}
                        >
                            {/* 피드 헤더 */}
                            <div className="mac-card-header">
                                <div className="mac-header-left">
                                    <div 
                                        className="mac-avatar" 
                                        style={{ 
                                            backgroundColor: getAvatarStyle(post.authorName).bg,
                                            color: getAvatarStyle(post.authorName).text
                                        }}
                                    >
                                        {post.authorName[0]}
                                    </div>
                                    <div className="mac-author-info">
                                        <div className="mac-author-name-row">
                                            <span className="mac-author-name">{post.authorName}</span>
                                            {post.isNotice && (
                                                <span className="mac-notice-badge">
                                                    <i className="fas fa-bullhorn"></i>
                                                    공지사항
                                                </span>
                                            )}
                                        </div>
                                        <span className="mac-time-text">{getElapsedTime(post.createdAt)}</span>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <button 
                                        onClick={() => handleDeletePost(post.id)}
                                        className="mac-delete-btn"
                                        title="게시글 삭제"
                                    >
                                        <i className="far fa-trash-alt"></i>
                                    </button>
                                )}
                            </div>

                            {/* 피드 본문 */}
                            <div className="mac-card-body">
                                {post.content}
                            </div>

                            {/* 피드 액션 바 */}
                            <div className="mac-card-actions">
                                <button 
                                    onClick={() => handleLikeToggle(post.id)}
                                    className={`mac-action-btn ${post.likedByMe ? 'mac-liked' : ''}`}
                                >
                                    <i className={`${post.likedByMe ? 'fas' : 'far'} fa-heart`}></i>
                                    <span>좋아요 {post.likes}</span>
                                </button>
                                <div className="mac-comment-indicator">
                                    <i className="far fa-comment"></i>
                                    <span>댓글 {post.comments.length}</span>
                                </div>
                            </div>

                            {/* 댓글 목록 & 입력 창 */}
                            <div className="mac-comments-area">
                                {post.comments.length > 0 && (
                                    <div className="mac-comments-list">
                                        {post.comments.map(comment => (
                                            <div key={comment.id} className="mac-comment-item">
                                                <div className="mac-comment-left">
                                                    <div 
                                                        className="mac-comment-avatar"
                                                        style={{ 
                                                            backgroundColor: getAvatarStyle(comment.authorName).bg,
                                                            color: getAvatarStyle(comment.authorName).text
                                                        }}
                                                    >
                                                        {comment.authorName[0]}
                                                    </div>
                                                    <div className="mac-comment-content-box">
                                                        <div className="mac-comment-meta">
                                                            <span className="mac-comment-author">{comment.authorName}</span>
                                                            {comment.isAdmin && (
                                                                <span className="mac-admin-badge">운영진</span>
                                                            )}
                                                            <span className="mac-comment-time">{getElapsedTime(comment.createdAt)}</span>
                                                        </div>
                                                        <p className="mac-comment-text">{comment.content}</p>
                                                    </div>
                                                </div>
                                                {isAdmin && (
                                                    <button 
                                                        onClick={() => handleDeleteComment(post.id, comment.id)}
                                                        className="mac-comment-delete"
                                                    >
                                                        <i className="fas fa-times"></i>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* 댓글 달기 인풋 */}
                                <form onSubmit={(e) => handleCreateComment(e, post.id)} className="mac-comment-form">
                                    <input
                                        type="text"
                                        placeholder="댓글을 달아주세요..."
                                        value={commentInputs[post.id] || ''}
                                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                        className="mac-comment-input"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!(commentInputs[post.id] || '').trim()}
                                        className="mac-comment-submit"
                                    >
                                        게시
                                    </button>
                                </form>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {/* 관리자 금지어 관리 모달 */}
            {showAdminModal && (
                <div className="mac-modal-overlay">
                    <div className="mac-modal-content">
                        <div className="mac-modal-header">
                            <h3>
                                <i className="fas fa-shield-alt"></i>
                                시스템 금지어 설정
                            </h3>
                            <button 
                                onClick={() => setShowAdminModal(false)}
                                className="mac-modal-close"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <p className="mac-modal-desc">
                            여기에 입력된 단어가 본문이나 댓글에 포함되어 있으면 등록이 자동으로 완벽히 차단됩니다. 각 단어는 쉼표(,)로 구분하여 입력할 수 있습니다.
                        </p>

                        <div className="mac-modal-form">
                            <div>
                                <label className="mac-modal-label">금지어 목록</label>
                                <textarea
                                    value={tempForbiddenInput}
                                    onChange={(e) => setTempForbiddenInput(e.target.value)}
                                    rows={4}
                                    placeholder="예: 욕설, 비방, 광고, 스팸"
                                    className="mac-modal-textarea"
                                />
                            </div>

                            <div className="mac-modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowAdminModal(false)}
                                    className="mac-btn-cancel"
                                >
                                    취소
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveForbiddenWords}
                                    className="mac-btn-save"
                                >
                                    설정 저장
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
