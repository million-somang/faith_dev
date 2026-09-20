import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Share2, Trophy, BookOpen, Play, VolumeX } from 'lucide-react';
import { TeamProfile } from './types/baseball';
import { useBaseballGame } from './hooks/useBaseballGame';
import ScoreboardHeader from './components/ScoreboardHeader';
import BaseballDiamond from './components/BaseballDiamond';
import { InningHistory } from './components/InningHistory';
import { BaseballKeypad } from './components/BaseballKeypad';
import { LeagueLeaderboard } from './components/LeagueLeaderboard';
import { BaseballGuide } from './components/BaseballGuide';
import { GameResultModal } from './components/GameResultModal';

export default function App() {
  // 스플래시 인트로 화면 (miniapp.md 4초 프로그레스 기준)
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);

  // 탭 상태: 'stadium' | 'leaderboard' | 'guide'
  const [activeTab, setActiveTab] = useState<'stadium' | 'leaderboard' | 'guide'>('stadium');

  // 회원 여부 및 구단 프로필
  const [isMember, setIsMember] = useState(false);
  const [profile, setProfile] = useState<TeamProfile>({
    teamName: '베라 마린스',
    wins: 0,
    losses: 0,
    shutouts: 0,
    totalInnings: 0,
    winRate: 0,
  });

  // 토스트 메시지
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // 야구 게임 훅
  const game = useBaseballGame();
  const reportedRef = useRef(false);

  // 프로필 조회
  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get<{
        success: boolean;
        isMember: boolean;
        profile: TeamProfile;
      }>('/api/games/baseball/profile');
      if (res.data.success) {
        setIsMember(res.data.isMember);
        if (res.data.profile) {
          setProfile(res.data.profile);
        }
      }
    } catch (_err) {
      // 게스트 모드 유지
      setIsMember(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 스플래시 4초 타이머 & 프로그레스
  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setSplashProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setShowSplash(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // 경기 종료 시 전적 전송 (회원만)
  useEffect(() => {
    if ((game.status === 'WON' || game.status === 'LOST') && !reportedRef.current) {
      reportedRef.current = true;
      const isWon = game.status === 'WON';
      const isShutout = game.badge === 'SHUTOUT';

      if (isMember) {
        axios
          .post('/api/games/baseball/record', {
            won: isWon,
            innings: game.currentInning,
            isShutout,
          })
          .then(() => {
            fetchProfile();
          })
          .catch((err) => console.error('Failed to submit baseball record', err));
      } else {
        // 비회원 로컬 세션 전적 갱신
        setProfile((prev) => {
          const newWins = isWon ? prev.wins + 1 : prev.wins;
          const newLosses = !isWon ? prev.losses + 1 : prev.losses;
          const newShutouts = isShutout ? prev.shutouts + 1 : prev.shutouts;
          const newTotalInnings = prev.totalInnings + game.currentInning;
          const totalGames = newWins + newLosses;
          const newWinRate = totalGames > 0 ? (newWins / totalGames) * 100 : 0;
          return {
            ...prev,
            wins: newWins,
            losses: newLosses,
            shutouts: newShutouts,
            totalInnings: newTotalInnings,
            winRate: newWinRate,
          };
        });
      }
    } else if (game.status === 'PLAYING') {
      reportedRef.current = false;
    }
  }, [game.status, game.badge, game.currentInning, isMember, fetchProfile]);

  // 구단명 수정
  const handleUpdateTeamName = async (newName: string): Promise<boolean> => {
    try {
      const res = await axios.put<{ success: boolean; teamName: string }>(
        '/api/games/baseball/team-name',
        { teamName: newName }
      );
      if (res.data.success) {
        setProfile((prev) => ({ ...prev, teamName: res.data.teamName }));
        return true;
      }
      return false;
    } catch (_err) {
      return false;
    }
  };

  // 공유하기 기능 (Web Share API 및 클립보드 복사 폴백)
  const handleShare = async () => {
    const shareData = {
      title: '베라 숫자야구 ⚾',
      text: `[${profile.teamName}] 9이닝 정규 숫자야구 리그에 도전해보세요! 전광판 랭킹 1위는 누구?`,
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        showToast('⚾ 야구 리그 링크를 공유했습니다!');
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('📋 링크가 클립보드에 복사되었습니다!');
      }
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast('📋 링크가 클립보드에 복사되었습니다!');
        } catch (_copyErr) {
          showToast('공유 기능을 실행할 수 없습니다.');
        }
      }
    }
  };

  // 스플래시 인트로 화면
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-50 bg-[#f0f4f8] flex flex-col items-center justify-between p-6 select-none font-sans">
        <div className="w-full text-center mt-8">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-200/60 px-2.5 py-1 rounded-full">
            VeraNex Sports Series
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-24 h-24 rounded-3xl bg-[#f0f4f8] shadow-[10px_10px_20px_#d1d9e6,-10px_-10px_20px_#ffffff] border border-white flex items-center justify-center text-5xl">
            ⚾
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              베라 숫자야구
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              9이닝 정규 리그 &amp; 랭킹전
            </p>
          </div>
        </div>

        {/* 하단 프로그레스 바 & 공식 후원사 슬롯 */}
        <div className="w-full max-w-xs space-y-3 mb-6">
          <div className="flex justify-between text-xs font-mono font-bold text-slate-500">
            <span>STADIUM LOADING...</span>
            <span>{splashProgress}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-200/80 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-75 rounded-full"
              style={{ width: `${splashProgress}%` }}
            />
          </div>
          <div className="text-center pt-2">
            <span className="text-[10px] font-bold text-slate-400">
              공식 후원: VeraNex Sports &amp; League
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 최근 이닝 판정
  const lastRecord = game.history[game.history.length - 1];
  const lastStrikes = lastRecord ? lastRecord.strikes : 0;
  const lastBalls = lastRecord ? lastRecord.balls : 0;
  const lastIsOut = lastRecord ? lastRecord.isOut : false;

  return (
    <div className="min-h-screen bg-[#e8eef5] flex justify-center items-center py-0 sm:py-4 selection:bg-amber-400 selection:text-slate-900 font-sans">
      {/* 450px x 850px 표준 모바일 컨테이너 */}
      <main className="w-full max-w-[450px] min-h-[850px] bg-[#f0f4f8] shadow-2xl rounded-none sm:rounded-3xl border border-white/80 flex flex-col justify-between p-3.5 relative overflow-hidden">
        {/* 토스트 팝업 */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/90 text-white text-xs font-bold rounded-2xl shadow-xl backdrop-blur-xs flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2">
            <span>⚾</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 상단 헤더 바 (앱 타이틀, 볼륨 음소거 표시, 공유 버튼) */}
        <header className="flex items-center justify-between px-1 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚾</span>
            <div>
              <h1 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                베라 숫자야구
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-200 text-slate-600 font-bold">
                  9 INNINGS
                </span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 무음 표시 (소리 항상 제거 규칙 준수) */}
            <div
              className="w-8 h-8 rounded-xl bg-[#f0f4f8] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] text-slate-400 flex items-center justify-center text-xs"
              title="사운드 음소거 모드"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </div>

            {/* 공유하기 버튼 */}
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-xl bg-[#f0f4f8] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[1px_1px_3px_#d1d9e6,-1px_-1px_3px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              title="친구에게 공유"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* 3-탭 선택 바 (경기장 / 랭킹전 / 경기 룰) */}
        <nav className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-2xl mb-2.5">
          <button
            onClick={() => setActiveTab('stadium')}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'stadium'
                ? 'bg-[#f0f4f8] text-slate-900 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Play className="w-3 h-3" />
            <span>경기장</span>
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#f0f4f8] text-slate-900 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>랭킹전</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-[#f0f4f8] text-slate-900 shadow-[3px_3px_6px_#cbd5e1,-3px_-3px_6px_#ffffff]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-3 h-3 text-blue-500" />
            <span>룰 북</span>
          </button>
        </nav>

        {/* 탭별 메인 컨텐츠 영역 (균형 잡힌 전체 높이 구성) */}
        <div className="flex-1 flex flex-col justify-between">
          {activeTab === 'stadium' && (
            <div className="flex-1 flex flex-col justify-between gap-2.5">
              {/* 전광판 헤더 */}
              <ScoreboardHeader
                isMember={isMember}
                profile={profile}
                currentInning={game.currentInning}
                lastStrikes={lastStrikes}
                lastBalls={lastBalls}
                lastIsOut={lastIsOut}
                onUpdateTeamName={handleUpdateTeamName}
                showToast={showToast}
              />

              {/* 다이아몬드 구장 SVG 캔버스 */}
              <BaseballDiamond
                runners={game.runners}
                isPitching={game.isPitching}
                pitchEffect={game.pitchEffect}
                inputDigits={game.inputDigits}
              />

              {/* 이닝별 투구 기록 테이블 */}
              <InningHistory
                history={game.history}
                currentInning={game.currentInning}
              />

              {/* 하단 투구 키패드 */}
              <BaseballKeypad
                inputDigits={game.inputDigits}
                disabled={game.status !== 'PLAYING' || game.isPitching}
                onPushDigit={game.pushDigit}
                onDeleteDigit={game.deleteDigit}
                onClearDigits={game.clearDigits}
                onPitch={game.pitch}
              />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div className="flex-1 flex flex-col justify-start">
              <LeagueLeaderboard isMember={isMember} profile={profile} />
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="flex-1 flex flex-col justify-start">
              <BaseballGuide />
            </div>
          )}
        </div>

        {/* 경기 결과 모달 (승리 / 패배) */}
        <GameResultModal
          status={game.status}
          badge={game.badge}
          secret={game.secret}
          inningsTaken={game.currentInning}
          isMember={isMember}
          onRestart={game.startNewGame}
        />
      </main>
    </div>
  );
}
