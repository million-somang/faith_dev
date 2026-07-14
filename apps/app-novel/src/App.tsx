import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@faithportal/mini-app-sdk';
import { Header, Footer } from '@faithportal/ui';
import axios from 'axios';
import { 
  BookOpen, 
  User, 
  Award, 
  BookMarked, 
  History, 
  Coins, 
  Lock, 
  Unlock, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Plus, 
  Compass, 
  List, 
  Heart,
  CreditCard,
  CheckCircle,
  X,
  FileText
} from 'lucide-react';

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
  created_at: string;
}

export default function App() {
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // 팝업 리더 감지 상태 (회차를 읽을 때 콤팩트 팝업창 모드 여부)
  const [isPopupReader, setIsPopupReader] = useState<boolean>(false);

  // 모드 분기: 'reader' (독자) | 'writer' (작가 스튜디오)
  const [appMode, setAppMode] = useState<'reader' | 'writer'>('reader');
  
  // 독자 상태
  const [readerTab, setReaderTab] = useState<'home' | 'library' | 'history'>('home');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [novels, setNovels] = useState<Novel[]>([]);
  const [bestNovels, setBestNovels] = useState<Novel[]>([]);
  const [recentHistory, setRecentHistory] = useState<any[]>([]);
  const [bookmarkedNovels, setBookmarkedNovels] = useState<Novel[]>([]);
  
  // 상세 & 뷰어 상태
  const [currentNovel, setCurrentNovel] = useState<Novel | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [viewerFontSize, setViewerFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [viewerTheme, setViewerTheme] = useState<'light' | 'sepia' | 'dark'>('light'); // 기본 읽기는 라이트/세피아 우선
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
  const [newEpPrice, setNewEpPrice] = useState(100);
  const [isCreatingEpisode, setIsCreatingEpisode] = useState(false);
  
  // 골드 & 지갑 상태
  const [goldBalance, setGoldBalance] = useState<number>(0);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number>(5000);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');

  // 필명 초기 세팅
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

  // 장르 혹은 탭 변경 트리거
  useEffect(() => {
    fetchNovels();
  }, [selectedGenre, fetchNovels]);

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
    fetchBestNovels();
  }, []);

  // [팝업 리더 감지 훅] URL 쿼리 파라미터가 있을 때 즉시 독서창 진입
  useEffect(() => {
    const initPopupReader = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlNovelId = params.get('novelId');
      const urlEpisodeNo = params.get('episodeNo');
      
      if (urlNovelId && urlEpisodeNo) {
        setIsPopupReader(true);
        const nId = parseInt(urlNovelId, 10);
        const epNo = parseInt(urlEpisodeNo, 10);
        
        try {
          const detailRes = await axios.get(`/api/novel/detail?id=${nId}`);
          if (detailRes.data.success) {
            setCurrentNovel(detailRes.data.novel);
            setEpisodes(detailRes.data.episodes);
            
            const epRes = await axios.get(`/api/novel/episode?novelId=${nId}&episodeNo=${epNo}`, { withCredentials: true });
            if (epRes.data.success) {
              setCurrentEpisode(epRes.data.episode);
              setIsLocked(epRes.data.isLocked);
            }
          }
        } catch (e) {
          console.error('[Popup Reader Init Error]', e);
        }
      }
    };
    initPopupReader();
  }, []);

  // 6. 소설 상세 조회 진입
  const handleSelectNovel = async (novel: Novel) => {
    setCurrentEpisode(null);
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

  // 8. 에피소드 리더 진입 (일반 클릭 시 팝업창 실행, 팝업창 안에서는 내부 상태 갱신)
  const handleSelectEpisode = async (episodeNo: number) => {
    if (!currentNovel) return;
    setSystemMessage('');
    
    if (isPopupReader) {
      try {
        const { data } = await axios.get(`/api/novel/episode?novelId=${currentNovel.id}&episodeNo=${episodeNo}`, { withCredentials: true });
        if (data.success) {
          setCurrentEpisode(data.episode);
          setIsLocked(data.isLocked);
          fetchReaderData();
        }
      } catch (e: any) {
        console.error('[Episode Load Error]', e);
        alert('회차를 불러오지 못했습니다: ' + (e.response?.data?.message || e.message));
      }
      return;
    }

    const width = 460;
    const height = 850;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    window.open(
      `/app/novel/?novelId=${currentNovel.id}&episodeNo=${episodeNo}`,
      `novel-reader-${currentNovel.id}`,
      `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,status=no,location=no`
    );
  };

  // 9. 유료 회차 구매
  const handlePurchaseEpisode = async () => {
    if (!user || !currentNovel || !currentEpisode) return;
    setIsPurchasing(true);
    setSystemMessage('');
    try {
      const { data } = await axios.post('/api/novel/purchase', {
        novelId: currentNovel.id,
        episodeNo: currentEpisode.episode_no
      }, { withCredentials: true });

      if (data.success) {
        setGoldBalance(data.balance);
        setSystemMessage('🎉 대여에 성공했습니다! 즉시 열람을 시작합니다.');
        setTimeout(() => {
          handleSelectEpisode(currentEpisode.episode_no);
        }, 800);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.data?.errorCode === 'INSUFFICIENT_GOLD') {
        setSystemMessage('❌ 골드가 부족합니다. 충전소로 이동합니다.');
        setTimeout(() => {
          setShowChargeModal(true);
        }, 800);
      } else {
        alert('구매 처리 중 오류가 발생했습니다: ' + (e.response?.data?.message || e.message));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  // 10. 작가용 - 내 소설 선택 상세조회
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

  // 11. 작가용 - 소설 표지 이미지 파일 프리뷰 세팅
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewNovelCoverFile(file);
      const url = URL.createObjectURL(file);
      setNewNovelCoverPreview(url);
    }
  };

  // 12. 작가용 - 새 소설 작품 등록 실행
  const handleCreateNovelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNovelTitle || !newNovelAuthor || !newNovelGenre) {
      alert('필수 입력 항목이 비어있습니다.');
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
        alert('🎉 작품이 성공적으로 생성되었습니다!');
        setShowCreateNovel(false);
        setNewNovelTitle('');
        setNewNovelDesc('');
        setNewNovelCoverFile(null);
        setNewNovelCoverPreview('');
        fetchWriterNovels();
      }
    } catch (err: any) {
      console.error(err);
      alert('작품 생성 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingNovel(false);
    }
  };

  // 13. 작가용 - 새 회차 에피소드 집필 등록 실행
  const handleCreateEpisodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWriterNovel || !newEpTitle || !newEpContent) {
      alert('회차 제목과 에피소드 본문 내용을 작성해 주세요.');
      return;
    }

    setIsCreatingEpisode(true);
    try {
      const res = await axios.post('/api/novel/episode/create', {
        novelId: selectedWriterNovel.id,
        title: newEpTitle,
        content: newEpContent,
        isFree: newEpIsFree,
        price: newEpIsFree ? 0 : newEpPrice
      }, { withCredentials: true });

      if (res.data.success) {
        alert(`🎉 ${res.data.episodeNo}화 에피소드가 정상 발행되었습니다!`);
        setShowCreateEpisode(false);
        setNewEpTitle('');
        setNewEpContent('');
        setNewEpIsFree(true);
        handleSelectWriterNovel(selectedWriterNovel);
      }
    } catch (err: any) {
      console.error(err);
      alert('에피소드 등록 실패: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsCreatingEpisode(false);
    }
  };

  // 14. 골드 충전 (Mock 결제) 진행
  const handleChargeGold = async () => {
    setIsCharging(true);
    setChargeSuccess(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      const { data } = await axios.post('/api/novel/charge', { amount: chargeAmount }, { withCredentials: true });
      if (data.success) {
        setGoldBalance(data.balance);
        setChargeSuccess(true);
        setTimeout(() => {
          setShowChargeModal(false);
          setChargeSuccess(false);
        }, 1200);
      }
    } catch (e) {
      console.error(e);
      alert('충전 중 오류가 발생했습니다.');
    } finally {
      setIsCharging(false);
    }
  };

  const handleLogout = () => {
    // 포털 전체 로그아웃 API 주소로 리다이렉트
    window.location.href = '/login';
  };

  // 표지 렌더러 (엑스박스 100% 방지)
  const renderCover = (url: string, sizeClass: string = "w-14 h-20") => {
    if (!url) {
      return (
        <div className={`${sizeClass} rounded-xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center shrink-0 text-slate-400`}>
          <BookOpen className="w-6 h-6 mb-1 text-slate-300" />
          <span className="text-[7px] font-bold">표지 미등록</span>
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200 shadow-sm`}>
        <img 
          src={url} 
          alt="" 
          className="w-full h-full object-cover"
          onError={(e) => {
            // 이미지 주소가 유실되었을 때 엑스박스 방지
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <i class="fas fa-book text-slate-300 text-lg mb-1"></i>
                  <span style="font-size:7px; font-weight:bold;">표지 오류</span>
                </div>
              `;
            }
          }}
        />
      </div>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-600 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-xs font-bold">인증 세션 체크 중...</span>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // [독서 전용 팝업창 뷰어 레이아웃]
  // ────────────────────────────────────────────────────────
  if (isPopupReader && currentEpisode) {
    return (
      <div className={`min-h-screen font-sans flex flex-col p-4 select-none ${
        viewerTheme === 'dark' 
          ? 'bg-neutral-950 text-neutral-200' 
          : viewerTheme === 'sepia'
          ? 'bg-[#f4efe6] text-[#433422] font-medium'
          : 'bg-white text-slate-900 font-medium'
      }`}>
        {/* 상단 간소화된 제어 네비 */}
        <div className="flex items-center justify-between mb-4 border-b border-slate-200/40 pb-3 shrink-0">
          <span className="text-xs font-black max-w-[220px] truncate">
            {currentEpisode.title}
          </span>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => {
                if (viewerFontSize === 'small') setViewerFontSize('medium');
                else if (viewerFontSize === 'medium') setViewerFontSize('large');
                else setViewerFontSize('small');
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-indigo-600 transition-colors"
              title="글꼴 크기 조절"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => {
                if (viewerTheme === 'dark') setViewerTheme('light');
                else if (viewerTheme === 'light') setViewerTheme('sepia');
                else setViewerTheme('dark');
              }}
              className="w-5 h-5 rounded-full border border-neutral-700/20 bg-amber-100 flex items-center justify-center text-[10px] font-bold text-slate-900 cursor-pointer"
              title="뷰어 배경 테마"
            >
              T
            </button>
          </div>
        </div>

        {/* 본문 영역 */}
        <div 
          className={`flex-1 p-5 rounded-2xl border transition-all overflow-y-auto ${
            viewerTheme === 'dark' 
              ? 'bg-neutral-900/60 border-neutral-850' 
              : viewerTheme === 'sepia'
              ? 'bg-[#eae3d2] border-[#dfd7c0]'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <p 
            className={`leading-relaxed whitespace-pre-wrap break-keep select-none font-serif ${
              viewerFontSize === 'small' 
                ? 'text-xs' 
                : viewerFontSize === 'large'
                ? 'text-lg'
                : 'text-sm'
            } ${isLocked ? 'blur-text' : ''}`}
          >
            {currentEpisode.content}
          </p>

          {/* 유료 잠금 창 안내 (Locked) */}
          {isLocked && (
            <div className="mt-8 p-5 rounded-2xl bg-white border border-slate-200 shadow-sm text-center flex flex-col items-center">
              <Lock className="w-7 h-7 text-indigo-500 mb-3 animate-bounce" />
              <h3 className="text-xs font-black text-slate-800 mb-1">이 에피소드는 유료 회차입니다.</h3>
              <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
                대여 요금: <span className="text-indigo-600 font-black">{currentEpisode.price || 100} G</span>
              </p>
              
              <div className="flex flex-col gap-2 w-full">
                {systemMessage && (
                  <p className="text-[9px] text-indigo-600 font-extrabold mb-1">{systemMessage}</p>
                )}
                <button
                  onClick={handlePurchaseEpisode}
                  disabled={isPurchasing}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-sm"
                >
                  {isPurchasing ? '처리 중...' : `골드로 소설 보기 (${currentEpisode.price || 100}G 소모)`}
                </button>
                <button
                  onClick={() => setShowChargeModal(true)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold rounded-lg transition-all cursor-pointer border border-slate-200"
                >
                  골드 충전하기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 회차 이동 하단 컨트롤바 */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200 shrink-0">
          <button
            onClick={() => handleSelectEpisode(currentEpisode.episode_no - 1)}
            disabled={currentEpisode.episode_no <= 1}
            className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold flex items-center gap-1 hover:bg-slate-200 active:scale-95 disabled:opacity-30 cursor-pointer text-slate-700"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> 이전화
          </button>
          
          <button
            onClick={() => window.close()}
            className="px-4 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-[11px] font-black hover:bg-indigo-100 active:scale-95 cursor-pointer text-indigo-600 shadow-sm"
          >
            창 닫기
          </button>
          
          <button
            onClick={() => handleSelectEpisode(currentEpisode.episode_no + 1)}
            disabled={currentEpisode.episode_no >= episodes.length}
            className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-[11px] font-bold flex items-center gap-1 hover:bg-slate-200 active:scale-95 disabled:opacity-30 cursor-pointer text-slate-700"
          >
            다음화 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 충전소 모달 */}
        {showChargeModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center text-slate-800">
              {chargeSuccess ? (
                <div className="py-6 flex flex-col items-center animate-fade-in">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mb-3.5 animate-pulse" />
                  <h3 className="text-sm font-black text-slate-800">골드 충전 완료!</h3>
                  <p className="text-[10px] text-slate-500 mt-1">지갑 잔액이 실시간 보충되었습니다.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                      골드 충전소
                    </span>
                    <button onClick={() => setShowChargeModal(false)} className="p-1 rounded hover:bg-slate-100">
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 text-left mb-4 leading-relaxed">
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
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          chargeAmount === item.g
                            ? 'bg-indigo-50 border-indigo-500'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-black text-slate-850">{item.g.toLocaleString()} 골드</span>
                        <span className="text-[10px] font-black text-indigo-600 font-mono">{item.w.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleChargeGold}
                    disabled={isCharging}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    {isCharging ? '카드사 모의 결제 승인 중...' : '선택 금액으로 모의 결제하기'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // [일반 브라우저 포털 통합 라이트 테마 레이아웃]
  // ────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. 포털 공통 GNB 헤더 연동 (디자인 일체화 완료) */}
      <Header user={user} onLogout={handleLogout} />
      
      {/* 서브 네비 바: 포털 안에서 돌아가며 모드 전환 제어 */}
      <div className="bg-white border-b border-slate-200 shadow-sm w-full py-3">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.location.href = '/entertainment';
              }}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mr-1"
              title="재미 메뉴로 돌아가기"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-base font-black text-slate-800 tracking-tight leading-none">베라 웹소설 연재관</h1>
              <span className="text-[9px] text-indigo-500 font-bold mt-1 tracking-wider uppercase">Vera Novel Stage</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 모드 전환 탭 */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  setAppMode('reader');
                  setCurrentNovel(null);
                  setCurrentEpisode(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  appMode === 'reader'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                독자 연재관
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    alert('작가 스튜디오는 로그인 후 이용 가능합니다.');
                    return;
                  }
                  setAppMode('writer');
                  setSelectedWriterNovel(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                  appMode === 'writer'
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                작가 스튜디오
              </button>
            </div>

            {/* 보유 골드 */}
            {user ? (
              <button 
                onClick={() => setShowChargeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 transition-colors border border-indigo-100 cursor-pointer shadow-sm"
              >
                <Coins className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                <span className="text-[10px] font-black text-indigo-700 font-mono">
                  {goldBalance.toLocaleString()} G
                </span>
              </button>
            ) : (
              <span className="text-[9px] text-slate-400 italic">로그인 필요</span>
            )}
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 (포털 가로 폭 6xl 와 일치) */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full flex flex-col">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          
          {/* ========================================================= */}
          {/* 1. 독자 연재관 모드                                       */}
          {/* ========================================================= */}
          {appMode === 'reader' && (
            <>
              {currentNovel ? (
                // 소설 상세 정보 및 에피소드 리스트
                <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                  {/* 뒤로가기 */}
                  <button 
                    onClick={() => setCurrentNovel(null)}
                    className="self-start px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 mb-5 cursor-pointer border border-slate-200"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> 전체 작품보기
                  </button>

                  {/* 책 정보 상단 카드 */}
                  <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex gap-4 relative overflow-hidden">
                    {renderCover(currentNovel.cover_url, "w-24 h-32")}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                            {currentNovel.genre}
                          </span>
                          {user && (
                            <button 
                              onClick={handleToggleBookmark}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-rose-500 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
                            </button>
                          )}
                        </div>
                        <h2 className="text-base font-black text-slate-800 mt-2 leading-tight">
                          {currentNovel.title}
                        </h2>
                        <span className="text-[10px] text-slate-500 font-bold block mt-1">
                          작가: {currentNovel.author}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-3 mt-2 font-light">
                        {currentNovel.description}
                      </p>
                    </div>
                  </div>

                  {/* 회차 리스트 헤더 */}
                  <h3 className="text-xs font-black text-slate-700 mt-6 mb-3 flex items-center gap-1.5">
                    <List className="w-3.5 h-3.5 text-indigo-500" />
                    전체 에피소드 ({episodes.length}화)
                  </h3>

                  {/* 회차 목록 */}
                  <div className="flex flex-col gap-2">
                    {episodes.map((ep) => (
                      <div
                        key={ep.id}
                        onClick={() => handleSelectEpisode(ep.episode_no)}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100/50 transition-all cursor-pointer"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[340px]">
                            {ep.title}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            조회수: {ep.views.toLocaleString()} • 등록일: {new Date(ep.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {ep.is_free === 1 ? (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                              무료
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center gap-0.5">
                              <Lock className="w-2.5 h-2.5 text-indigo-500" /> {ep.price || 100}G
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {episodes.length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-8">아직 등록된 에피소드가 없습니다.</p>
                    )}
                  </div>
                </div>
              ) : (
                // 독자 홈 메인 화면
                <div className="flex flex-col gap-5">
                  
                  {/* 독자 서브 탭 제어 */}
                  <div className="flex items-center bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                    <button 
                      onClick={() => setReaderTab('home')}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        readerTab === 'home' 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-black shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Compass className="w-3.5 h-3.5" /> 소설 탐색
                    </button>
                    <button 
                      onClick={() => {
                        if (!user) {
                          alert('보관함은 로그인 후 확인할 수 있습니다.');
                          return;
                        }
                        setReaderTab('library');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        readerTab === 'library' 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-black shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BookMarked className="w-3.5 h-3.5" /> 선호보관함
                    </button>
                    <button 
                      onClick={() => {
                        if (!user) {
                          alert('읽은 기록은 로그인 후 확인할 수 있습니다.');
                          return;
                        }
                        setReaderTab('history');
                      }}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        readerTab === 'history' 
                          ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 font-black shadow-sm' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" /> 최근 읽은 목록
                    </button>
                  </div>

                  {/* ─────────────────── A. 홈 탭 ─────────────────── */}
                  {readerTab === 'home' && (
                    <>
                      {/* 최근 읽은 작품 퀵카드 (이어보기) */}
                      {user && recentHistory.length > 0 && (
                        <div className="flex flex-col gap-2 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
                          <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-indigo-500" />
                            보던 소설 이어서 읽기
                          </h3>
                          <div 
                            onClick={() => {
                              handleSelectNovel(recentHistory[0]);
                              setTimeout(() => {
                                handleSelectEpisode(recentHistory[0].last_episode_no);
                              }, 300);
                            }}
                            className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-200 transition-all shadow-sm group"
                          >
                            <div className="flex items-center gap-3">
                              {renderCover(recentHistory[0].cover_url, "w-10 h-14")}
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                  {recentHistory[0].title}
                                </span>
                                <span className="text-[10px] text-indigo-600 font-black">
                                  {recentHistory[0].last_episode_no}화 리딩 중
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm">
                              이어읽기
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 실시간 베스트 배너 (TOP 3) */}
                      {bestNovels.length > 0 && (
                        <div className="flex flex-col gap-2.5 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
                          <h3 className="text-xs font-black text-slate-750 flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                            투데이 실시간 베스트 TOP 3
                          </h3>
                          
                          <div className="flex flex-col gap-2">
                            {bestNovels.map((novel, index) => (
                              <div
                                key={novel.id}
                                onClick={() => handleSelectNovel(novel)}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer shadow-sm"
                              >
                                <div className="flex items-center gap-3">
                                  <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${
                                    index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-450' : 'bg-amber-700'
                                  }`}>
                                    {index + 1}
                                  </span>
                                  {renderCover(novel.cover_url, "w-10 h-14")}
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-xs font-extrabold text-slate-800 truncate max-w-[280px]">
                                      {novel.title}
                                    </span>
                                    <span className="text-[9px] text-slate-400">
                                      작가: {novel.author} • {novel.genre}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] font-bold text-slate-400 block">총 누적뷰</span>
                                  <span className="text-[10px] font-black text-indigo-600 font-mono">
                                    {(novel as any).total_views || 0}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 장르 탭 필터 및 소설 연재 전체 목록 */}
                      <div className="flex flex-col gap-3.5 mt-2 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <h3 className="text-xs font-black text-slate-700">소설 연재 목록</h3>
                          
                          <select
                            value={selectedGenre}
                            onChange={(e) => setSelectedGenre(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-[10px] font-extrabold text-indigo-600 rounded-lg px-2 py-1 shadow-sm focus:outline-none"
                          >
                            <option value="all">전체 장르</option>
                            <option value="현대판타지">현대판타지</option>
                            <option value="판타지">판타지</option>
                            <option value="무협">무협</option>
                            <option value="로맨스">로맨스</option>
                          </select>
                        </div>

                        {/* 소설 카드 리스트 */}
                        <div className="grid grid-cols-1 gap-3">
                          {novels.map((novel) => (
                            <div 
                              key={novel.id}
                              onClick={() => handleSelectNovel(novel)}
                              className="flex gap-3.5 p-3 rounded-2xl bg-slate-50/40 border border-slate-200/60 hover:border-indigo-100 hover:bg-slate-50 transition-all cursor-pointer group"
                            >
                              {renderCover(novel.cover_url, "w-14 h-20")}
                              <div className="flex-1 flex flex-col justify-between py-0.5">
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                                      {novel.genre}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold">작가: {novel.author}</span>
                                  </div>
                                  <h4 className="text-xs font-black text-slate-800 group-hover:text-indigo-600 transition-colors mt-1.5 leading-tight">
                                    {novel.title}
                                  </h4>
                                </div>
                                <p className="text-[10px] text-slate-500 line-clamp-2 leading-normal">
                                  {novel.description}
                                </p>
                              </div>
                            </div>
                          ))}
                          {novels.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                              <FileText className="w-8 h-8 text-slate-300 mb-2.5" />
                              <p className="text-xs font-black text-slate-800">현재 연재 중인 웹소설이 없습니다.</p>
                              <p className="text-[10px] text-slate-400 mt-1 max-w-[280px]">
                                상단의 [작가 스튜디오] 메뉴를 눌러 첫 번째 소설을 직접 개설하고 연재의 주인공이 되어보세요! ✍️
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─────────────────── B. 선호보관함 탭 ─────────────────── */}
                  {readerTab === 'library' && (
                    <div className="flex flex-col gap-3 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
                      <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5 text-rose-500" />
                        내가 선호하는 소설 ({bookmarkedNovels.length})
                      </h3>
                      
                      <div className="grid grid-cols-1 gap-3">
                        {bookmarkedNovels.map((novel) => (
                          <div 
                            key={novel.id}
                            onClick={() => handleSelectNovel(novel)}
                            className="flex gap-3 p-3 rounded-2xl bg-slate-50/40 border border-slate-200/60 hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            {renderCover(novel.cover_url, "w-12 h-16")}
                            <div className="flex-1 flex flex-col justify-center">
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100 self-start">
                                {novel.genre}
                              </span>
                              <h4 className="text-xs font-extrabold text-slate-800 mt-1.5">{novel.title}</h4>
                              <span className="text-[9px] text-slate-400 mt-0.5 block">작가: {novel.author}</span>
                            </div>
                          </div>
                        ))}
                        {bookmarkedNovels.length === 0 && (
                          <p className="text-[10px] text-slate-400 text-center py-12">아직 보관함에 등록된 선호작이 없습니다. 소설 페이지에서 하트 아이콘을 눌러 추가해 보세요.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ─────────────────── C. 최근 읽은 목록 탭 ─────────────────── */}
                  {readerTab === 'history' && (
                    <div className="flex flex-col gap-3 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
                      <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-indigo-500" />
                        최근에 읽은 에피소드 이력
                      </h3>

                      <div className="flex flex-col gap-2">
                        {recentHistory.map((h) => (
                          <div
                            key={h.id}
                            onClick={() => {
                              handleSelectNovel(h);
                              setTimeout(() => {
                                handleSelectEpisode(h.last_episode_no);
                              }, 300);
                            }}
                            className="p-3 rounded-2xl bg-slate-50/40 border border-slate-200/60 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              {renderCover(h.cover_url, "w-10 h-14")}
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                  {h.title}
                                </span>
                                <span className="text-[9px] text-indigo-600 font-extrabold">
                                  최종 {h.last_episode_no}화 감상함
                                </span>
                              </div>
                            </div>
                            <span className="text-[8px] text-slate-400 font-mono">
                              {new Date(h.read_at).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {recentHistory.length === 0 && (
                          <p className="text-[10px] text-slate-400 text-center py-12">아직 감상한 소설 회차 이력이 존재하지 않습니다.</p>
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
            <div className="flex flex-col gap-5 bg-white border border-slate-200/80 p-5 rounded-3xl shadow-sm">
              
              {selectedWriterNovel ? (
                // 작가용 특정 소설 회차 및 관리창
                <div className="flex flex-col gap-4 animate-fade-in">
                  
                  {/* 뒤로가기 */}
                  <button 
                    onClick={() => setSelectedWriterNovel(null)}
                    className="self-start px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 cursor-pointer border border-slate-200"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> 내 작품 목록
                  </button>

                  {/* 작품 타이틀 정보 */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex gap-3.5">
                    {renderCover(selectedWriterNovel.cover_url, "w-14 h-20")}
                    <div>
                      <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {selectedWriterNovel.genre}
                      </span>
                      <h2 className="text-sm font-black text-slate-800 mt-1 leading-tight">{selectedWriterNovel.title}</h2>
                      <span className="text-[10px] text-slate-500 mt-0.5 block">필명: {selectedWriterNovel.author}</span>
                    </div>
                  </div>

                  {/* 회차 등록 및 리스트 관리 */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mt-2">
                    <h3 className="text-xs font-black text-slate-750">집필된 에피소드 ({writerEpisodes.length}화)</h3>
                    <button
                      onClick={() => setShowCreateEpisode(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> 새 회차 등록
                    </button>
                  </div>

                  {/* 작가 등록 에피소드 리스트 */}
                  <div className="flex flex-col gap-2">
                    {writerEpisodes.map((ep) => (
                      <div
                        key={ep.id}
                        className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between shadow-sm"
                      >
                        <div>
                          <span className="text-xs font-extrabold text-slate-800 block">{ep.title}</span>
                          <span className="text-[9px] text-slate-400 font-mono mt-0.5 block">
                            조회수: {ep.views.toLocaleString()} • 등록일자: {new Date(ep.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          {ep.is_free === 1 ? (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">
                              무료 연재
                            </span>
                          ) : (
                            <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                              유료 ({ep.price} G)
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {writerEpisodes.length === 0 && (
                      <p className="text-[10px] text-slate-400 text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        아직 집필된 회차가 없습니다. [새 회차 등록]을 눌러 첫 연재를 시작해보세요!
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                // 작가 소설 목록
                <div className="flex flex-col gap-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black text-slate-750">내가 연재 중인 소설 ({writerNovels.length})</h3>
                    <button
                      onClick={() => setShowCreateNovel(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[10px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> 새 소설 생성
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {writerNovels.map((novel) => (
                      <div
                        key={novel.id}
                        onClick={() => handleSelectWriterNovel(novel)}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex gap-3.5 hover:border-indigo-200 cursor-pointer transition-all shadow-sm"
                      >
                        {renderCover(novel.cover_url, "w-12 h-16")}
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                              {novel.genre}
                            </span>
                            <span className="text-[9px] text-slate-450 font-bold">필명: {novel.author}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 mt-1.5 leading-tight">{novel.title}</h4>
                        </div>
                      </div>
                    ))}
                    {writerNovels.length === 0 && (
                      <p className="text-[10px] text-slate-450 text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                        작성중인 작품이 없습니다. [새 소설 생성]을 클릭해 내 서재를 열어보세요!
                      </p>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>

      {/* 2. 포털 공통 Footer 연동 (디자인 일체화 완료) */}
      <Footer />

      {/* ========================================================= */}
      {/* Modals & Portals                                          */}
      {/* ========================================================= */}

      {/* 1. 작가용 - 새 소설 생성 모달 */}
      {showCreateNovel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh] text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-500" />
                새 작품 등록
              </h3>
              <button onClick={() => setShowCreateNovel(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-450" />
              </button>
            </div>

            <form onSubmit={handleCreateNovelSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1">소설 제목 *</label>
                <input
                  type="text"
                  required
                  value={newNovelTitle}
                  onChange={(e) => setNewNovelTitle(e.target.value)}
                  placeholder="소설 제목을 입력하세요"
                  className="w-full text-xs p-2.5 rounded-xl premium-input text-slate-850"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-black text-slate-500 block mb-1">작가 필명 *</label>
                  <input
                    type="text"
                    required
                    value={newNovelAuthor}
                    onChange={(e) => setNewNovelAuthor(e.target.value)}
                    placeholder="작가 필명"
                    className="w-full text-xs p-2.5 rounded-xl premium-input text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 block mb-1">장르 선택 *</label>
                  <select
                    value={newNovelGenre}
                    onChange={(e) => setNewNovelGenre(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl premium-input text-slate-850"
                  >
                    <option value="현대판타지">현대판타지</option>
                    <option value="판타지">판타지</option>
                    <option value="무협">무협</option>
                    <option value="로맨스">로맨스</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1">줄거리 요약</label>
                <textarea
                  rows={3}
                  value={newNovelDesc}
                  onChange={(e) => setNewNovelDesc(e.target.value)}
                  placeholder="소설의 전반적인 줄거리 요약을 입력해 주세요."
                  className="w-full text-xs p-2.5 rounded-xl premium-input text-slate-850 resize-none"
                />
              </div>

              {/* 로컬 표지 이미지 선택 영역 */}
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1.5">소설 표지 등록 (로컬 업로드) *</label>
                <div className="flex gap-3 items-center">
                  <div className="w-14 h-20 rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {newNovelCoverPreview ? (
                      <img src={newNovelCoverPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <label className="flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-200 hover:border-slate-350 hover:bg-slate-50 cursor-pointer bg-slate-50/50 text-[10px] text-slate-500 transition-colors">
                    <Upload className="w-3.5 h-3.5 mb-1 text-slate-400" />
                    파일 선택하기
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 mt-4 cursor-pointer shadow-sm"
              >
                {isCreatingNovel ? '작품 등록 처리 중...' : '작품 최종 등록하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. 작가용 - 새 에피소드 회차 등록 모달 */}
      {showCreateEpisode && selectedWriterNovel && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-sm rounded-3xl p-5 shadow-2xl flex flex-col max-h-[95vh] text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-500" />
                새 회차 집필하기
              </h3>
              <button onClick={() => setShowCreateEpisode(false)} className="p-1 rounded hover:bg-slate-100">
                <X className="w-4 h-4 text-slate-450" />
              </button>
            </div>

            <form onSubmit={handleCreateEpisodeSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1">
              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1">회차 제목 *</label>
                <input
                  type="text"
                  required
                  value={newEpTitle}
                  onChange={(e) => setNewEpTitle(e.target.value)}
                  placeholder="예: 4화: 운명을 뒤바꾼 한 마디"
                  className="w-full text-xs p-2.5 rounded-xl premium-input text-slate-850"
                />
              </div>

              {/* 무료 / 유료 연재 지정 스위치 */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <div>
                  <label className="text-[10px] font-black text-slate-800 block">유료화 연재 설정</label>
                  <span className="text-[8px] text-slate-450 font-bold block mt-0.5">유료 회차는 한 회차당 100 골드가 차감됩니다.</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setNewEpIsFree(true)}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
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
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold transition-all cursor-pointer ${
                      !newEpIsFree 
                        ? 'bg-indigo-50 text-indigo-650 border border-indigo-250 shadow-sm' 
                        : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    유료 연재
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-500 block mb-1">소설 본문 이야기 *</label>
                <textarea
                  rows={10}
                  required
                  value={newEpContent}
                  onChange={(e) => setNewEpContent(e.target.value)}
                  placeholder="소설 독자들의 마음에 깊이 각인될 에피소드 스토리를 집필해 보세요."
                  className="w-full text-xs p-2.5 rounded-xl premium-input text-slate-850 resize-none font-serif"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingEpisode}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 mt-4 cursor-pointer shadow-sm"
              >
                {isCreatingEpisode ? '에피소드 업로드 중...' : '스토리에 배포(발행)하기'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. 골드 충전소 모달 (Mockup Billing portal) */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center text-slate-800">
            
            {chargeSuccess ? (
              <div className="py-6 flex flex-col items-center animate-fade-in">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-3.5 animate-pulse" />
                <h3 className="text-sm font-black text-slate-850">골드 충전 완료!</h3>
                <p className="text-[10px] text-slate-550 mt-1">지갑 잔액이 실시간 보충되었습니다.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span className="text-xs font-black text-slate-850 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-indigo-500 animate-spin-slow" />
                    골드 충전소
                  </span>
                  <button onClick={() => setShowChargeModal(false)} className="p-1 rounded hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 text-left mb-4 leading-relaxed">
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
                          ? 'bg-indigo-50 border-indigo-500'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-xs font-black text-slate-850">{item.g.toLocaleString()} 골드</span>
                      <span className="text-[10px] font-black text-indigo-600 font-mono">
                        {item.w.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleChargeGold}
                  disabled={isCharging}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  {isCharging ? '카드사 모의 결제 승인 중...' : '선택 금액으로 모의 결제하기'}
                </button>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
