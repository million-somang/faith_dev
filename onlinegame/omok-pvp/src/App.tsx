import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import { 
  Users, Globe, Trophy, Shield, Play, Plus, Key, ArrowLeft, 
  MessageSquare, Volume2, VolumeX, Clock, Wifi, RefreshCw, Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Board, Cell, OnlineRoom, Player, PlayerProfile, Point, WinningLine } from './types/omok';
import { playStoneSound, playWinSound } from './utils/soundEffects';

const BOARD_SIZE = 15;
const STAR_POINTS: Point[] = [
  { r: 3, c: 3 }, { r: 3, c: 11 }, { r: 7, c: 7 }, { r: 11, c: 3 }, { r: 11, c: 11 }
];

const INITIAL_ROOMS: OnlineRoom[] = [
  { id: '101', title: '초보자 환영 1:1 대국실', hostName: '바둑왕초보', hostRating: 1150, playerCount: 1, isPrivate: false },
  { id: '102', title: '레이팅 1200+ 진검승부', hostName: '오목마스터99', hostRating: 1280, playerCount: 1, isPrivate: false },
  { id: '103', title: '친구 대기방 (코드 대전)', hostName: '베라플레이어', hostRating: 1220, playerCount: 1, isPrivate: true },
];

export default function App() {
  const [viewMode, setViewMode] = useState<'LOBBY' | 'MATCHING' | 'GAME'>('LOBBY');
  const [myProfile] = useState<PlayerProfile>({
    name: '베라플레이어',
    rating: 1240,
    tier: '골드 II',
    wins: 14,
    losses: 8,
  });

  const [rooms, setRooms] = useState<OnlineRoom[]>(INITIAL_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(null);
  const [opponentName, setOpponentName] = useState<string>('상대 대기중');
  const [opponentRating, setOpponentRating] = useState<number>(1200);

  // 게임 상태
  const [board, setBoard] = useState<Board>(() => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
  const [myStone, setMyStone] = useState<Player>('BLACK');
  const [currentTurn, setCurrentTurn] = useState<Player>('BLACK');
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  // 턴 타이머
  const timerRef = useRef<number | null>(null);
  useEffect(() => {
    if (viewMode === 'GAME' && !gameResult) {
      setTurnTimer(30);
      timerRef.current = window.setInterval(() => {
        setTurnTimer(t => {
          if (t <= 1) {
            // 타임아웃
            return 30;
          }
          return t - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, currentTurn, gameResult]);

  // 승리 판정
  const checkWin = useCallback((b: Board): WinningLine | null => {
    const DIRS: [number, number][] = [[0, 1], [1, 0], [1, 1], [-1, 1]];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const stone = b[r][c];
        if (!stone) continue;
        for (const [dr, dc] of DIRS) {
          let count = 1;
          const points: Point[] = [{ r, c }];
          for (let step = 1; step < 5; step++) {
            const nr = r + dr * step;
            const nc = c + dc * step;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && b[nr][nc] === stone) {
              count++;
              points.push({ r: nr, c: nc });
            } else break;
          }
          if (count >= 5) {
            return { start: points[0], end: points[points.length - 1], points };
          }
        }
      }
    }
    return null;
  }, []);

  // 착수
  const handleCellClick = useCallback((r: number, c: number) => {
    if (viewMode !== 'GAME' || gameResult || board[r][c] !== null) return;
    if (currentTurn !== myStone) return;

    playStoneSound(isMuted);

    const next = board.map(row => [...row]);
    next[r][c] = myStone;
    setBoard(next);
    setLastMove({ r, c });

    const win = checkWin(next);
    if (win) {
      setWinningLine(win);
      setGameResult('WIN');
      playWinSound(isMuted);
      try {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      } catch {}
      return;
    }

    // 턴 전환 (상대방 온라인 차례 시뮬레이션 응수)
    const opponentStone: Player = myStone === 'BLACK' ? 'WHITE' : 'BLACK';
    setCurrentTurn(opponentStone);

    // 온라인 상대방 응수 모의 네트워크 지연 (1~2초)
    setTimeout(() => {
      // 상대 착수: 내 돌 인근 빈자리 탐색
      let found: Point | null = null;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE && next[nr][nc] === null) {
            found = { r: nr, c: nc };
            break;
          }
        }
        if (found) break;
      }
      if (!found) found = { r: 7, c: 7 };

      const oppBoard = next.map(row => [...row]);
      oppBoard[found.r][found.c] = opponentStone;
      playStoneSound(isMuted);
      setBoard(oppBoard);
      setLastMove(found);

      const oppWin = checkWin(oppBoard);
      if (oppWin) {
        setWinningLine(oppWin);
        setGameResult('LOSS');
      } else {
        setCurrentTurn(myStone);
      }
    }, 1200);
  }, [board, checkWin, currentTurn, gameResult, isMuted, myStone, viewMode]);

  // 방 입장 / 게임 시작
  const startOnlineGame = (room: OnlineRoom) => {
    setCurrentRoom(room);
    setOpponentName(room.hostName);
    setOpponentRating(room.hostRating);
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
    setMyStone('BLACK');
    setCurrentTurn('BLACK');
    setLastMove(null);
    setWinningLine(null);
    setGameResult(null);
    setViewMode('GAME');
  };

  // 빠른 매칭 시작
  const handleQuickMatch = () => {
    setViewMode('MATCHING');
    setTimeout(() => {
      const matchRoom: OnlineRoom = {
        id: '999',
        title: '실시간 빠른 1:1 대전',
        hostName: '고수도전자',
        hostRating: 1260,
        playerCount: 2,
        isPrivate: false,
      };
      startOnlineGame(matchRoom);
    }, 2000);
  };

  // 채팅 매크로
  const sendQuickChat = (msg: string) => {
    setChatMessage(`나: "${msg}"`);
    setTimeout(() => setChatMessage(null), 3000);
  };

  return (
    <MiniAppLayout title="베라오목 온라인">
      <main className="w-full max-w-[450px] min-h-[850px] mx-auto bg-slate-50 flex flex-col justify-between shadow-2xl relative select-none overflow-hidden font-sans">
        
        {/* =========================================================================
            상태 1: LOBBY (온라인 대기실 및 방 목록)
           ========================================================================= */}
        {viewMode === 'LOBBY' && (
          <div className="flex-1 flex flex-col justify-between p-4 animate-fade-in">
            {/* 상단 프로필 바 */}
            <div>
              <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    {myProfile.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-sm">{myProfile.name}</span>
                      <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        {myProfile.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>레이팅 <strong>{myProfile.rating} LP</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>{myProfile.wins}승 {myProfile.losses}패</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Wifi className="w-3.5 h-3.5" />
                  <span>온라인</span>
                </div>
              </div>

              {/* 빠른 1:1 매칭 CTA 카드 */}
              <button
                onClick={handleQuickMatch}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all group active:scale-[0.99] mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                    <Play className="w-5 h-5 fill-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-black text-base flex items-center gap-1.5">
                      <span>빠른 1:1 매칭 시작</span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">실시간 자동 매칭</span>
                    </div>
                    <div className="text-xs text-blue-100">비슷한 실력의 접속 유저와 즉시 대국합니다</div>
                  </div>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>

              {/* 방 생성 & 코드 참가 액션 바 */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={() => {
                    const newRoom: OnlineRoom = {
                      id: String(Date.now()).slice(-4),
                      title: `${myProfile.name}의 친선 대국방`,
                      hostName: myProfile.name,
                      hostRating: myProfile.rating,
                      playerCount: 1,
                      isPrivate: false,
                    };
                    setRooms(r => [newRoom, ...r]);
                    startOnlineGame(newRoom);
                  }}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>방 만들기 (Create)</span>
                </button>
                <button
                  onClick={() => {
                    const code = prompt('입장할 4자리 방 코드를 입력하세요:');
                    if (code) {
                      const found = rooms.find(r => r.id === code);
                      if (found) startOnlineGame(found);
                      else alert('해당 코드를 가진 대국실을 찾을 수 없습니다.');
                    }
                  }}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors"
                >
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>비공개 코드 입장</span>
                </button>
              </div>

              {/* 활성 대국실 리스트 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>실시간 대국실 목록 ({rooms.length}개)</span>
                  </h2>
                  <button onClick={() => setRooms([...INITIAL_ROOMS])} className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> 새로고침
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-0.5">
                  {rooms.map(room => (
                    <div
                      key={room.id}
                      className="bg-white rounded-xl p-3 border border-slate-200 shadow-2xs flex items-center justify-between hover:border-blue-300 transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800">{room.title}</span>
                          {room.isPrivate && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded">비공개</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          방장: {room.hostName} ({room.hostRating} LP) • 인원: {room.playerCount}/2
                        </div>
                      </div>
                      <button
                        onClick={() => startOnlineGame(room)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        입장하기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 하단 푸터 (VeraNex 100% 브랜딩 & 저작권) */}
            <div className="pt-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
              <div className="flex items-center justify-center gap-1 font-semibold text-slate-600 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>VeraNex 회원 전용 실시간 온라인 플랫폼</span>
              </div>
              <p className="text-[10px]">© 2026 VeraNex. All rights reserved.</p>
            </div>
          </div>
        )}

        {/* =========================================================================
            상태 2: MATCHING (레이더 탐색 애니메이션)
           ========================================================================= */}
        {viewMode === 'MATCHING' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 animate-fade-in">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-40"></span>
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl z-10">
                <Users className="w-10 h-10 animate-pulse" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">상대 플레이어 찾는 중...</h2>
              <p className="text-xs text-slate-500 mt-2">
                레이팅 {myProfile.rating} LP 기준 실력에 맞는 상대방을 매칭하고 있습니다.
              </p>
            </div>
            <button
              onClick={() => setViewMode('LOBBY')}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              매칭 취소
            </button>
          </div>
        )}

        {/* =========================================================================
            상태 3: GAME (1:1 실시간 대국실)
           ========================================================================= */}
        {viewMode === 'GAME' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* 상단 플레이어 VS 헤더 */}
            <header className="bg-white border-b border-slate-200/80 p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => {
                    if (confirm('대국 중 퇴장 시 패배 처리됩니다. 로비로 나가시겠습니까?')) {
                      setViewMode('LOBBY');
                    }
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  <ArrowLeft className="w-4 h-4" /> 나가기
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    24ms
                  </span>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-slate-600">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                {/* 나 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full stone-black flex items-center justify-center text-[10px] text-white font-bold">
                    흑
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800">{myProfile.name}</div>
                    <div className="text-[10px] text-slate-400">{myProfile.rating} LP</div>
                  </div>
                </div>

                {/* 중앙 턴 & 타이머 */}
                <div className="text-center">
                  <div className="text-[10px] font-bold text-slate-400">
                    {currentTurn === myStone ? '내 차례' : '상대방 차례'}
                  </div>
                  <div className={`text-lg font-black ${turnTimer <= 5 ? 'text-rose-600 animate-pulse' : 'text-blue-700'}`}>
                    {turnTimer}s
                  </div>
                </div>

                {/* 상대방 */}
                <div className="flex items-center gap-2 text-right">
                  <div>
                    <div className="font-extrabold text-xs text-slate-800">{opponentName}</div>
                    <div className="text-[10px] text-slate-400">{opponentRating} LP</div>
                  </div>
                  <div className="w-8 h-8 rounded-full stone-white border border-slate-300 flex items-center justify-center text-[10px] text-slate-700 font-bold">
                    백
                  </div>
                </div>
              </div>

              {chatMessage && (
                <div className="mt-2 text-center text-xs font-bold text-blue-700 bg-blue-50 py-1 rounded-lg animate-fade-in border border-blue-200">
                  {chatMessage}
                </div>
              )}
            </header>

            {/* 중앙 15×15 바둑판 */}
            <div className="flex-1 flex flex-col items-center justify-center p-2">
              <div className="relative p-2.5 rounded-2xl wood-board-texture border-4 border-[#8c5720]/40 shadow-xl max-w-[420px] w-full aspect-square">
                {/* 격자선 레이어 */}
                <div className="absolute inset-[3.33%] grid grid-cols-14 grid-rows-14 pointer-events-none border border-[#784c1f]/60">
                  {Array.from({ length: 14 * 14 }).map((_, idx) => (
                    <div key={idx} className="border-r border-b border-[#784c1f]/40" />
                  ))}
                </div>

                {/* 화점 */}
                {STAR_POINTS.map(sp => (
                  <div
                    key={`sp-${sp.r}-${sp.c}`}
                    className="absolute w-2 h-2 rounded-full bg-[#5c3814] pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      top: `${(sp.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`,
                      left: `${(sp.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`,
                    }}
                  />
                ))}

                {/* 승리 5목 골든 레이저 */}
                {winningLine && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                    <line
                      x1={`${(winningLine.start.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                      y1={`${(winningLine.start.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                      x2={`${(winningLine.end.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                      y2={`${(winningLine.end.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                      stroke="#fbbf24"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {/* 인터랙티브 교차점 셀 */}
                <div className="absolute inset-0 grid grid-cols-15 grid-rows-15">
                  {board.map((row, r) =>
                    row.map((cell, c) => {
                      const isLast = lastMove?.r === r && lastMove?.c === c;
                      const isWin = winningLine?.points.some(p => p.r === r && p.c === c);

                      return (
                        <button
                          key={`${r}-${c}`}
                          type="button"
                          onClick={() => handleCellClick(r, c)}
                          disabled={cell !== null || currentTurn !== myStone || !!gameResult}
                          className="relative flex items-center justify-center w-full h-full p-0 m-0 cursor-pointer disabled:cursor-default"
                        >
                          {cell && (
                            <div
                              className={`relative w-[84%] h-[84%] rounded-full flex items-center justify-center ${
                                cell === 'BLACK' ? 'stone-black' : 'stone-white'
                              } ${isLast ? 'animate-stone-drop' : ''} ${isWin ? 'animate-golden-win z-25' : 'z-10'}`}
                            >
                              {isLast && !isWin && (
                                <div className="absolute inset-[-3px] rounded-full border-2 border-blue-400 animate-last-move pointer-events-none" />
                              )}
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 하단 퀵 채팅 바 */}
            <div className="bg-white border-t border-slate-200/80 p-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" /> 퀵챗:
                </span>
                {['안녕하세요!', '좋은 수네요!', '감사합니다!', '한 판 더!'].map(msg => (
                  <button
                    key={msg}
                    onClick={() => sendQuickChat(msg)}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 transition-colors"
                  >
                    {msg}
                  </button>
                ))}
              </div>
            </div>

            {/* 승패 모달 */}
            {gameResult && (
              <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xs w-full p-5 text-center flex flex-col items-center space-y-3">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                    gameResult === 'WIN' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {gameResult === 'WIN' ? <Trophy className="w-7 h-7" /> : <Award className="w-7 h-7" />}
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    {gameResult === 'WIN' ? '대국 승리 (+25 LP)' : '아쉬운 패배 (-15 LP)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {gameResult === 'WIN'
                      ? '실시간 대국에서 멋진 승리를 거두었습니다!'
                      : '상대방의 정밀한 공격에 패배했습니다. 재도전해보세요!'}
                  </p>
                  <div className="w-full flex gap-2 pt-2">
                    <button
                      onClick={() => setViewMode('LOBBY')}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold"
                    >
                      로비로 나가기
                    </button>
                    <button
                      onClick={() => startOnlineGame(currentRoom!)}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                    >
                      재대결
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </MiniAppLayout>
  );
}
