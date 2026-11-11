import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSubmarineGame } from './hooks/useSubmarineGame';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SplashScreen } from './components/SplashScreen';
import { Header, SubmarineTab } from './components/Header';
import { SubmarineGrid } from './components/SubmarineGrid';
import { FleetStatusPanel } from './components/FleetStatusPanel';
import { BattleLog } from './components/BattleLog';
import { SubmarineResultModal } from './components/SubmarineResultModal';
import { SubmarineLeaderboard } from './components/SubmarineLeaderboard';
import { SubmarineGuide } from './components/SubmarineGuide';
import { BannerSlot } from './components/BannerSlot';
import { DifficultyLevel, SubmarineProfile } from './types/submarine';

axios.defaults.withCredentials = true;

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<SubmarineTab>('battle');
  const [mobileViewMode, setMobileViewMode] = useState<'targeting' | 'radar'>('targeting');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isMember, setIsMember] = useState(false);
  const [profile, setProfile] = useState<SubmarineProfile>({
    fleetName: '베라 제독전대',
    rating: 1200,
    wins: 0,
    losses: 0,
    bestTurns: 0,
    totalMatches: 0,
    hitRate: 0,
  });
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [savedRecordInfo, setSavedRecordInfo] = useState<{
    rating?: number;
    ratingDelta?: number;
    earnedPoints?: number;
    saved: boolean;
  } | null>(null);
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  // 함대명 변경 모달 상태
  const [isFleetModalOpen, setIsFleetModalOpen] = useState(false);
  const [newFleetName, setNewFleetName] = useState('베라 제독전대');
  const [isSubmittingFleetName, setIsSubmittingFleetName] = useState(false);

  const game = useSubmarineGame();
  const reportedRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // 제독 프로필 조회
  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get<{
        success: boolean;
        isMember: boolean;
        profile: {
          fleetName: string;
          wins: number;
          losses: number;
          bestTurns: number;
          totalMatches: number;
          rating: number;
        };
      }>('/api/games/submarine/profile');
      if (res.data?.success) {
        setIsMember(Boolean(res.data.isMember));
        if (res.data.profile) {
          setProfile((prev) => ({
            ...prev,
            fleetName: res.data.profile.fleetName || '베라 제독전대',
            wins: Number(res.data.profile.wins) || 0,
            losses: Number(res.data.profile.losses) || 0,
            bestTurns: Number(res.data.profile.bestTurns) || 0,
            totalMatches: Number(res.data.profile.totalMatches) || 0,
            rating: Number(res.data.profile.rating) || 1200,
          }));
          setNewFleetName(res.data.profile.fleetName || '베라 제독전대');
        }
      }
    } catch (_err) {
      setIsMember(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 턴 전환 시 모바일 뷰 자동 포커스 (아군 턴: 타겟 조준 / 적 턴: 아군 방어 레이더)
  useEffect(() => {
    if (game.turn === 'player') {
      setMobileViewMode('targeting');
    } else {
      setMobileViewMode('radar');
    }
  }, [game.turn]);

  // 게임 종료(victory / defeat) 시 자동으로 점수 및 전적 서버 기록
  useEffect(() => {
    if (
      (game.gamePhase === 'victory' || game.gamePhase === 'defeat') &&
      !reportedRef.current
    ) {
      reportedRef.current = true;
      const isVictory = game.gamePhase === 'victory';
      const totalShots = game.playerHits + game.playerMisses;
      const accuracy = totalShots > 0 ? Math.round((game.playerHits / totalShots) * 100) : 0;
      const ratingScore = isVictory
        ? Math.max(1200, 3000 - game.turnCount * 45 + accuracy * 10)
        : 850;

      setIsSavingRecord(true);
      axios
        .post('/api/games/submarine/record', {
          isVictory,
          won: isVictory,
          turns: game.turnCount,
          accuracy,
          score: ratingScore,
          difficulty: game.difficulty,
        })
        .then((res) => {
          const data = res.data;
          if (data?.isMember && data?.profile) {
            setIsMember(true);
            setProfile((prev) => ({
              ...prev,
              fleetName: data.profile.fleetName || prev.fleetName,
              wins: Number(data.profile.wins) || 0,
              losses: Number(data.profile.losses) || 0,
              bestTurns: Number(data.profile.bestTurns) || 0,
              totalMatches: Number(data.profile.totalMatches) || 0,
              rating: Number(data.profile.rating) || prev.rating,
              hitRate: accuracy,
            }));
            setSavedRecordInfo({
              saved: true,
              rating: data.rating,
              ratingDelta: data.ratingDelta,
              earnedPoints: data.earnedPoints,
            });
          } else {
            // 게스트 로컬 세션 전적 반영
            setProfile((prev) => {
              const nextWins = prev.wins + (isVictory ? 1 : 0);
              const nextLosses = prev.losses + (isVictory ? 0 : 1);
              const nextBestTurns = isVictory
                ? prev.bestTurns === 0
                  ? game.turnCount
                  : Math.min(prev.bestTurns, game.turnCount)
                : prev.bestTurns;
              const delta = isVictory ? Math.max(15, 50 - game.turnCount) : -15;
              return {
                ...prev,
                wins: nextWins,
                losses: nextLosses,
                bestTurns: nextBestTurns,
                totalMatches: prev.totalMatches + 1,
                rating: Math.max(800, prev.rating + delta),
                hitRate: accuracy,
              };
            });
            setSavedRecordInfo({
              saved: false,
            });
          }
          setLeaderboardRefreshKey((k) => k + 1);

          // 부모/오프너 포털 창 리더보드 실시간 갱신 알림
          try {
            window.opener?.postMessage({ type: 'GAME_SCORE_UPDATED', gameId: 'submarine' }, '*');
          } catch (_e) {}
          try {
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({ type: 'GAME_SCORE_UPDATED', gameId: 'submarine' }, '*');
            }
          } catch (_e) {}
        })
        .catch((err) => {
          console.error('[Submarine] Record save error:', err);
          setSavedRecordInfo({ saved: false });
        })
        .finally(() => {
          setIsSavingRecord(false);
        });
    } else if (game.gamePhase === 'battle') {
      reportedRef.current = false;
      setSavedRecordInfo(null);
    }
  }, [
    game.gamePhase,
    game.turnCount,
    game.playerHits,
    game.playerMisses,
    game.difficulty,
  ]);

  const handleOpenFleetModal = useCallback(() => {
    if (!isMember) {
      showToast('로그인 회원만 함대명을 변경하여 명예의 전당에 등록할 수 있습니다.');
      return;
    }
    setNewFleetName(profile.fleetName);
    setIsFleetModalOpen(true);
  }, [isMember, profile.fleetName, showToast]);

  const handleSaveFleetName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFleetName.trim();
    if (trimmed.length < 2 || trimmed.length > 15) {
      showToast('함대명은 2자 이상 15자 이내로 입력해주세요.');
      return;
    }
    setIsSubmittingFleetName(true);
    try {
      const res = await axios.put<{ success: boolean; fleetName: string }>(
        '/api/games/submarine/fleet-name',
        { fleetName: trimmed }
      );
      if (res.data?.success) {
        setProfile((prev) => ({ ...prev, fleetName: res.data.fleetName }));
        setIsFleetModalOpen(false);
        setLeaderboardRefreshKey((k) => k + 1);
        showToast(`⚓ 함대명이 '${res.data.fleetName}'(으)로 변경되었습니다!`);
      } else {
        showToast('함대명 변경에 실패했습니다.');
      }
    } catch (_err) {
      showToast('함대명 변경 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingFleetName(false);
    }
  };

  const handleShare = useCallback(async () => {
    const shareData = {
      title: '베라 서브마린 🌊 | 10x10 종이 좌표 해전',
      text: '적 잠수함과 정예 함대를 격침하라! 1930년대 원작 살보 룰의 짜릿한 연속 공격 두뇌 추리 게임.',
      url: window.location.href,
    };
    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showToast('작전 링크를 공유했습니다!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('작전 좌표 링크가 복사되었습니다!');
      }
    } catch (_err) {
      showToast('공유 기능을 실행할 수 없습니다.');
    }
  }, [showToast]);

  return (
    <ErrorBoundary>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="w-full min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col justify-between py-2 sm:py-4 px-3 sm:px-4">
        <div className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto flex-1 flex flex-col">
          {/* VeraNex 공식 통일 헤더 */}
          <Header
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            isMuted={game.isMuted}
            onToggleMute={game.toggleMute}
            onShare={handleShare}
          />

          {/* 토스트 알림창 */}
          {toastMessage && (
            <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-xs animate-fade-in flex items-center gap-1.5">
              <i className="fas fa-circle-info text-cyan-400"></i>
              <span>{toastMessage}</span>
            </div>
          )}

          {/* 1. 메인 전투 탭 */}
          {activeTab === 'battle' && (
            <main className="flex-1 flex flex-col space-y-2">
              {/* 상단 통합 전황 컨트롤러 (턴 알림, 연속 보너스 배지, 소나 스킬, 실시간 작전 해설) */}
              <div className="bg-white rounded-2xl p-2.5 sm:p-3 border border-[#EBE6DD] shadow-2xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  {/* 턴 및 보너스 표시 */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-300 ${
                        game.turn === 'player'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white animate-pulse'
                      }`}
                    >
                      <i className={`fas ${game.turn === 'player' ? 'fa-crosshairs' : 'fa-radar'}`}></i>
                      <span>{game.turn === 'player' ? '🎯 아군 사격 턴' : '🚨 적군 AI 교전 중'}</span>
                    </div>

                    <span className="text-[11px] font-mono font-bold text-[#8C8479] hidden sm:inline-block">
                      Turn #{game.turnCount}
                    </span>

                    {game.consecutiveHits > 1 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-black animate-bounce flex items-center gap-1">
                        <i className="fas fa-fire text-amber-600"></i>
                        <span>연속 {game.consecutiveHits}회 명중!</span>
                      </span>
                    )}
                  </div>

                  {/* 소나 정찰 버튼 & 난이도 선택기 */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={game.toggleSonarMode}
                      disabled={game.sonarCharges <= 0 || game.turn !== 'player' || game.isTurnTransitioning}
                      data-screenshot-point="action"
                      className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer ${
                        game.isSonarActive
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 animate-pulse'
                          : game.sonarCharges > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                      }`}
                      title="게임당 1회, 3x3 영역 내 적함 신호를 스캔합니다."
                    >
                      <i className="fas fa-satellite-dish"></i>
                      <span>소나 ({game.sonarCharges})</span>
                    </button>

                    <select
                      value={game.difficulty}
                      onChange={(e) => game.setDifficulty(e.target.value as DifficultyLevel)}
                      className="text-[11px] font-bold bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl px-2 py-1 text-[#2D2A26] focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                      <option value="recruit">훈련병 AI</option>
                      <option value="captain">함장 AI</option>
                      <option value="admiral">제독 AI</option>
                    </select>

                    <button
                      type="button"
                      onClick={game.initGame}
                      className="w-7 h-7 rounded-xl bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#EBE6DD] text-[#7A756D] flex items-center justify-center transition-colors cursor-pointer"
                      title="함대 재배치 및 새 게임"
                    >
                      <i className="fas fa-rotate text-xs"></i>
                    </button>
                  </div>
                </div>

                {/* 실시간 턴 해설 내러티브 배너 */}
                <div
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                    game.turn === 'player'
                      ? 'bg-indigo-50/70 border border-indigo-100 text-indigo-950'
                      : 'bg-rose-50 border border-rose-200 text-rose-950 animate-pulse'
                  }`}
                >
                  <i
                    className={`fas ${
                      game.turn === 'player'
                        ? 'fa-circle-dot text-indigo-600'
                        : 'fa-triangle-exclamation text-rose-600'
                    } text-[11px]`}
                  ></i>
                  <span className="truncate">{game.turnNarrative}</span>
                </div>

                {/* 내 함대 전적 요약 바 */}
                <div className="flex items-center justify-between pt-1.5 border-t border-[#F2EDE4] text-[11px]">
                  <button
                    type="button"
                    onClick={handleOpenFleetModal}
                    className="flex items-center gap-1.5 font-black text-[#2D2A26] hover:text-indigo-600 transition-colors cursor-pointer"
                    title="함대명 변경"
                  >
                    <i className="fas fa-anchor text-indigo-600 text-[10px]"></i>
                    <span className="truncate max-w-[140px] sm:max-w-[200px]">{profile.fleetName}</span>
                    {isMember && <i className="fas fa-pen text-[9px] text-[#8C8479]"></i>}
                  </button>
                  <div className="flex items-center gap-2 font-mono font-bold text-[#7A756D]">
                    <span>
                      <strong className="text-indigo-700">{profile.wins}</strong>승{' '}
                      <strong className="text-rose-600">{profile.losses}</strong>패
                    </span>
                    {profile.bestTurns > 0 && (
                      <span className="hidden sm:inline text-[#8C8479]">· 최소 {profile.bestTurns}턴</span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-black">
                      {profile.rating.toLocaleString()}P
                    </span>
                  </div>
                </div>
              </div>

              {/* 모바일 화면 뷰 모드 탭 (타겟 사격 vs 아군 레이더 - 턴에 따라 자동 전환) */}
              <div className="md:hidden flex items-center bg-[#F2EDE4] p-1 rounded-xl gap-1 text-xs font-bold border border-[#E5DEC9]">
                <button
                  type="button"
                  onClick={() => setMobileViewMode('targeting')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileViewMode === 'targeting'
                      ? 'bg-white text-indigo-700 font-black shadow-2xs'
                      : 'text-[#7A7369]'
                  }`}
                >
                  <i className="fas fa-crosshairs"></i>
                  <span>적 해역 사격 조준</span>
                  {game.turn === 'player' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileViewMode('radar')}
                  className={`flex-1 py-1.5 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileViewMode === 'radar'
                      ? 'bg-white text-indigo-700 font-black shadow-2xs'
                      : 'text-[#7A7369]'
                  }`}
                >
                  <i className="fas fa-shield"></i>
                  <span>아군 기동 레이더</span>
                  {game.turn === 'ai' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                  )}
                </button>
              </div>

              {/* 그리드 및 전황 대시보드 (PC/태블릿: 2열 반응형 자동 확장) */}
              <div className="w-full md:grid md:grid-cols-12 md:gap-4 md:items-start flex-1">
                {/* 좌측 컬럼 (PC): 아군 레이더 및 교전 일지 & 함대 패널 */}
                <div className={`space-y-2 md:col-span-5 ${mobileViewMode === 'radar' ? 'block' : 'hidden md:block'}`}>
                  <div className="bg-white rounded-2xl p-2 sm:p-2.5 border border-[#EBE6DD] shadow-2xs flex flex-col items-center">
                    <div className="w-full flex items-center justify-between text-xs font-black text-[#2D2A26] px-1 mb-1.5">
                      <span className="flex items-center gap-1.5 text-indigo-700 font-extrabold">
                        <i className="fas fa-shield"></i>
                        <span>아군 기동 작전 해역</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#8C8479] flex items-center gap-1">
                        {game.aiAimingTarget ? (
                          <span className="text-rose-600 font-black animate-pulse">🚨 적 조준 감지!</span>
                        ) : (
                          <span>수심 920M</span>
                        )}
                      </span>
                    </div>
                    <SubmarineGrid
                      mode="radar"
                      grid={game.playerGrid}
                      fleet={game.playerFleet}
                      aimingCoord={game.aiAimingTarget}
                      activeMissile={game.activeMissileStrike}
                      disabled
                    />
                  </div>

                  <FleetStatusPanel playerFleet={game.playerFleet} aiFleet={game.aiFleet} />
                  <BattleLog logs={game.battleLogs} />
                </div>

                {/* 우측 컬럼 (PC) / 메인 컬럼 (모바일): 적 해역 10x10 사격 그리드 */}
                <div className={`space-y-2 md:col-span-7 ${mobileViewMode === 'targeting' ? 'block' : 'hidden md:block'}`}>
                  <div className="bg-white rounded-2xl p-2 sm:p-3 border border-[#EBE6DD] shadow-2xs flex flex-col items-center relative">
                    <div className="w-full flex items-center justify-between text-xs font-black text-[#2D2A26] px-1 mb-1.5">
                      <span className="flex items-center gap-1.5 text-rose-600 font-extrabold">
                        <i className="fas fa-crosshairs"></i>
                        <span>적 함대 초계 해역</span>
                      </span>
                      <span className="text-[10px] font-mono text-[#8C8479] flex items-center gap-1">
                        <i className="fas fa-water text-cyan-600"></i>
                        <span>{game.isSonarActive ? '소나 탐지 모드' : '수심 1,450M'}</span>
                      </span>
                    </div>

                    <SubmarineGrid
                      mode="targeting"
                      grid={game.aiGrid}
                      onCellClick={game.fireTorpedo}
                      disabled={game.turn !== 'player' || game.isAiThinking || game.isTurnTransitioning}
                      isSonarActive={game.isSonarActive}
                      activeMissile={game.activeMissileStrike}
                    />

                    {/* 모바일 뷰일 때만 아래에 간소화 함대 상태 패널 노출 */}
                    <div className="w-full md:hidden mt-2">
                      <FleetStatusPanel playerFleet={game.playerFleet} aiFleet={game.aiFleet} />
                    </div>
                  </div>

                  {/* 모바일 뷰일 때 하단에 로그 배치 */}
                  <div className="md:hidden">
                    <BattleLog logs={game.battleLogs} />
                  </div>
                </div>
              </div>
            </main>
          )}

          {/* 2. 명예의 전당 탭 */}
          {activeTab === 'leaderboard' && (
            <main className="flex-1">
              <SubmarineLeaderboard
                refreshKey={leaderboardRefreshKey}
                profile={profile}
                isMember={isMember}
                onEditFleetName={handleOpenFleetModal}
              />
            </main>
          )}

          {/* 3. 작전 지침서 탭 */}
          {activeTab === 'guide' && (
            <main className="flex-1">
              <SubmarineGuide />
            </main>
          )}

          {/* 함대명 변경 모달 */}
          {isFleetModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
              <form
                onSubmit={handleSaveFleetName}
                className="w-full max-w-xs bg-white rounded-3xl p-5 border-2 border-[#EBE6DD] shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#2D2A26] flex items-center gap-1.5">
                    <i className="fas fa-anchor text-indigo-600"></i>
                    <span>기동함대 명칭 변경</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsFleetModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    <i className="fas fa-xmark"></i>
                  </button>
                </div>
                <p className="text-[11px] text-[#7A756D]">
                  명예의 전당 랭킹에 등재될 공식 함대명을 입력하세요 (2~15자).
                </p>
                <input
                  type="text"
                  value={newFleetName}
                  onChange={(e) => setNewFleetName(e.target.value)}
                  maxLength={15}
                  placeholder="예: 베라 기동전대"
                  className="w-full px-3 py-2 rounded-xl border border-[#EBE6DD] bg-[#FAF8F5] text-xs font-bold text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFleetModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-[#FAF8F5] text-[#7A756D] border border-[#EBE6DD] text-xs font-bold cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingFleetName}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingFleetName ? '저장 중...' : '확정'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 결과 모달 */}
          <SubmarineResultModal
            isOpen={game.isResultModalOpen}
            gamePhase={game.gamePhase}
            turnCount={game.turnCount}
            playerHits={game.playerHits}
            playerMisses={game.playerMisses}
            isMember={isMember}
            isSavingRecord={isSavingRecord}
            savedRecordInfo={savedRecordInfo}
            onRestart={game.initGame}
            onViewLeaderboard={() => {
              game.initGame();
              setActiveTab('leaderboard');
            }}
            onShare={handleShare}
          />
        </div>

        {/* 하단 스폰서 광고 슬롯 */}
        <footer className="w-full max-w-[450px] md:max-w-3xl lg:max-w-5xl mx-auto mt-2 shrink-0">
          <BannerSlot minHeight="min-h-[48px]" label="VERANEX NAVAL AD" />
        </footer>
      </div>
    </ErrorBoundary>
  );
}
