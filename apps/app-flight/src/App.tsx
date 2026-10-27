import { useState, useCallback, useEffect } from 'react';
import { useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { FlightCanvas } from './components/FlightCanvas';
import { DashboardSidebar } from './components/DashboardSidebar';
import { TouchControls } from './components/TouchControls';
import { GameOverModal } from './components/GameOverModal';
import { HowToModal } from './components/HowToModal';
import { BannerSlot } from './components/BannerSlot';
import { GameEngineState } from './engine/types';

export default function App() {
  const { user } = useAuth();
  const { sendToPortal } = usePortalMessenger();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showHowTo, setShowHowTo] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [finalKills, setFinalKills] = useState<number>(0);
  const [isScoreSaved, setIsScoreSaved] = useState<boolean>(false);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const s = localStorage.getItem('vera_flight_highscore');
      return s ? parseInt(s, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const [engineState, setEngineState] = useState<GameEngineState | null>(null);
  const [rollTriggerCount, setRollTriggerCount] = useState<number>(0);
  const [bombTriggerCount, setBombTriggerCount] = useState<number>(0);
  const [restartTriggerCount, setRestartTriggerCount] = useState<number>(0);

  // 로그인 유저의 서버 최고 기록 동기화
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    axios
      .get<{ success: boolean; highScore?: number }>(`/api/games/flight/highscore/${user.id}`, {
        withCredentials: true,
      })
      .then((res) => {
        const serverHs = res.data?.highScore || 0;
        if (!cancelled && serverHs > 0) {
          setHighScore((prev) => {
            const next = Math.max(prev, serverHs);
            try {
              localStorage.setItem('vera_flight_highscore', String(next));
            } catch {
              // ignore
            }
            return next;
          });
        }
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // 게임오버 콜백 및 서버 점수 저장
  const handleGameOver = useCallback(
    async (score: number, kills: number, hs: number) => {
      const best = Math.max(highScore, hs, score);
      setFinalScore(score);
      setFinalKills(kills);
      setHighScore(best);
      setIsScoreSaved(false);
      setIsGameOver(true);

      try {
        localStorage.setItem('vera_flight_highscore', String(best));
      } catch {
        // ignore
      }

      if (score > 0 && user) {
        try {
          const earnedPoints = Math.min(50, Math.max(5, Math.floor(score / 500)));
          await axios.post(
            '/api/games/flight/score',
            {
              score,
              metadata: { kills, earnedPoints },
            },
            { withCredentials: true }
          );
          setIsScoreSaved(true);
          sendToPortal('MISSION_CLEAR');
          const targetWindow =
            window.opener || (window.parent !== window ? window.parent : null);
          if (targetWindow) {
            targetWindow.postMessage(
              { type: 'GAME_SCORE_UPDATED', gameId: 'flight', score },
              '*'
            );
          }
        } catch (err) {
          console.warn('[Vera Flight] 점수 저장 실패:', err);
        }
      }
    },
    [highScore, user, sendToPortal]
  );

  // 재시작 콜백
  const handleRestart = useCallback(() => {
    setIsGameOver(false);
    setIsScoreSaved(false);
    setRestartTriggerCount((c) => c + 1);
  }, []);

  // 터치/버튼 롤 트리거
  const handleTriggerRoll = useCallback(() => {
    setRollTriggerCount((c) => c + 1);
  }, []);

  // 터치/버튼 폭탄 트리거
  const handleTriggerBomb = useCallback(() => {
    setBombTriggerCount((c) => c + 1);
  }, []);

  // 스플래시 로딩 완료 콜백 (참조 고정으로 타이머 초기화 방지)
  const handleSplashFinish = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <ErrorBoundary>
      {/* 스플래시 인트로 (1~100% 실시간 프로그레스 바) */}
      {isLoading && <SplashScreen onFinish={handleSplashFinish} />}

      <div className="w-full min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between py-2 sm:py-4 px-2.5 sm:px-6 select-none overflow-x-hidden">
        {/* 상단 통합 헤더 */}
        <Header onOpenHowTo={() => setShowHowTo(true)} highScore={highScore} />

        {/* 메인 반응형 워크스페이스: 모바일 450px 1단 ➔ 태블릿/PC 2열 그리드 자동 확장 */}
        <main className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto flex-1 my-auto">
          <div className="md:grid md:grid-cols-2 md:gap-6 md:items-start">
            {/* 좌측 컬럼: 메인 비행 캔버스 + 터치 조작부 + 스폰서 배너 */}
            <div className="flex flex-col items-center">
              <FlightCanvas
                onGameOver={handleGameOver}
                onStateUpdate={setEngineState}
                highScore={highScore}
                rollTriggerRequested={rollTriggerCount}
                bombTriggerRequested={bombTriggerCount}
                restartTriggerRequested={restartTriggerCount}
              />

              {/* 모바일/태블릿 하단 퀵 액션 버튼 (360° 롤 & 메가 폭탄) */}
              <TouchControls
                rolls={engineState?.player.rolls || 0}
                bombs={engineState?.player.bombs || 0}
                onTriggerRoll={handleTriggerRoll}
                onTriggerBomb={handleTriggerBomb}
              />

              {/* 좌측 하단 스폰서 배너 슬롯 */}
              <div className="w-full max-w-[450px] mt-2.5">
                <BannerSlot />
              </div>
            </div>

            {/* 우측 컬럼: 태블릿/PC 전용 와이드 종합 대시보드 (스코어, 업그레이드 트리, 통계) */}
            <div className="hidden md:block">
              <DashboardSidebar state={engineState} />
            </div>
          </div>
        </main>

        {/* 하단 공식 푸터 */}
        <footer className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto mt-2 pt-2 border-t border-[#EBE6DD] flex items-center justify-between text-[11px] text-[#8A847A] shrink-0">
          <span>베라 플라이트 • 1942 레트로 오마주</span>
          <span>© 2026 VeraNex. All rights reserved.</span>
        </footer>

        {/* 게임오버 모달 */}
        {isGameOver && (
          <GameOverModal
            score={finalScore}
            kills={finalKills}
            highScore={highScore}
            isLoggedIn={!!user}
            isScoreSaved={isScoreSaved}
            onRestart={handleRestart}
          />
        )}

        {/* 도움말 & 공략 모달 */}
        {showHowTo && <HowToModal onClose={() => setShowHowTo(false)} />}
      </div>
    </ErrorBoundary>
  );
}

