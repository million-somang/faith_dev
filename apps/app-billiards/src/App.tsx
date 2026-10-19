import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth, usePortalMessenger } from '@faithportal/mini-app-sdk';
import { ActiveTab } from './types/billiards';
import { useBilliardsGame } from './hooks/useBilliardsGame';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { Header } from './components/Header';
import { ScoreboardBar } from './components/ScoreboardBar';
import { BilliardsCanvas } from './components/BilliardsCanvas';
import { CompactShotControls } from './components/CompactShotControls';
import { DesktopDashboard } from './components/DesktopDashboard';
import { HowToTab } from './components/HowToTab';
import { FaqTab } from './components/FaqTab';
import { MatchResultModal } from './components/MatchResultModal';
import { BannerSlot } from './components/BannerSlot';

declare global {
  interface Document {
    parentKeyboardCallback?: (data: {
      type: string;
      eventType: string;
      key: string;
      code: string;
    }) => void;
  }
}

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('arena');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const savedMatchSignatureRef = useRef<string | null>(null);

  const { user } = useAuth();
  const { sendToPortal } = usePortalMessenger();

  const game = useBilliardsGame();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  // 명예의 전당 점수 서버 저장 및 포털 postMessage 브로드캐스트
  const submitScoreToPortal = useCallback(
    async (scoreToSave: number) => {
      if (scoreToSave <= 0) return;
      const finalPoints =
        game.ruleMode === 'four-ball'
          ? scoreToSave * 10 + game.highRun * 25
          : scoreToSave * 120 + game.highRun * 50;

      try {
        await fetch('/api/games/billiards/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            score: finalPoints,
            metadata: {
              ruleMode: game.ruleMode,
              p1Score: game.p1Score,
              p2Score: game.p2Score,
              inning: game.inning,
              highRun: game.highRun,
              averagePerInning: game.averagePerInning,
              userId: user?.id ?? 'guest',
            },
          }),
        });
      } catch {
        // 비로그인/오프라인 환경에서도 로컬 리포트는 정상 동작
      }

      try {
        sendToPortal('MISSION_CLEAR');
        const targetWindow =
          window.opener || (window.parent !== window ? window.parent : null);
        if (targetWindow) {
          targetWindow.postMessage(
            { type: 'GAME_SCORE_UPDATED', gameId: 'billiards', score: finalPoints },
            '*'
          );
        }
      } catch {
        // 단독 창 실행 시 무시
      }

      setIsScoreSaved(true);
    },
    [
      game.ruleMode,
      game.highRun,
      game.p1Score,
      game.p2Score,
      game.inning,
      game.averagePerInning,
      sendToPortal,
      user?.id,
    ]
  );

  // 경기 승리 또는 리포트 열람 시 점수 자동 등록
  useEffect(() => {
    if (game.isResultModalOpen && game.p1Score > 0) {
      const sig = `${game.ruleMode}-${game.inning}-${game.p1Score}-${game.highRun}`;
      if (savedMatchSignatureRef.current !== sig) {
        savedMatchSignatureRef.current = sig;
        void submitScoreToPortal(game.p1Score);
      }
    }
  }, [
    game.isResultModalOpen,
    game.p1Score,
    game.ruleMode,
    game.inning,
    game.highRun,
    submitScoreToPortal,
  ]);

  // 키보드 컨트롤 및 부모 모달 키보드 릴레이 (`MINI_APP_MODAL_SEO_GUIDE.md` 준수)
  const handleKeyInput = useCallback(
    (key: string, code: string) => {
      if (showSplash || activeTab !== 'arena' || game.isResultModalOpen) return;
      if (game.isSimulating || (game.matchType === 'ai' && game.currentPlayer === 2)) return;

      if (key === 'ArrowLeft' || code === 'KeyA') {
        game.setAimAngleDeg((prev) => Number(((prev - 1 + 360) % 360).toFixed(1)));
      } else if (key === 'ArrowRight' || code === 'KeyD') {
        game.setAimAngleDeg((prev) => Number(((prev + 1) % 360).toFixed(1)));
      } else if (key === 'ArrowUp' || code === 'KeyW') {
        game.setPower((prev) => Math.min(100, prev + 3));
      } else if (key === 'ArrowDown' || code === 'KeyS') {
        game.setPower((prev) => Math.max(10, prev - 3));
      } else if (key === ' ' || code === 'Space' || key === 'Enter') {
        game.executeStroke();
      } else if (key === 'c' || key === 'C' || code === 'KeyC') {
        game.applyChalk();
      }
    },
    [showSplash, activeTab, game]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key) &&
        activeTab === 'arena' &&
        !game.isResultModalOpen
      ) {
        e.preventDefault();
      }
      handleKeyInput(e.key, e.code);
    };

    const onMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT' && e.data.eventType === 'keydown') {
        handleKeyInput(e.data.key, e.data.code);
      }
    };

    document.parentKeyboardCallback = (data) => {
      if (data.eventType === 'keydown') {
        handleKeyInput(data.key, data.code);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('message', onMessage);
      delete document.parentKeyboardCallback;
    };
  }, [handleKeyInput, activeTab, game.isResultModalOpen]);

  const buildShareText = useCallback(() => {
    const modeLabel = game.ruleMode === 'four-ball' ? '4구' : '3구(3쿠션)';
    return `🎱 [베라 당구 클럽] ${modeLabel} 매치 리포트\n• 득점: ${game.p1Score}점 (목표 ${game.targetScore}점)\n• 평균 애버리지(AVG): ${game.averagePerInning}\n• 하이런(High Run): ${game.highRun}연속 | 샷 정확도: ${game.accuracyPct}%\n지금 VeraNex에서 정통 캐롬 당구에 도전하세요!`;
  }, [
    game.ruleMode,
    game.p1Score,
    game.targetScore,
    game.averagePerInning,
    game.highRun,
    game.accuracyPct,
  ]);

  const handleCopyReport = useCallback(async () => {
    const text = `${buildShareText()}\n${window.location.href}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 경기 스탯 리포트가 클립보드에 복사되었습니다!');
    } catch {
      showToast('복사 권한을 확인할 수 없습니다.');
    }
  }, [buildShareText, showToast]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: '베라 당구 클럽 (Vera Billiards) - 4구·3쿠션 캐롬 당구',
      text: buildShareText(),
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // 사용자 취소 시 클립보드 복사로 대체
      }
    }
    await handleCopyReport();
  }, [buildShareText, handleCopyReport]);

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-slate-900">
        {/* 상단 네비게이션 헤더 */}
        <Header activeTab={activeTab} onSelectTab={setActiveTab} onShare={handleShare} />

        {/* 메인 반응형 컨테이너: 모바일 팝업(max-w-md) Zero-Scroll & 태블릿/PC(md:max-w-3xl lg:max-w-5xl) 2단 확장 */}
        <main className="flex-1 w-full max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-3 sm:px-4 pt-2 pb-4 flex flex-col gap-2">
          {activeTab === 'arena' && (
            <>
              {/* 1줄 압축 스코어보드 & 4구/3구 모드 전환 바 */}
              <ScoreboardBar
                ruleMode={game.ruleMode}
                matchType={game.matchType}
                aiDifficulty={game.aiDifficulty}
                targetScore={game.targetScore}
                currentPlayer={game.currentPlayer}
                p1Score={game.p1Score}
                p2Score={game.p2Score}
                inning={game.inning}
                highRun={game.highRun}
                liveCushionCount={game.liveCushionCount}
                onChangeRuleMode={(mode) => game.resetMatch(mode, game.matchType)}
                onChangeDifficulty={game.setAiDifficulty}
                onReset={() => {
                  setIsScoreSaved(false);
                  game.resetMatch();
                  showToast('🔄 새로운 당구 경기를 세팅했습니다.');
                }}
              />

              {/* 반응형 그리드: 모바일 1열(팝업 내 Zero-Scroll) / 태블릿·PC 2열 대시보드 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-start">
                {/* 좌측(모바일 메인): 당구대 캔버스 + 컴팩트 당점/파워/스트로크 컨트롤 */}
                <div className="md:col-span-7 flex flex-col gap-2">
                  <BilliardsCanvas
                    balls={game.balls}
                    activeCueBallId={game.activeCueBallId}
                    matchType={game.matchType}
                    isSimulating={game.isSimulating}
                    currentPlayer={game.currentPlayer}
                    aimAngleDeg={game.aimAngleDeg}
                    power={game.power}
                    spin={game.spin}
                    clothTheme={game.clothTheme}
                    aimPrediction={game.aimPrediction}
                    impactEffects={game.impactEffects}
                    lastShotResult={game.lastShotResult}
                    aiComment={game.aiComment}
                    onChangeAimAngle={game.setAimAngleDeg}
                  />

                  <CompactShotControls
                    isSimulating={game.isSimulating}
                    matchType={game.matchType}
                    currentPlayer={game.currentPlayer}
                    aimAngleDeg={game.aimAngleDeg}
                    power={game.power}
                    spin={game.spin}
                    chalkLevel={game.chalkLevel}
                    clothTheme={game.clothTheme}
                    activePresetId={game.activePresetId}
                    onChangeAimAngle={game.setAimAngleDeg}
                    onChangePower={game.setPower}
                    onChangeSpin={game.setSpin}
                    onApplyChalk={game.applyChalk}
                    onApplyPreset={(preset) => game.applyTrickShotPreset(preset)}
                    onExecuteStroke={() => game.executeStroke()}
                    onOpenReportModal={() => game.setIsResultModalOpen(true)}
                    onToggleClothTheme={() =>
                      game.setClothTheme((prev) =>
                        prev === 'royal-blue' ? 'emerald-green' : 'royal-blue'
                      )
                    }
                  />
                </div>

                {/* 우측(모바일 하단 고정 높이 피드 / 태블릿·PC 대시보드 확장 패널) */}
                <div className="md:col-span-5">
                  <DesktopDashboard
                    ruleMode={game.ruleMode}
                    matchType={game.matchType}
                    targetScore={game.targetScore}
                    requireThreeCushionFinish={game.requireThreeCushionFinish}
                    inning={game.inning}
                    highRun={game.highRun}
                    currentRun={game.currentRun}
                    accuracyPct={game.accuracyPct}
                    averagePerInning={game.averagePerInning}
                    spin={game.spin}
                    inningHistory={game.inningHistory}
                    onChangeMatchType={(mt) => game.resetMatch(game.ruleMode, mt)}
                    onChangeTargetScore={game.setTargetScore}
                    onToggleThreeCushionFinish={() =>
                      game.setRequireThreeCushionFinish((prev) => !prev)
                    }
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'howto' && <HowToTab />}

          {activeTab === 'faq' && <FaqTab />}

          {/* 하단 광고 배너 슬롯 */}
          <BannerSlot compact />
        </main>

        {/* 미니멀 푸터 (`rule.md` #11 & `miniapp.md` v3.0 준수: VeraNex 표기) */}
        <footer className="py-3 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-[#FAF8F5]">
          © 2026 VeraNex. All rights reserved.
        </footer>

        {/* 경기 종료 / 스탯 리포트 모달 (`data-screenshot-point="result"`) */}
        {game.isResultModalOpen && (
          <MatchResultModal
            ruleMode={game.ruleMode}
            p1Score={game.p1Score}
            p2Score={game.p2Score}
            targetScore={game.targetScore}
            inning={game.inning}
            highRun={game.highRun}
            accuracyPct={game.accuracyPct}
            averagePerInning={game.averagePerInning}
            winner={game.winner}
            isScoreSaved={isScoreSaved}
            onClose={() => game.setIsResultModalOpen(false)}
            onRestart={() => {
              setIsScoreSaved(false);
              game.resetMatch();
            }}
            onCopyReport={handleCopyReport}
            onShare={handleShare}
          />
        )}

        {/* 토스트 알림 */}
        {toastMessage && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-slate-900/95 text-white text-xs font-bold shadow-xl border border-slate-700 animate-bounce">
            {toastMessage}
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
