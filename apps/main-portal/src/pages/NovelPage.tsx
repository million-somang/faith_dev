import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header, Footer } from '@faithportal/ui';
import { PageSEO } from '../components/PageSEO';
import EntertainmentSubMenu from '../components/EntertainmentSubMenu';
import axios from 'axios';

// Lucide-react 대신 FontAwesome 또는 간단 SVG/Lucide 엘리먼트 활용
// main-portal은 이미 FontAwesome 아이콘이 로드되어 있으므로, 폰트어썸 클래스(fas fa-*)를 주로 사용합니다.

interface Novel {
  id: number;
  author_id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  genre: string;
  created_at: string;
}

interface Episode {
  id: number;
  novel_id: number;
  episode_no: number;
  title: string;
  content?: string;
  is_free: number;
  price: number;
  views: number;
  status?: string;
  publish_at?: string;
  created_at: string;
}

export default function NovelPage() {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  // 모드 분기: 'reader' (독자) | 'writer' (작가 스튜디오)
  const [appMode, setAppMode] = useState<'reader' | 'writer'>('reader');
  
  // 독자 상태
  const [readerTab, setReaderTab] = useState<'home' | 'library' | 'history'>('home');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [bestNovels, setBestNovels] = useState<Novel[]>([]);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [bookmarkedNovels, setBookmarkedNovels] = useState<Novel[]>([]);
  
  // 상세 상태
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  
  // 작가 상태
  const [writerNovels, setWriterNovels] = useState<Novel[]>([]);
  const [selectedWriterNovel, setSelectedWriterNovel] = useState<Novel | null>(null);
  const [writerEpisodes, setWriterEpisodes] = useState<Episode[]>([]);
  
  // 작성 폼 상태
  const [showCreateNovel, setShowCreateNovel] = useState(false);
  const [newNovelTitle, setNewNovelTitle] = useState('');
  const [newNovelAuthor, setNewNovelAuthor] = useState('');
  const [newNovelGenre, setNewNovelGenre] = useState('현대판타지');
  const [newNovelDesc, setNewNovelDesc] = useState('');
  const [newNovelCoverFile, setNewNovelCoverFile] = useState<File | null>(null);
  const [newNovelCoverPreview, setNewNovelCoverPreview] = useState('');
  const [isCreatingNovel, setIsCreatingNovel] = useState(false);

  const [showCreateEpisode, setShowCreateEpisode] = useState(false);
  const [newEpTitle, setNewEpTitle] = useState('');
  const [newEpContent, setNewEpContent] = useState('');
  const [newEpIsFree, setNewEpIsFree] = useState(true);
  const [newEpPrice] = useState(100);
  const [newEpStatus, setNewEpStatus] = useState<'published' | 'draft' | 'scheduled'>('published');
  const [newEpPublishAt, setNewEpPublishAt] = useState<string>('');
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);
  
  // 골드 & 지갑 상태
  const [goldBalance, setGoldBalance] = useState<number>(0);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number>(5000);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);

  // 미로그인 가드 (사주 서비스와 일체화)
  useEffect(() => {
    if (!isAuthLoading && !user) {
      alert('웹소설 연재관 서비스는 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.');
      navigate('/login?redirect=/entertainment/novel');
    }
  }, [user, isAuthLoading, navigate]);

  // 필명 자동 설정
  useEffect(() => {
    if (user?.name) {
      setNewNovelAuthor(user.name);
    }
  }, [user]);

  // 1. 골드 잔액 조회
  const fetchGoldBalance = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/novel/gold', { withCredentials: true });
      if (data.success) {
        setGoldBalance(data.balance);
      }
    } catch (e) {
      console.error('[Gold API Error]', e);
    }
  }, [user]);

  // 2. 소설 리스트 획득
  const fetchNovels = useCallback(async () => {
    try {
      const { data } = await axios.get(`/api/novel/list?genre=${selectedGenre}`);
      if (data.success) {
        setNovels(data.list);
      }
    } catch (e) {
      console.error('[Novels Load Error]', e);
    }
  }, [selectedGenre]);

  // 3. 베스트 TOP 3 획득
  const fetchBestNovels = async () => {
    try {
      const { data } = await axios.get('/api/novel/best');
      if (data.success) {
        setBestNovels(data.list);
      }
    } catch (e) {
      console.error('[Best Novels Load Error]', e);
    }
  };

  // 4. 최근 본 목록 및 선호작 획득
  const fetchReaderData = useCallback(async () => {
    if (!user) return;
    try {
      const [historyRes, bookmarkRes] = await Promise.all([
        axios.get('/api/novel/history', { withCredentials: true }),
        axios.get('/api/novel/bookmarks', { withCredentials: true })
      ]);
      if (historyRes.data.success) setRecentHistory(historyRes.data.list);
      if (bookmarkRes.data.success) setBookmarkedNovels(bookmarkRes.data.list);
    } catch (e) {
      console.error('[Reader Data Load Error]', e);
    }
  }, [user]);

  // 5. 작가 내 소설 리스트 획득
  const fetchWriterNovels = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/novel/writer/list', { withCredentials: true });
      if (data.success) {
        setWriterNovels(data.list);
      }
    } catch (e) {
      console.error('[Writer Novels Load Error]', e);
    }
  }, [user]);

  // 필터 혹은 모드에 따라 데이터 로드
  useEffect(() => {
    if (user) {
      fetchNovels();
    }
  }, [selectedGenre, fetchNovels, user]);

  useEffect(() => {
    if (user) {
      fetchGoldBalance();
      fetchReaderData();
      if (appMode === 'writer') {
        fetchWriterNovels();
      }
    }
  }, [user, appMode, fetchGoldBalance, fetchReaderData, fetchWriterNovels]);

  useEffect(() => {
    if (user) {
      fetchBestNovels();
    }
  }, [user]);

  // 6. 소설 상세 조회
  const handleSelectNovel = async (novel: Novel) => {
    try {
      const { data } = await axios.get(`/api/novel/detail?id=${novel.id}`);
      if (data.success) {
        setCurrentNovel(data.novel);
        setEpisodes(data.episodes);
        
        if (user) {
          const statusRes = await axios.get(`/api/novel/bookmark/status?novelId=${novel.id}`, { withCredentials: true });
          if (statusRes.data.success) {
            setIsBookmarked(statusRes.data.isBookmarked);
          }
        }
      }
    } catch (e) {
      console.error('[Novel Detail Load Error]', e);
    }
  };

  // 7. 선호작 토글
  const handleToggleBookmark = async () => {
    if (!user || !currentNovel) return;
    try {
      const { data } = await axios.post('/api/novel/bookmark', { novelId: currentNovel.id }, { withCredentials: true });
      if (data.success) {
        setIsBookmarked(data.isBookmarked);
        fetchReaderData();
      }
    } catch (e) {
      console.error('[Bookmark Toggle Error]', e);
    }
  };

  // 8. 팝업 리더 오픈 (독서 시작)
  const handleSelectEpisode = (episodeNo: number) => {
    if (!currentNovel) return;
    const width = 460;
    const height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    
    // 에피소드 감상용 팝업 리더 오픈
    window.open(
      `/app/novel/?novelId=${currentNovel.id}&episodeNo=${episodeNo}`,
      `novel-reader-${currentNovel.id}`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,location=no`
    );

    // 팝업이 닫힐 때 혹은 주기적으로 골드 잔액 동기화를 위해 포커스 획득 시 갱신
    const checkFocus = () => {
      fetchGoldBalance();
      fetchReaderData();
      window.removeEventListener('focus', checkFocus);
    };
    window.addEventListener('focus', checkFocus);
  };

  // 9. 작가용 - 내 소설 선택
  const handleSelectWriterNovel = async (novel: Novel) => {
    try {
      const { data } = await axios.get(`/api/novel/detail?id=${novel.id}`);
      if (data.success) {
        setSelectedWriterNovel(data.novel);
        setWriterEpisodes(data.episodes);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 10. 작가용 - 표지 파일 프리뷰
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewNovelCoverFile(file);
      const url = URL.createObjectURL(file);
      setNewNovelCoverPreview(url);
    }
  };

  // 11. 작가용 - 새 소설 작품 등록
  const handleCreateNovelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNovelTitle || !newNovelAuthor || !newNovelGenre) {
      alert('필수 항목을 모두 기입해 주세요.');
      return;
    }

    setIsCreatingNovel(true);
    try {
      let finalCoverUrl = '';

      if (newNovelCoverFile) {
        const formData = new FormData();
        formData.append('image', newNovelCoverFile);

        const uploadRes = await axios.post('/api/novel/upload-cover', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true
        });
        if (uploadRes.data.success) {
          finalCoverUrl = uploadRes.data.cover_url;
        }
      }

      const res = await axios.post('/api/novel/create', {
        title: newNovelTitle,
        author: newNovelAuthor,
        description: newNovelDesc,
        coverUrl: finalCoverUrl,
        genre: newNovelGenre
      }, { withCredentials: true });

      if (res.data.success) {
        alert('🎉 소설 작품이 성공적으로 생성되었습니다!');
        setShowCreateNovel(false);
        setNewNovelTitle('');
        setNewNovelDesc('');
        setNewNovelCoverFile(null);
        setNewNovelCoverPreview('');
        fetchWriterNovels();
      }
    } catch (err: any) {
      console.error(err);
      alert('작품 등록 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingNovel(false);
    }
  };

  // 12. 작가용 - 새 회차 에피소드 등록
  const handleCreateEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWriterNovel || !newEpTitle || !newEpContent) {
      alert('회차 제목과 본문 내용을 작성해 주세요.');
      return;
    }

    setIsCreatingEpisode(true);
    try {
      const res = await axios.post('/api/novel/episode/create', {
        novelId: selectedWriterNovel.id,
        title: newEpTitle,
        content: newEpContent,
        isFree: newEpIsFree,
        price: newEpIsFree ? 0 : newEpPrice,
        status: newEpStatus,
        publishAt: newEpPublishAt
      }, { withCredentials: true });

      if (res.data.success) {
        alert(`🎉 ${res.data.episodeNo}화 에피소드가 등록 처리되었습니다!`);
        setShowCreateEpisode(false);
        setNewEpTitle('');
        setNewEpContent('');
        setNewEpIsFree(true);
        setNewEpStatus('published');
        setNewEpPublishAt('');
        handleSelectWriterNovel(selectedWriterNovel);
      }
    } catch (err: any) {
      console.error(err);
      alert('회차 등록 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingEpisode(false);
    }
  };

  // 13. Mock 골드 충전
  const handleChargeGold = async () => {
    setIsCharging(true);
    setChargeSuccess(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const { data } = await axios.post('/api/novel/charge', { amount: chargeAmount }, { withCredentials: true });
      if (data.success) {
        setGoldBalance(data.balance);
        setChargeSuccess(true);
        setTimeout(() => {
          setShowChargeModal(false);
          setChargeSuccess(false);
        }, 1000);
      }
    } catch (e) {
      console.error(e);
      alert('충전 중 오류가 발생했습니다.');
    } finally {
      setIsCharging(false);
    }
  };

  // 깨진 엑스박스 이미지 원천 방지용 표지 렌더러
  const renderCover = (url: string, sizeClass: string = "w-14 h-20") => {
    if (!url) {
      return (
        <div className={`${sizeClass} rounded-2xl bg-slate-100 border border-slate-200/80 flex flex-col items-center justify-center shrink-0 text-slate-400`}>
          <i className="fas fa-book-open text-slate-350 text-xl mb-1"></i>
          <span className="text-xs font-bold">표지 미등록</span>
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/80 shadow-sm`}>
        <img 
          src={url} 
          alt="" 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <i class="fas fa-book text-slate-350 text-lg mb-1"></i>
                  <span style="font-size:7px; font-weight:bold;">표지 오류</span>
                </div>
              `;
            }
          }}
        />
      </div>
    );
  };

  // 로딩바
  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <PageSEO
        title="베라 웹소설 연재관 - 내 글쓰기 및 소설 탐색"
        description="VERA 웹소설 연재관에서 최신 웹소설(현대판타지, 무협, 로맨스)을 탐색하거나 작가 스튜디오에서 직접 소설 작품을 무료/유료 회차로 기획하고 로컬 표지와 함께 연재해 보세요."
        path="/entertainment/novel"
      />
      
      {/* A. 포털 고유 GNB 헤더 탑재 (디자인 깨짐 원천 방지) */}
      <Header user={user} onLogout={logout} />
      
      {/* B. 포털 재미 하위 서브 탭 메뉴 탑재 (디자인 일체화) */}
      <EntertainmentSubMenu />
      
      {/* C. 소설 전용 서브 타이틀 영역 */}
      <div className="bg-white border-b border-slate-200/60 shadow-sm w-full py-5">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <i className="fas fa-book-open text-lg"></i>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-none">베라 웹소설 연재관</h2>
              <span className="text-xs sm:text-sm text-slate-500 font-black block mt-1 tracking-wider">VERA NOVEL STAGE</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            {/* 독자/작가 뷰어 모드 토글 */}
            <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setAppMode('reader');
                  setCurrentNovel(null);
                }}
                className={`px-5 py-3 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer ${
                  appMode === 'reader'
                    ? 'bg-white text-violet-600 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                독자 연재관
              </button>
              <button
                onClick={() => {
                  setAppMode('writer');
                  setSelectedWriterNovel(null);
                }}
                className={`px-5 py-3 rounded-lg text-sm sm:text-base font-black transition-all cursor-pointer ${
                  appMode === 'writer'
                    ? 'bg-white text-violet-600 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                작가 스튜디오
              </button>
            </div>

            {/* 골드 지갑 잔액 표시 */}
            <button 
              onClick={() => setShowChargeModal(true)}
              className="flex items-center gap-2 px-4.5 py-3 rounded-xl bg-violet-50 hover:bg-violet-100 transition-colors border border-violet-100 cursor-pointer shadow-sm"
              aria-label="골드 충전소 열기"
            >
              <i className="fas fa-coins text-violet-600 animate-pulse text-sm"></i>
              <span className="text-sm sm:text-base font-black text-violet-700 font-mono">
                {goldBalance.toLocaleString()} G
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* D. 메인 콘텐츠 가로폭 정렬 */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full flex flex-col">
        <div className="w-full flex-1 flex flex-col">
          
          {/* ========================================================= */}
          {/* 1. 독자 연재관 모드                                       */}
          {/* ========================================================= */}
          {appMode === 'reader' && (
            <>
              {currentNovel ? (
                // 소설 상세 화면
                <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm animate-slide-up">
                  <button 
                    onClick={() => setCurrentNovel(null)}
                    className="self-start px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm sm:text-base font-black text-slate-650 hover:text-slate-855 flex items-center gap-1.5 mb-5 cursor-pointer border border-slate-200 transition-all active:scale-95 animate-fade-in"
                  >
                    <i className="fas fa-chevron-left"></i> 전체 작품보기
                  </button>

                  <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex gap-4 relative overflow-hidden">
                    {renderCover(currentNovel.cover_url, "w-28 h-36")}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded bg-violet-50 text-violet-600 border border-violet-105">
                            {currentNovel.genre}
                          </span>
                          <button 
                            onClick={handleToggleBookmark}
                            className="p-2.5 rounded-xl bg-white border border-slate-200 text-rose-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            aria-label="선호작 북마크 토글"
                          >
                            <i className={`${isBookmarked ? 'fas text-rose-500' : 'far text-slate-400'} fa-heart text-sm`}></i>
                          </button>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black text-slate-850 mt-3 leading-tight">
                          {currentNovel.title}
                        </h3>
                        <span className="text-base sm:text-lg text-slate-600 font-extrabold block mt-2">
                          작가: {currentNovel.author}
                        </span>
                      </div>
                      <p className="text-base sm:text-lg text-slate-600 leading-relaxed line-clamp-3 mt-3 font-normal">
                        {currentNovel.description}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-lg sm:text-xl font-black text-slate-800 mt-7 mb-4 flex items-center gap-2">
                    <i className="fas fa-list text-violet-500"></i>
                    전체 에피소드 ({episodes.length}화)
                  </h4>

                  {/* 회차 리스트 */}
                  <div className="flex flex-col gap-2.5">
                    {episodes.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => handleSelectEpisode(ep.episode_no)}
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer shadow-inner"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-base sm:text-xl font-extrabold text-slate-850 truncate max-w-[340px]">
                            {ep.title}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-500 font-medium font-mono">
                            조회수: {ep.views.toLocaleString()} • 등록일: {new Date(ep.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {ep.is_free === 1 ? (
                            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                              무료
                            </span>
                          ) : (
                            <span className="text-xs sm:text-sm font-black px-3 py-1 rounded bg-violet-50 text-violet-600 border border-violet-100 flex items-center gap-1">
                              <i className="fas fa-lock text-xs text-violet-500"></i> {ep.price || 100}G
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {episodes.length === 0 && (
                      <p className="text-base sm:text-lg text-slate-400 text-center py-10">등록된 에피소가 아직 없습니다.</p>
                    )}
                  </div>
                </div>
              ) : (
                // 독자 메인 홈 탐색
                <div className="flex flex-col gap-6">
                  {/* 독자 내부 탭 버튼 */}
                  <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setReaderTab('home')}
                      className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        readerTab === 'home' 
                          ? 'bg-violet-50 text-violet-600 border border-violet-100 font-black shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <i className="fas fa-compass text-sm"></i> 소설 탐색
                    </button>
                    <button 
                      onClick={() => setReaderTab('library')}
                      className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        readerTab === 'library' 
                          ? 'bg-violet-50 text-violet-600 border border-violet-100 font-black shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <i className="fas fa-bookmark text-sm"></i> 선호보관함
                    </button>
                    <button 
                      onClick={() => setReaderTab('history')}
                      className={`flex-1 py-3 rounded-xl text-sm sm:text-base font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        readerTab === 'history' 
                          ? 'bg-violet-50 text-violet-600 border border-violet-100 font-black shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <i className="fas fa-history text-sm"></i> 최근 읽은 목록
                    </button>
                  </div>

                  {/* ─── A. 소설 탐색 탭 ─── */}
                  {readerTab === 'home' && (
                    <>
                      {/* 보던 소설 이어서 읽기 퀵카드 */}
                      {recentHistory.length > 0 && (
                        <div className="flex flex-col gap-3 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                          <h3 className="global-section-title text-base sm:text-xl font-black text-slate-800 flex items-center gap-2">
                            <i className="fas fa-history text-violet-500"></i>
                            보던 소설 이어서 읽기
                          </h3>
                          <div 
                            onClick={() => {
                              handleSelectNovel(recentHistory[0]);
                              setTimeout(() => {
                                handleSelectEpisode(recentHistory[0].last_episode_no);
                              }, 300);
                            }}
                            className="bg-slate-50 border border-slate-100 p-4.5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-violet-300 transition-all shadow-sm group"
                          >
                            <div className="flex items-center gap-4">
                              {renderCover(recentHistory[0].cover_url, "w-14 h-20")}
                              <div className="flex flex-col gap-1.5">
                                <span className="text-base sm:text-lg font-black text-slate-850 group-hover:text-violet-600 transition-colors">
                                  {recentHistory[0].title}
                                </span>
                                <span className="text-sm sm:text-base text-violet-600 font-black">
                                  최근 {recentHistory[0].last_episode_no}화 리딩 중
                                </span>
                              </div>
                            </div>
                            <span className="text-sm sm:text-base font-black px-5 py-3 rounded-xl bg-violet-600 text-white hover:bg-violet-750 transition-all shadow-md">
                              이어읽기
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 실시간 베스트 TOP 3 */}
                      {bestNovels.length > 0 && (
                        <div className="flex flex-col gap-3.5 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                          <h3 className="global-section-title text-base sm:text-xl font-black text-slate-800 flex items-center gap-2">
                            <i className="fas fa-award text-amber-500"></i>
                            실시간 인기 베스트 TOP 3
                          </h3>
                          
                          <div className="flex flex-col gap-3">
                            {bestNovels.map((novel, index) => (
                              <div
                                key={novel.id}
                                onClick={() => handleSelectNovel(novel)}
                                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-violet-200 transition-all cursor-pointer shadow-sm"
                              >
                                <div className="flex items-center gap-4">
                                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-sm font-black text-white ${
                                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  {renderCover(novel.cover_url, "w-16 h-22")}
                                  <div className="flex flex-col gap-1.5">
                                    <span className="text-base sm:text-lg font-black text-slate-800 truncate max-w-[320px]">
                                      {novel.title}
                                    </span>
                                    <span className="text-sm sm:text-base text-slate-500 font-semibold">
                                      작가: {novel.author} • {novel.genre}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs sm:text-sm font-bold text-slate-400 block">조회수</span>
                                  <span className="text-base sm:text-lg font-black text-violet-600 font-mono">
                                    {(novel as any).total_views || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 소설 연재 전체 리스트 */}
                      <div className="flex flex-col gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h3 className="global-section-title text-lg sm:text-xl font-black text-slate-800">소설 연재 목록</h3>
                          
                          <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-sm sm:text-base font-black text-violet-650 rounded-xl px-3 py-2 shadow-sm focus:outline-none"
                          >
                            <option value="all">전체 장르</option>
                            <option value="현대판타지">현대판타지</option>
                            <option value="판타지">판타지</option>
                            <option value="무협">무협</option>
                            <option value="로맨스">로맨스</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                          {novels.map((novel) => (
                            <div 
                              key={novel.id}
                              onClick={() => handleSelectNovel(novel)}
                              className="flex gap-5 p-5 rounded-2xl bg-slate-50/40 border border-slate-200/50 hover:border-violet-100 hover:bg-slate-55 transition-all cursor-pointer group"
                            >
                              {renderCover(novel.cover_url, "w-20 h-28")}
                              <div className="flex-1 flex flex-col justify-between py-1">
                                <div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs sm:text-sm font-black px-2.5 py-1 rounded bg-violet-50 text-violet-650 border border-violet-100">
                                      {novel.genre}
                                    </span>
                                    <span className="text-sm sm:text-base text-slate-600 font-extrabold">작가: {novel.author}</span>
                                  </div>
                                  <h4 className="global-card-title text-lg sm:text-xl font-black text-slate-850 group-hover:text-violet-600 transition-colors mt-2.5 leading-tight">
                                    {novel.title}
                                  </h4>
                                </div>
                                <p className="global-card-desc text-base sm:text-lg text-slate-600 line-clamp-2 leading-relaxed mt-2">
                                  {novel.description}
                                </p>
                              </div>
                            </div>
                          ))}
                          {novels.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                              <i className="fas fa-book-open text-slate-200 text-3xl mb-3"></i>
                              <p className="text-base font-black text-slate-800">현재 연재 중인 소설이 한 건도 없습니다.</p>
                              <p className="text-sm text-slate-400 mt-1 max-w-[280px]">
                                상단의 [작가 스튜디오] 탭을 터치해 첫 소설을 직접 발굴하고 1호 작가가 되어보세요! ✍️
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── B. 선호보관함 탭 ─── */}
                  {readerTab === 'library' && (
                    <div className="flex flex-col gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                      <h3 className="global-section-title text-base sm:text-xl font-black text-slate-800 flex items-center gap-2">
                        <i className="fas fa-bookmark text-rose-500"></i>
                        선호보관함 목록 ({bookmarkedNovels.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-4">
                        {bookmarkedNovels.map((novel) => (
                          <div 
                            key={novel.id}
                            onClick={() => handleSelectNovel(novel)}
                            className="flex gap-5 p-5 rounded-2xl bg-slate-50/40 border border-slate-200/50 hover:bg-slate-50 transition-all cursor-pointer group"
                          >
                            {renderCover(novel.cover_url, "w-20 h-28")}
                            <div className="flex-1 flex flex-col justify-center gap-1.5">
                              <span className="text-xs sm:text-sm font-black px-2.5 py-1 rounded bg-violet-50 text-violet-650 border border-violet-100 self-start">
                                {novel.genre}
                              </span>
                              <h4 className="global-card-title text-lg sm:text-xl font-black text-slate-850 mt-1.5 group-hover:text-violet-600 transition-colors">
                                {novel.title}
                              </h4>
                              <span className="text-sm sm:text-base text-slate-600 font-extrabold block">작가: {novel.author}</span>
                            </div>
                          </div>
                        ))}
                        {bookmarkedNovels.length === 0 && (
                          <p className="text-base text-slate-500 text-center py-12">선호하는 보관함 목록이 비어있습니다. 소설 상세 페이지에서 하트를 추가해 보세요.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─── C. 최근 읽은 목록 탭 ─── */}
                  {readerTab === 'history' && (
                    <div className="flex flex-col gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
                      <h3 className="global-section-title text-base sm:text-xl font-black text-slate-800 flex items-center gap-2">
                        <i className="fas fa-history text-violet-500"></i>
                        최근 읽은 에피소드 이력
                      </h3>

                      <div className="flex flex-col gap-3">
                        {recentHistory.map((h) => (
                          <div
                            key={h.id}
                            onClick={() => {
                              handleSelectNovel(h);
                              setTimeout(() => {
                                handleSelectEpisode(h.last_episode_no);
                              }, 300);
                            }}
                            className="p-5 rounded-2xl bg-slate-50/40 border border-slate-200/50 hover:bg-slate-55 transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-5">
                              {renderCover(h.cover_url, "w-20 h-28")}
                              <div className="flex flex-col gap-2">
                                <span className="global-card-title text-lg sm:text-xl font-black text-slate-850 group-hover:text-violet-600 transition-colors">
                                  {h.title}
                                </span>
                                <span className="text-sm sm:text-base text-violet-650 font-black">
                                  최종 {h.last_episode_no}화 감상함
                                </span>
                              </div>
                            </div>
                            <span className="text-sm text-slate-500 font-extrabold font-mono">
                              {new Date(h.read_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {recentHistory.length === 0 && (
                          <p className="text-base text-slate-500 text-center py-12">소설 감상 이력이 없습니다.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ========================================================= */}
          {/* 2. 작가 스튜디오 모드                                      */}
          {/* ========================================================= */}
          {appMode === 'writer' && (
            <div className="flex flex-col gap-5 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm animate-slide-up">
              {selectedWriterNovel ? (
                // 소설 관리 집필 목록
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setSelectedWriterNovel(null)}
                    className="self-start px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-600 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer border border-slate-200 transition-all"
                  >
                    <i className="fas fa-chevron-left"></i> 내 소설 목록
                  </button>

                  <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl flex gap-3.5 shadow-inner">
                    {renderCover(selectedWriterNovel.cover_url, "w-16 h-22")}
                    <div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">
                        {selectedWriterNovel.genre}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1 leading-tight">{selectedWriterNovel.title}</h3>
                      <span className="text-xs sm:text-sm text-slate-500 font-extrabold mt-0.5 block">작가 필명: {selectedWriterNovel.author}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mt-2">
                    <h4 className="text-sm sm:text-base font-black text-slate-700">집필 완료 목록 ({writerEpisodes.length}화)</h4>
                    <button
                      onClick={() => setShowCreateEpisode(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-black flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <i className="fas fa-pen-nib"></i> 새 회차 발행
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {writerEpisodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm sm:text-base font-bold text-slate-800">{ep.title}</span>
                            {ep.status === 'draft' ? (
                              <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                                임시저장
                              </span>
                            ) : ep.status === 'scheduled' ? (
                              <span className="text-xs font-black px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                                예약발행 ({new Date(ep.publish_at || '').toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })})
                              </span>
                            ) : (
                              <span className="text-xs font-black px-2 py-0.5 rounded bg-violet-50 text-violet-650 border border-violet-100">
                                공개완료
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 font-mono mt-0.5 block">
                            조회수: {ep.views.toLocaleString()} • 등록일: {new Date(ep.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {ep.is_free === 1 ? (
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                              무료 연재
                            </span>
                          ) : (
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-violet-50 text-violet-650 border border-violet-100">
                              유료 ({ep.price} G)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {writerEpisodes.length === 0 && (
                      <p className="text-xs sm:text-sm text-slate-400 text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        발행된 에피소드가 존재하지 않습니다. 우측 [새 회차 발행]을 클릭해 주세요!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // 소설 리스트
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-sm sm:text-base font-black text-slate-750">내가 등록한 작품 ({writerNovels.length})</h3>
                    <button
                      onClick={() => setShowCreateNovel(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-750 text-white text-xs font-black flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      <i className="fas fa-plus"></i> 새 소설 생성
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {writerNovels.map((novel) => (
                      <div
                        key={novel.id}
                        onClick={() => handleSelectWriterNovel(novel)}
                        className="p-3 bg-slate-50 border border-slate-100 hover:border-violet-250 cursor-pointer rounded-2xl flex gap-3.5 transition-all shadow-sm"
                      >
                        {renderCover(novel.cover_url, "w-16 h-22")}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-600 border border-violet-100">
                              {novel.genre}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-500 font-extrabold">필명: {novel.author}</span>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-slate-800 mt-1.5 leading-tight">{novel.title}</h4>
                        </div>
                      </div>
                    ))}
                    {writerNovels.length === 0 && (
                      <p className="text-xs sm:text-sm text-slate-500 text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        서재에 생성한 웹소설이 없습니다. [새 소설 생성] 단추를 눌러 첫 작품 기획을 작성하세요!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* E. 포털 고유 Footer 탑재 (디자인 완결) */}
      <Footer />

      {/* ========================================================= */}
      {/* Modals & Interfaces                                       */}
      {/* ========================================================= */}

      {/* 1. 작가용 - 새 소설 생성 모달 */}
      {showCreateNovel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-slate-800 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <i className="fas fa-book-open text-violet-500"></i>
                새 소설 연재 등록
              </h3>
              <button onClick={() => setShowCreateNovel(false)} className="p-1 rounded hover:bg-slate-100" aria-label="모달 닫기">
                <i className="fas fa-times text-slate-400"></i>
              </button>
            </div>

            <form onSubmit={handleCreateNovelSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">소설 작품 제목 *</label>
                <input
                  type="text"
                  required
                  value={newNovelTitle}
                  onChange={(e) => setNewNovelTitle(e.target.value)}
                  placeholder="예: 현대 의학 쟁패의 침구사"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none bg-slate-50 text-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1">작가 필명 *</label>
                  <input
                    type="text"
                    required
                    value={newNovelAuthor}
                    onChange={(e) => setNewNovelAuthor(e.target.value)}
                    placeholder="작가 필명 기입"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none bg-slate-50 text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 block mb-1">장르 선택 *</label>
                  <select
                    value={newNovelGenre}
                    onChange={(e) => setNewNovelGenre(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none bg-slate-50 text-slate-850"
                  >
                    <option value="현대판타지">현대판타지</option>
                    <option value="판타지">판타지</option>
                    <option value="무협">무협</option>
                    <option value="로맨스">로맨스</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">작품 줄거리 요약</label>
                <textarea
                  rows={3}
                  value={newNovelDesc}
                  onChange={(e) => setNewNovelDesc(e.target.value)}
                  placeholder="독자들의 흥미를 자극할 매혹적인 시놉시스를 기록하세요."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none bg-slate-50 text-slate-850 resize-none"
                />
              </div>

              {/* 로컬 표지 이미지 선택 */}
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1.5">타이틀 표지 등록 (로컬 업로드) *</label>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-20 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {newNovelCoverPreview ? (
                      <img src={newNovelCoverPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <i className="fas fa-upload text-slate-400"></i>
                    )}
                  </div>
                  <label className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 hover:border-violet-400 hover:bg-violet-50/20 cursor-pointer bg-slate-50 text-xs text-slate-500 transition-colors">
                    <i className="fas fa-cloud-upload-alt mb-1 text-slate-400 text-sm"></i>
                    로컬 이미지 파일 선택
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverFileChange} 
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingNovel}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 mt-4 cursor-pointer shadow-md"
              >
                {isCreatingNovel ? '작품 연재 처리 중...' : '작품 최종 등록 및 서재 열기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. 작가용 - 새 에피소드 회차 집필 등록 모달 */}
      {showCreateEpisode && selectedWriterNovel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[95vh] text-slate-800 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
                <i className="fas fa-pen-nib text-violet-500"></i>
                새 회차 집필
              </h3>
              <button onClick={() => setShowCreateEpisode(false)} className="p-1 rounded hover:bg-slate-100" aria-label="모달 닫기">
                <i className="fas fa-times text-slate-450"></i>
              </button>
            </div>

            <form onSubmit={handleCreateEpisodeSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <div>
                <label className="text-xs font-black text-slate-500 block mb-1">회차 에피소드 제목 *</label>
                <input
                  type="text"
                  required
                  value={newEpTitle}
                  onChange={(e) => setNewEpTitle(e.target.value)}
                  placeholder="예: 5화: 무림맹주의 숨겨진 운명선"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none bg-slate-50 text-slate-850"
                />
              </div>

              {/* 무료 / 유료 지정 슬라이드 스위치 */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between shadow-inner">
                <div>
                  <label className="text-xs font-black text-slate-800 block">유료화 연재 설정</label>
                  <span className="text-xs text-slate-400 font-bold block mt-0.5">유료 지정 시 독자 리딩시 100골드가 과금됩니다.</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewEpIsFree(true)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      newEpIsFree 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-250 shadow-sm' 
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    무료 연재
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEpIsFree(false)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      !newEpIsFree 
                        ? 'bg-violet-50 text-violet-650 border border-violet-250 shadow-sm' 
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    유료 연재
                  </button>
                </div>
              </div>

              {/* 발행 방식 설정 (즉시발행 / 임시저장 / 예약발행) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5 shadow-inner">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-800 block">발행 방식 설정</label>
                    <span className="text-xs text-slate-400 font-bold block mt-0.5">원하시는 발행 형태를 선택해 주세요.</span>
                  </div>

                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setNewEpStatus('published')}
                      className={`px-2 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                        newEpStatus === 'published' 
                          ? 'bg-violet-50 text-violet-655 border border-violet-200/50 shadow-sm' 
                          : 'text-slate-400'
                      }`}
                    >
                      즉시발행
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEpStatus('draft')}
                      className={`px-2 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                        newEpStatus === 'draft' 
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 shadow-sm' 
                          : 'text-slate-400'
                      }`}
                    >
                      임시저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewEpStatus('scheduled')}
                      className={`px-2 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                        newEpStatus === 'scheduled' 
                          ? 'bg-amber-50 text-amber-600 border border-amber-200/50 shadow-sm' 
                          : 'text-slate-400'
                      }`}
                    >
                      예약발행
                    </button>
                  </div>
                </div>

                {/* 예약 발행일 때만 예약 일시 입력 인풋 노출 */}
                {newEpStatus === 'scheduled' && (
                  <div className="flex flex-col gap-1 border-t border-slate-200/50 pt-2 animate-fade-in">
                    <label className="text-xs font-black text-slate-500 block">예약 발행일시 설정 *</label>
                    <input
                      type="datetime-local"
                      required
                      value={newEpPublishAt}
                      onChange={(e) => setNewEpPublishAt(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-violet-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-black text-slate-500">스토리 본문 내용 *</label>
                  <span className="text-xs font-bold text-slate-400">
                    공백 포함: <span className="text-violet-650 font-extrabold">{newEpContent.length.toLocaleString()}</span>자 | 
                    공백 제외: <span className="text-indigo-600 font-extrabold">{newEpContent.replace(/\s/g, '').length.toLocaleString()}</span>자
                  </span>
                </div>
                <textarea
                  rows={10}
                  required
                  value={newEpContent}
                  onChange={(e) => setNewEpContent(e.target.value)}
                  placeholder="본 회차의 스토리를 상세하게 집필해 주세요."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:border-violet-500 focus:outline-none bg-slate-50 text-slate-850 resize-none font-serif leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingEpisode}
                className="w-full py-3 bg-violet-600 hover:bg-violet-750 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 mt-4 cursor-pointer shadow-md"
              >
                {isCreatingEpisode ? '에피소드 업로드 중...' : '스토리 발행 배포하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. 골드 충전소 모달 */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center text-slate-800">
            {chargeSuccess ? (
              <div className="py-6 flex flex-col items-center animate-fade-in">
                <i className="fas fa-check-circle text-emerald-500 text-4xl mb-3 animate-pulse"></i>
                <h3 className="text-sm font-black text-slate-850">골드 충전 완료!</h3>
                <p className="text-xs text-slate-500 mt-1">지갑 잔액이 실시간 보충되었습니다.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                    <i className="fas fa-coins text-violet-500 animate-spin-slow"></i>
                    골드 충전소
                  </span>
                  <button onClick={() => setShowChargeModal(false)} className="p-1 rounded hover:bg-slate-100" aria-label="모달 닫기">
                    <i className="fas fa-times text-slate-450"></i>
                  </button>
                </div>

                <p className="text-xs text-slate-500 text-left mb-4 leading-relaxed">
                  원하시는 골드 상품을 선택해 주세요. 개발자/관리자 전용 Mock 결제창이 작동하여 즉시 무료 충전됩니다.
                </p>

                <div className="grid grid-cols-1 gap-2 text-left mb-5">
                  {[
                    { g: 1000, w: 1000 },
                    { g: 3000, w: 3000 },
                    { g: 5500, w: 5000 },
                    { g: 12000, w: 10000 }
                  ].map((item) => (
                    <div
                      key={item.g}
                      onClick={() => setChargeAmount(item.g)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        chargeAmount === item.g
                          ? 'bg-violet-50 border-violet-500'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-850">{item.g.toLocaleString()} 골드</span>
                      <span className="text-xs font-black text-violet-650 font-mono">
                        {item.w.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleChargeGold}
                  disabled={isCharging}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <i className="fas fa-credit-card"></i>
                  {isCharging ? '카드사 모의 승인 대기 중...' : '선택 금액으로 모의 결제'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
