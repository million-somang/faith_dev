import { useState, useEffect } from 'react';
import { useAuth } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  CheckCircle,
  X,
  BookOpen
} from 'lucide-react';

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
  
  // 팝업 리더 상태
  const [currentNovelId, setCurrentNovelId] = useState<number | null>(null);
  const [currentEpisodeNo, setCurrentEpisodeNo] = useState<number | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [episodesCount, setEpisodesCount] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  
  // 뷰어 제어 상태
  const [viewerFontSize, setViewerFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [viewerTheme, setViewerTheme] = useState<'light' | 'sepia' | 'dark'>('light');
  
  // 골드 충전소 및 결제 상태
  const [goldBalance, setGoldBalance] = useState<number>(0);
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<number>(5000);
  const [isCharging, setIsCharging] = useState(false);
  const [chargeSuccess, setChargeSuccess] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [systemMessage, setSystemMessage] = useState('');

  // 1. URL 쿼리 파라미터 로딩 및 검증
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlNovelId = params.get('novelId');
    const urlEpisodeNo = params.get('episodeNo');
    
    if (urlNovelId && urlEpisodeNo) {
      setCurrentNovelId(parseInt(urlNovelId, 10));
      setCurrentEpisodeNo(parseInt(urlEpisodeNo, 10));
    } else {
      // 팝업이 아닌 일반 페이지 접근 시, 포털 내부 웹소설 연재관으로 강제 리다이렉트
      window.location.replace('/entertainment/novel');
    }
  }, []);

  // 2. 골드 잔액 동기화
  const fetchGoldBalance = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get('/api/novel/gold', { withCredentials: true });
      if (data.success) {
        setGoldBalance(data.balance);
      }
    } catch (e) {
      console.error('[Gold Load Error]', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGoldBalance();
    }
  }, [user]);

  // 3. 에피소드 본문 획득 및 락 상태 점검
  const loadEpisodeData = async (nId: number, epNo: number) => {
    if (!nId || !epNo) return;
    setSystemMessage('');
    try {
      // 에피소드 총화수 획득
      const detailRes = await axios.get(`/api/novel/detail?id=${nId}`);
      if (detailRes.data.success) {
        setEpisodesCount(detailRes.data.episodes.length);
      }

      // 실제 본문 로딩
      const epRes = await axios.get(`/api/novel/episode?novelId=${nId}&episodeNo=${epNo}`, { withCredentials: true });
      if (epRes.data.success) {
        setCurrentEpisode(epRes.data.episode);
        setIsLocked(epRes.data.isLocked);
        
        // 조회수 증가 및 읽은 기록 갱신용 API 호출
        axios.get(`/api/novel/episode?novelId=${nId}&episodeNo=${epNo}`, { withCredentials: true }).catch(() => {});
      }
    } catch (e: any) {
      console.error('[Episode Load Error]', e);
      alert('에피소드를 불러오지 못했습니다: ' + (e.response?.data?.message || e.message));
    }
  };

  useEffect(() => {
    if (currentNovelId && currentEpisodeNo) {
      loadEpisodeData(currentNovelId, currentEpisodeNo);
    }
  }, [currentNovelId, currentEpisodeNo]);

  // 4. 이전화 / 다음화 이동
  const navigateEpisode = (targetNo: number) => {
    if (targetNo < 1 || targetNo > episodesCount) return;
    setCurrentEpisodeNo(targetNo);
  };

  // 5. 유료 소설 대여 결제
  const handlePurchaseEpisode = async () => {
    if (!user || !currentNovelId || !currentEpisodeNo) return;
    setIsPurchasing(true);
    setSystemMessage('');
    try {
      const { data } = await axios.post('/api/novel/purchase', {
        novelId: currentNovelId,
        episodeNo: currentEpisodeNo
      }, { withCredentials: true });

      if (data.success) {
        setGoldBalance(data.balance);
        setSystemMessage('🎉 대여에 성공했습니다! 즉시 열람을 시작합니다.');
        setTimeout(() => {
          loadEpisodeData(currentNovelId, currentEpisodeNo);
        }, 800);
      }
    } catch (e: any) {
      console.error(e);
      if (e.response?.data?.errorCode === 'INSUFFICIENT_GOLD') {
        setSystemMessage('❌ 골드가 부족합니다. 충전 후 다시 시도해 주세요.');
        setTimeout(() => {
          setShowChargeModal(true);
        }, 800);
      } else {
        alert('구매 도중 에러가 발생했습니다: ' + (e.response?.data?.message || e.message));
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  // 6. 충전 결제 처리
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
      alert('충전 승인 중 오류가 발생했습니다.');
    } finally {
      setIsCharging(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500 font-sans text-xs font-bold">
        인증 확인 중...
      </div>
    );
  }

  if (!currentEpisode) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500 font-sans text-xs font-bold">
        소설 스토리를 불러오고 있습니다...
      </div>
    );
  }

  // 팝업 감상 창 렌더러
  return (
    <div className={`min-h-screen font-sans flex flex-col p-4 select-none transition-colors duration-300 ${
      viewerTheme === 'dark' 
        ? 'bg-neutral-950 text-neutral-200' 
        : viewerTheme === 'sepia'
        ? 'bg-[#f4efe6] text-[#433422] font-medium'
        : 'bg-white text-slate-900 font-medium'
    }`}>
      {/* 상단 뷰어 제어 네비 */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-200/40 pb-3 shrink-0">
        <span className="text-sm font-black max-w-[220px] truncate sm:text-base">
          {currentEpisode.title}
        </span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              if (viewerFontSize === 'small') setViewerFontSize('medium');
              else if (viewerFontSize === 'medium') setViewerFontSize('large');
              else setViewerFontSize('small');
            }}
            className="p-2 rounded-lg bg-slate-100/50 hover:bg-slate-100 text-slate-500 hover:text-indigo-650 transition-colors"
            title="글꼴 크기 조절"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
          <button 
            onClick={() => {
              if (viewerTheme === 'dark') setViewerTheme('light');
              else if (viewerTheme === 'light') setViewerTheme('sepia');
              else setViewerTheme('dark');
            }}
            className="w-7 h-7 rounded-full border border-neutral-700/20 bg-amber-50 flex items-center justify-center text-xs font-black text-slate-800 cursor-pointer"
            title="뷰어 배경 테마"
          >
            T
          </button>
        </div>
      </div>

      {/* 본문 텍스트 */}
      <div 
        className={`flex-1 p-6 rounded-2xl border transition-all overflow-y-auto ${
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
              ? 'text-sm sm:text-base' 
              : viewerFontSize === 'large'
              ? 'text-xl sm:text-2xl font-semibold'
              : 'text-base sm:text-lg'
          } ${isLocked ? 'blur-text' : ''}`}
        >
          {currentEpisode.content}
        </p>

        {/* 유료 차단 */}
        {isLocked && (
          <div className="mt-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm text-center flex flex-col items-center">
            <Lock className="w-8 h-8 text-indigo-500 mb-3 animate-bounce" />
            <h3 className="text-sm sm:text-base font-black text-slate-800 mb-1">이 에피소드는 유료 회차입니다.</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed mb-4">
              대여 요금: <span className="text-indigo-650 font-black">{currentEpisode.price || 100} G</span>
            </p>
            
            <div className="flex flex-col gap-2 w-full">
              {systemMessage && (
                <p className="text-xs text-indigo-600 font-extrabold mb-1">{systemMessage}</p>
              )}
              <button
                onClick={handlePurchaseEpisode}
                disabled={isPurchasing}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white text-sm font-black rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-md"
              >
                {isPurchasing ? '처리 중...' : `골드로 소설 보기 (${currentEpisode.price || 100}G 소모)`}
              </button>
              <button
                onClick={() => setShowChargeModal(true)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all cursor-pointer border border-slate-200"
              >
                골드 충전하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 이전/다음 회차 이동 및 창 닫기 */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200/50 shrink-0">
        <button
          onClick={() => navigateEpisode(currentEpisode.episode_no - 1)}
          disabled={currentEpisode.episode_no <= 1}
          className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-black flex items-center gap-1.5 hover:bg-slate-200 active:scale-95 disabled:opacity-30 cursor-pointer text-slate-700 transition-all"
        >
          <ChevronLeft className="w-4 h-4" /> 이전화
        </button>
        
        <button
          onClick={() => window.close()}
          className="px-5.5 py-2.5 rounded-xl bg-indigo-50 border border-indigo-150 text-xs sm:text-sm font-black hover:bg-indigo-100 active:scale-95 cursor-pointer text-indigo-600 shadow-sm transition-all"
        >
          창 닫기
        </button>
        
        <button
          onClick={() => navigateEpisode(currentEpisode.episode_no + 1)}
          disabled={currentEpisode.episode_no >= episodesCount}
          className="px-4 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm font-black flex items-center gap-1.5 hover:bg-slate-200 active:scale-95 disabled:opacity-30 cursor-pointer text-slate-700 transition-all"
        >
          다음화 <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 골드 충전소 모달 */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-xs rounded-3xl p-5 shadow-2xl text-center text-slate-800">
            {chargeSuccess ? (
              <div className="py-6 flex flex-col items-center animate-fade-in">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-3.5 animate-pulse" />
                <h3 className="text-base font-black text-slate-805">골드 충전 완료!</h3>
                <p className="text-xs text-slate-550 mt-1">지갑 잔액이 실시간 보충되었습니다.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <span className="text-sm sm:text-base font-black text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500 animate-pulse" />
                    골드 충전소
                  </span>
                  <button onClick={() => setShowChargeModal(false)} className="p-1 rounded hover:bg-slate-100">
                    <X className="w-4 h-4 text-slate-450" />
                  </button>
                </div>

                <p className="text-xs sm:text-sm text-slate-550 text-left mb-4 leading-relaxed font-semibold">
                  원하시는 골드 상품을 선택해 주세요. 개발자 전용 모의 결제로 무료 승인됩니다.
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
                          ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <span className="text-sm font-black text-slate-800">{item.g.toLocaleString()} 골드</span>
                      <span className="text-xs font-black text-indigo-650 font-mono">{item.w.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleChargeGold}
                  disabled={isCharging}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white text-sm font-black rounded-xl transition-all cursor-pointer shadow-md"
                >
                  {isCharging ? '승인 요청 중...' : '모의 결제 및 즉시 충전'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
