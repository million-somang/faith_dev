import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Users, Globe, Trophy, Shield, Play, Plus, Key, ArrowLeft, 
  MessageSquare, Volume2, VolumeX, Wifi, RefreshCw, Award, Copy, Check,
  Bot, BookOpen, HelpCircle, Gamepad2, Sparkles, X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { Board, Cell, OnlineRoom, Player, PlayerProfile, Point, WinningLine, AppTab, GameMode, ViewMode, MoveRecord } from './types/omok';
import { playStoneSound, playWinSound } from './utils/soundEffects';
import { calculateAIMove, checkWin } from './utils/aiOpponent';
import { SplashIntro } from './components/SplashIntro';
import { RulesTab } from './components/RulesTab';
import { FaqTab } from './components/FaqTab';
import { OmokLogo } from './components/OmokLogo';

const BOARD_SIZE = 15;
const STAR_POINTS: Point[] = [
  { r: 3, c: 3 }, { r: 3, c: 11 }, { r: 7, c: 7 }, { r: 11, c: 3 }, { r: 11, c: 11 }
];

export default function App() {
  // 1. 스플래시 인트로 (URL 파라미터 nosplash=true 지원)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('nosplash') !== 'true';
    }
    return true;
  });

  // 2. 상단 3탭 시스템 (대국실 / 규칙 가이드 / FAQ & 랭킹)
  const [activeTab, setActiveTab] = useState<AppTab>('game');

  // 3. 뷰 모드 및 게임 모드
  const [viewMode, setViewMode] = useState<ViewMode>('LOBBY');
  const [gameMode, setGameMode] = useState<GameMode>('ONLINE');

  // 실제 로그인 유저 프로필 & 전적
  const [myProfile, setMyProfile] = useState<PlayerProfile>({
    name: '베라플레이어',
    rating: 1200,
    tier: '골드 II',
    wins: 0,
    losses: 0,
  });

  // 실시간 방 및 네트워크 상태
  const [rooms, setRooms] = useState<OnlineRoom[]>([]);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentRoom, setCurrentRoom] = useState<OnlineRoom | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // 상대방 정보
  const [opponentName, setOpponentName] = useState<string>('상대 대기중');
  const [opponentRating, setOpponentRating] = useState<number>(1200);
  const [opponentTier, setOpponentTier] = useState<string>('골드 II');

  // 대국 상태
  const [board, setBoard] = useState<Board>(() => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
  const [myStone, setMyStone] = useState<Player>('BLACK');
  const [currentTurn, setCurrentTurn] = useState<Player>('BLACK');
  const [lastMove, setLastMove] = useState<Point | null>(null);
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([]);
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [gameEndReason, setGameEndReason] = useState<string>('');
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 팝업 닫기
  const handleClose = () => {
    if (!window.opener || window.opener === window) {
      window.location.href = '/';
      return;
    }
    window.close();
  };

  // 1. 유저 프로필 획득
  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get('/api/omok/profile', { withCredentials: true });
      if (res.data?.success && res.data.profile) {
        setMyProfile(res.data.profile);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'AUTH', profile: res.data.profile }));
        }
      }
    } catch {
      // 기본 프로필 유지
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 2. WebSocket 연결 수립 및 이벤트 수신 (온라인 대전)
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/omok`;

    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setIsConnected(true);
          if (myProfile.name !== '베라플레이어') {
            ws.send(JSON.stringify({ type: 'AUTH', profile: myProfile }));
          }
          ws.send(JSON.stringify({ type: 'GET_LOBBY' }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleSocketMessage(msg);
          } catch (e) {
            console.error('[WS Message Parse Error]', e);
          }
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setIsConnected(false);
      }
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [myProfile]);

  // 소켓 메시지 디스패처
  const handleSocketMessage = useCallback((msg: { 
    type: string; 
    rooms?: OnlineRoom[]; 
    onlineCount?: number; 
    room?: OnlineRoom;
    roomId?: string;
    myStone?: Player;
    currentTurn?: Player;
    opponent?: { name: string; rating: number; tier?: string };
    point?: Point;
    player?: Player;
    nextTurn?: Player;
    winningLine?: WinningLine;
    winner?: Player;
    reason?: string;
    profile?: PlayerProfile;
    text?: string;
  }) => {
    switch (msg.type) {
      case 'LOBBY_STATE':
        setRooms(msg.rooms || []);
        if (msg.onlineCount) setOnlineCount(msg.onlineCount);
        break;

      case 'ROOM_CREATED':
        if (msg.room) {
          setCurrentRoom(msg.room);
          setViewMode('WAITING');
        }
        break;

      case 'MATCH_CANCELLED':
        setViewMode('LOBBY');
        break;

      case 'GAME_START':
        setGameMode('ONLINE');
        setCurrentRoom(prev => prev ? { ...prev, id: msg.roomId || '' } : null);
        setMyStone(msg.myStone || 'BLACK');
        setCurrentTurn(msg.currentTurn || 'BLACK');
        if (msg.opponent) {
          setOpponentName(msg.opponent.name);
          setOpponentRating(msg.opponent.rating);
          setOpponentTier(msg.opponent.tier || '골드 II');
        }
        setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
        setLastMove(null);
        setMoveHistory([]);
        setWinningLine(null);
        setGameResult(null);
        setGameEndReason('');
        setTurnTimer(30);
        setViewMode('GAME');
        break;

      case 'MOVE_MADE':
        if (msg.point && msg.player) {
          const { r, c } = msg.point;
          setBoard(prev => {
            const next = prev.map(row => [...row]);
            next[r][c] = msg.player || null;
            return next;
          });
          setLastMove(msg.point);
          setMoveHistory(prev => [
            { step: prev.length + 1, player: msg.player!, point: msg.point! },
            ...prev
          ]);
          playStoneSound(isMuted);

          if (msg.winningLine) {
            setWinningLine(msg.winningLine);
          } else {
            setCurrentTurn(msg.nextTurn || 'BLACK');
            setTurnTimer(30);
          }
        }
        break;

      case 'GAME_OVER':
        if (msg.winningLine) setWinningLine(msg.winningLine);
        setGameEndReason(msg.reason || '');
        if (msg.winner === myStone) {
          setGameResult('WIN');
          playWinSound(isMuted);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        } else {
          setGameResult('LOSS');
        }
        if (msg.profile) {
          setMyProfile(msg.profile);
        }
        break;

      case 'CHAT':
        if (msg.text) {
          setChatMessage(`${opponentName}: "${msg.text}"`);
          setTimeout(() => setChatMessage(null), 3500);
        }
        break;

      default:
        break;
    }
  }, [myStone, isMuted, opponentName]);

  // 30초 턴 타이머 구동
  useEffect(() => {
    if (viewMode !== 'GAME' || gameResult !== null) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTurnTimer(prev => {
        if (prev <= 1) {
          if (gameMode === 'AI' && currentTurn === myStone) {
            setGameResult('LOSS');
            setGameEndReason('착수 시간(30초) 초과로 패배하였습니다.');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [viewMode, currentTurn, gameResult, gameMode, myStone]);

  // 착수 핸들러
  const handleCellClick = (r: number, c: number) => {
    if (board[r][c] !== null || currentTurn !== myStone || gameResult !== null) return;

    if (gameMode === 'ONLINE') {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'MOVE', point: { r, c } }));
      }
    } else {
      // AI 연습 모드 착수
      playStoneSound(isMuted);
      const nextBoard = board.map(row => [...row]);
      nextBoard[r][c] = myStone;
      setBoard(nextBoard);
      const playerMove: Point = { r, c };
      setLastMove(playerMove);
      setMoveHistory(prev => [
        { step: prev.length + 1, player: myStone, point: playerMove },
        ...prev
      ]);

      const winLine = checkWin(nextBoard, r, c, myStone);
      if (winLine) {
        setWinningLine(winLine);
        setGameResult('WIN');
        setGameEndReason('축하합니다! 5목을 완성하여 AI에게 승리하셨습니다.');
        playWinSound(isMuted);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        return;
      }

      const aiStone: Player = myStone === 'BLACK' ? 'WHITE' : 'BLACK';
      setCurrentTurn(aiStone);
      setTurnTimer(30);

      setTimeout(() => {
        const aiMove = calculateAIMove(nextBoard, aiStone);
        const aiNextBoard = nextBoard.map(row => [...row]);
        aiNextBoard[aiMove.r][aiMove.c] = aiStone;
        setBoard(aiNextBoard);
        setLastMove(aiMove);
        setMoveHistory(prev => [
          { step: prev.length + 1, player: aiStone, point: aiMove },
          ...prev
        ]);
        playStoneSound(isMuted);

        const aiWinLine = checkWin(aiNextBoard, aiMove.r, aiMove.c, aiStone);
        if (aiWinLine) {
          setWinningLine(aiWinLine);
          setGameResult('LOSS');
          setGameEndReason('AI가 5목을 완성하였습니다. 다시 도전해 보세요!');
        } else {
          setCurrentTurn(myStone);
          setTurnTimer(30);
        }
      }, 400);
    }
  };

  // 빠른 1:1 매칭 시작
  const handleQuickMatch = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      startAiPractice();
      return;
    }
    setViewMode('MATCHING');
    wsRef.current.send(JSON.stringify({ type: 'QUICK_MATCH' }));
  };

  // AI 연습 모드 시작
  const startAiPractice = () => {
    setGameMode('AI');
    setMyStone('BLACK');
    setCurrentTurn('BLACK');
    setOpponentName('알파베라 (AI 훈련봇)');
    setOpponentRating(1350);
    setOpponentTier('플래티넘');
    setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
    setLastMove(null);
    setMoveHistory([]);
    setWinningLine(null);
    setGameResult(null);
    setGameEndReason('');
    setTurnTimer(30);
    setViewMode('GAME');
  };

  // 방 만들기
  const handleCreateRoom = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      startAiPractice();
      return;
    }
    const title = prompt('방 제목을 입력하세요:', `${myProfile.name}의 오목 대국실`);
    if (!title) return;
    const isPrivate = window.confirm('비공개(코드 입장) 방으로 만드시겠습니까?');
    wsRef.current.send(JSON.stringify({ type: 'CREATE_ROOM', title: title.trim(), isPrivate }));
  };

  // 방 참가
  const handleJoinRoom = (roomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      startAiPractice();
      return;
    }
    wsRef.current.send(JSON.stringify({ type: 'JOIN_ROOM', roomId }));
  };

  // 비공개 코드 입장
  const handleJoinByCode = () => {
    const code = prompt('입장할 4자리 방 번호(코드)를 입력하세요:');
    if (!code) return;
    handleJoinRoom(code.trim());
  };

  // 대기방 나가기 / 게임 퇴장
  const handleLeaveRoom = () => {
    if (gameMode === 'ONLINE' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    setViewMode('LOBBY');
    setCurrentRoom(null);
    setGameResult(null);
  };

  // 기권 선언
  const handleSurrender = () => {
    if (window.confirm('정말 기권하시겠습니까? 패배로 처리됩니다.')) {
      if (gameMode === 'ONLINE') {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'SURRENDER' }));
        }
      } else {
        setGameResult('LOSS');
        setGameEndReason('기권으로 패배 처리되었습니다.');
      }
    }
  };

  // 퀵 채팅 전송
  const sendQuickChat = (text: string) => {
    if (gameMode === 'ONLINE' && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CHAT', text }));
    }
    setChatMessage(`나: "${text}"`);
    setTimeout(() => setChatMessage(null), 3000);
  };

  // 스플래시 인트로 화면
  if (showSplash) {
    return <SplashIntro onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="w-full h-[100dvh] max-h-[850px] mx-auto bg-[#f7f4ed] flex flex-col justify-between shadow-2xl relative select-none overflow-hidden font-sans border-x border-[#e8e1d5]">
      
      {/* =========================================================================
          상단 영역: 1행 헤더(42px) + 2행 탭 바(36px) = 일체형 2행 내비게이션
         ========================================================================= */}
      <div className="bg-[#fdfbf7] border-b border-[#e8e1d5] px-3 pt-2.5 pb-2 shrink-0 z-30 shadow-2xs">
        {/* 1행: 3D 바둑판 로고 + 베라오목 온라인 + PVP 뱃지 + 볼륨/닫기 */}
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <OmokLogo size={26} />
            <h1 className="text-sm font-black text-[#2d261e] tracking-tight flex items-center gap-1.5">
              <span>베라오목 온라인</span>
              <span className="px-1.5 py-0.2 text-[9px] font-black bg-blue-600 text-white rounded-md tracking-wider">
                PVP
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1.5 rounded-lg text-[#786e63] hover:text-[#2d261e] hover:bg-[#eee8dc] transition-colors cursor-pointer"
              title={isMuted ? '음소거 해제' : '음소거'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-[#786e63] hover:text-[#2d261e] hover:bg-[#eee8dc] transition-colors cursor-pointer"
              title="창 닫기"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2행: 3열 균등 분할 탭 메뉴 (글자 줄바꿈 0% 보장) */}
        <nav className="grid grid-cols-3 gap-1 bg-[#eee8dc]/70 p-0.5 rounded-xl">
          <button
            onClick={() => setActiveTab('game')}
            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'game' 
                ? 'bg-white text-blue-600 shadow-2xs' 
                : 'text-[#786e63] hover:text-[#2d261e]'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">실시간 대국</span>
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'rules' 
                ? 'bg-white text-blue-600 shadow-2xs' 
                : 'text-[#786e63] hover:text-[#2d261e]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">경기 규칙</span>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`py-1.5 px-1 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer ${
              activeTab === 'faq' 
                ? 'bg-white text-blue-600 shadow-2xs' 
                : 'text-[#786e63] hover:text-[#2d261e]'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">FAQ &amp; 랭킹</span>
          </button>
        </nav>
      </div>

      {/* =========================================================================
          탭 2: 경기 규칙 (RulesTab)
         ========================================================================= */}
      {activeTab === 'rules' && <RulesTab />}

      {/* =========================================================================
          탭 3: 자주 묻는 질문 (FaqTab)
         ========================================================================= */}
      {activeTab === 'faq' && <FaqTab />}

      {/* =========================================================================
          탭 1: 실시간 대국 메인 컨텐츠 (Game Tab) - 웜 베이지 톤앤매너
         ========================================================================= */}
      {activeTab === 'game' && (
        <main className="flex-1 flex flex-col justify-between overflow-hidden bg-[#f7f4ed]">
          {/* ---------------------------------------------------------------------
              뷰 모드 1: LOBBY (온라인 로비 및 AI 훈련장) - Zero-Scroll 완결
             --------------------------------------------------------------------- */}
          {viewMode === 'LOBBY' && (
            <div className="flex-1 flex flex-col justify-between p-3 animate-fade-in overflow-hidden">
              {/* 1. 상단 프로필 & 네트워크 현황 */}
              <div className="bg-white/95 rounded-2xl p-2.5 border border-[#e8e1d5] shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                    {myProfile.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-[#2d261e] text-xs">{myProfile.name}</span>
                      <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-200">
                        {myProfile.tier}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#786e63] font-medium">
                      {myProfile.rating} LP • {myProfile.wins}승 {myProfile.losses}패
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  isConnected ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-[#786e63] bg-[#eee8dc] border-[#e8e1d5]'
                }`}>
                  <Wifi className="w-3 h-3" />
                  <span>{isConnected ? `온라인 ${onlineCount}명` : 'AI 연습 가능'}</span>
                </div>
              </div>

              {/* 2. 빠른 매칭 CTA & AI 싱글 연습 모드 */}
              <div className="space-y-1.5 py-0.5">
                {/* 빠른 1:1 온라인 매칭 */}
                <button
                  onClick={handleQuickMatch}
                  data-screenshot-click="action"
                  className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-md hover:shadow-lg transition-all group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <Play className="w-4 h-4 fill-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                        <span>빠른 1:1 온라인 매칭</span>
                        <span className="text-[9px] bg-white/25 px-1.5 py-0.2 rounded-full">LIVE</span>
                      </div>
                      <div className="text-[10px] text-blue-100">실시간 접속 유저와 30초 턴 자동 매칭</div>
                    </div>
                  </div>
                  <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                </button>

                {/* AI 싱글 연습 대국 */}
                <button
                  onClick={startAiPractice}
                  className="w-full py-2 px-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between shadow-xs hover:shadow-md transition-all group active:scale-[0.99] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center text-white">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-xs">AI 싱글 훈련 모드</span>
                      <span className="text-[10px] text-emerald-100 ml-2">대기 없이 즉시 플레이</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">연습 시작</span>
                </button>
              </div>

              {/* 3. 방 만들기 & 비공개 코드 입장 */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleCreateRoom}
                  className="py-2 px-2.5 bg-white/95 rounded-xl border border-[#e8e1d5] shadow-2xs hover:bg-[#fdfbf7] flex items-center justify-center gap-1 text-xs font-bold text-[#2d261e] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  <span>방 만들기</span>
                </button>
                <button
                  onClick={handleJoinByCode}
                  className="py-2 px-2.5 bg-white/95 rounded-xl border border-[#e8e1d5] shadow-2xs hover:bg-[#fdfbf7] flex items-center justify-center gap-1 text-xs font-bold text-[#2d261e] transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>코드 입장</span>
                </button>
              </div>

              {/* 4. 실시간 활성 대국실 리스트 (높이 압축) */}
              <div className="bg-white/95 rounded-2xl p-2.5 border border-[#e8e1d5] shadow-2xs flex-1 flex flex-col overflow-hidden min-h-[140px] max-h-[220px]">
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <h2 className="text-xs font-black text-[#2d261e] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    <span>실시간 대기실 ({rooms.length}개)</span>
                  </h2>
                  <button 
                    onClick={() => {
                      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'GET_LOBBY' }));
                      }
                    }} 
                    className="text-[#786e63] hover:text-[#2d261e] text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> 새로고침
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
                  {rooms.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-4 text-[#786e63]">
                      <Users className="w-6 h-6 mb-1 text-[#b5aa9b]" />
                      <span className="text-xs font-bold">현재 대기 중인 방이 없습니다.</span>
                      <span className="text-[10px] text-[#786e63] mt-0.5">직접 방을 만들거나 AI 연습을 시작해 보세요!</span>
                    </div>
                  ) : (
                    rooms.map(room => (
                      <div
                        key={room.id}
                        className="bg-[#fdfbf7] rounded-xl p-2 border border-[#e8e1d5] flex items-center justify-between hover:bg-amber-50/50 hover:border-amber-300 transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#2d261e]">{room.title}</span>
                            {room.isPrivate && (
                              <span className="text-[9px] bg-[#eee8dc] text-[#786e63] px-1.5 py-0.2 rounded">비공개</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#786e63] mt-0.5">
                            방장: {room.hostName} ({room.hostRating} LP)
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                        >
                          입장
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 5. 하단 보안 및 공인 표준 푸터 */}
              <footer className="text-center text-[10px] text-[#786e63] pt-1 shrink-0">
                <div className="flex items-center justify-center gap-2 mb-0.5">
                  <span className="flex items-center gap-1 font-bold text-[#5c5245]">
                    <Shield className="w-3 h-3 text-blue-600" /> 공인 15×15 렌주룰 엔진
                  </span>
                  <span>•</span>
                  <span>30초 타임아웃</span>
                </div>
                <span>© 2026 VeraNex. All rights reserved.</span>
              </footer>
            </div>
          )}

          {/* ---------------------------------------------------------------------
              뷰 모드 2: MATCHING (매칭 대기 상태)
             --------------------------------------------------------------------- */}
          {viewMode === 'MATCHING' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin flex items-center justify-center" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-7 h-7 text-amber-700 animate-pulse" />
                </div>
              </div>
              <div>
                <h3 className="text-base font-black text-[#2d261e]">상대 플레이어 탐색 중...</h3>
                <p className="text-xs text-[#786e63] mt-1">실시간 레이팅 기준 최적의 상대와 매칭하고 있습니다.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ type: 'CANCEL_MATCH' }));
                    }
                    setViewMode('LOBBY');
                  }}
                  className="px-4 py-2 bg-[#eee8dc] hover:bg-[#dfd7c7] text-[#2d261e] rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  매칭 취소
                </button>
                <button
                  onClick={startAiPractice}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  AI와 즉시 대전
                </button>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------------------
              뷰 모드 3: WAITING (방 생성 후 대기실)
             --------------------------------------------------------------------- */}
          {viewMode === 'WAITING' && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-fade-in space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#2d261e]">대국실이 생성되었습니다</h3>
                <p className="text-xs text-[#786e63] mt-1">상대방이 입장할 때까지 잠시만 대기해 주세요.</p>
              </div>

              {currentRoom?.isPrivate && (
                <div className="bg-white p-3 rounded-2xl border border-[#e8e1d5] shadow-2xs space-y-1.5 w-full max-w-[260px]">
                  <span className="text-[10px] font-extrabold text-[#786e63]">비공개 4자리 입장 코드</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-2xl font-black font-mono tracking-widest text-amber-700">
                      {currentRoom.id}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(currentRoom.id);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="p-1.5 text-[#786e63] hover:text-[#2d261e] cursor-pointer"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 bg-[#eee8dc] hover:bg-[#dfd7c7] text-[#2d261e] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                대기실 나가기
              </button>
            </div>
          )}

          {/* ---------------------------------------------------------------------
              뷰 모드 4: GAME (680px 이내 1화면 완결 Zero-Scroll 대국실)
             --------------------------------------------------------------------- */}
          {viewMode === 'GAME' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* 1. 원라인(One-Line) 좌우 통합 전광판 (44px) */}
              <header className="bg-white/95 border-b border-[#e8e1d5] px-3 py-1.5 shrink-0 shadow-2xs flex items-center justify-between">
                {/* 나 */}
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    myStone === 'BLACK' ? 'stone-black text-white' : 'stone-white text-[#2d261e]'
                  }`}>
                    {myStone === 'BLACK' ? '흑' : '백'}
                  </div>
                  <div className="text-left">
                    <div className="font-extrabold text-[11px] text-[#2d261e] leading-tight">
                      {myProfile.name.slice(0, 5)} (나)
                    </div>
                    <div className="text-[9px] text-[#786e63]">
                      {gameMode === 'ONLINE' ? `${myProfile.rating} LP` : '선공'}
                    </div>
                  </div>
                </div>

                {/* 중앙 실시간 턴 배지 & 30s LED 원형 타이머 */}
                <div className="flex items-center gap-2 bg-[#fdfbf7] px-3 py-1 rounded-full border border-[#e8e1d5]">
                  <span className={`w-2 h-2 rounded-full ${
                    currentTurn === myStone ? 'bg-amber-600 animate-ping' : 'bg-slate-300'
                  }`} />
                  <span className="text-[11px] font-black text-[#2d261e]">
                    {currentTurn === myStone ? '내 턴' : '상대 턴'}
                  </span>
                  <span className="text-[#e8e1d5]">|</span>
                  <span className={`font-mono text-xs font-black ${
                    turnTimer <= 5 ? 'text-rose-600 animate-pulse' : 'text-amber-800'
                  }`}>
                    {turnTimer}s
                  </span>
                </div>

                {/* 상대방 */}
                <div className="flex items-center gap-1.5 text-right">
                  <div className="text-right">
                    <div className="font-extrabold text-[11px] text-[#2d261e] leading-tight">
                      {opponentName.slice(0, 6)}
                    </div>
                    <div className="text-[9px] text-[#786e63]">
                      {gameMode === 'ONLINE' ? `${opponentRating} LP` : 'AI'}
                    </div>
                  </div>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs ${
                    myStone === 'BLACK' ? 'stone-white text-[#2d261e]' : 'stone-black text-white'
                  }`}>
                    {myStone === 'BLACK' ? '백' : '흑'}
                  </div>
                </div>
              </header>

              {/* 퀵 챗 알림 팝오버 배너 */}
              {chatMessage && (
                <div className="bg-amber-50 border-b border-amber-200 py-1 text-center text-xs font-bold text-amber-800 animate-fade-in shrink-0">
                  {chatMessage}
                </div>
              )}

              {/* 2. 메인 15×15 컴팩트 바둑판 (정밀 피팅) */}
              <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                <div className="relative p-2 rounded-2xl wood-board-texture border-4 border-[#8c5720]/45 shadow-xl w-[345px] sm:w-[365px] aspect-square select-none">
                  {/* 격자선 레이어 */}
                  <div className="absolute inset-[3.33%] grid grid-cols-14 grid-rows-14 pointer-events-none border border-[#784c1f]/60">
                    {Array.from({ length: 14 * 14 }).map((_, idx) => (
                      <div key={idx} className="border-r border-b border-[#784c1f]/40" />
                    ))}
                  </div>

                  {/* 5대 화점 */}
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

                  {/* 승리 5목 골든 네온 레이저 */}
                  {winningLine && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                      <line
                        x1={`${(winningLine.start.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                        y1={`${(winningLine.start.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                        x2={`${(winningLine.end.c / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                        y2={`${(winningLine.end.r / (BOARD_SIZE - 1)) * 93.34 + 3.33}%`}
                        stroke="#fbbf24"
                        strokeWidth="6"
                        strokeLinecap="round"
                      />
                    </svg>
                  )}

                  {/* 15×15 인터랙티브 셀 */}
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
                                className={`relative w-[86%] h-[86%] rounded-full flex items-center justify-center ${
                                  cell === 'BLACK' ? 'stone-black' : 'stone-white'
                                } ${isLast ? 'animate-stone-drop' : ''} ${isWin ? 'animate-golden-win z-25' : 'z-10'}`}
                              >
                                {isLast && !isWin && (
                                  <div className="absolute inset-[-3px] rounded-full border-2 border-amber-400 animate-last-move pointer-events-none" />
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

              {/* 3. 최근 착수 기록 패널 (50px) */}
              <div className="bg-white/95 border-t border-[#e8e1d5] px-3 py-1.5 shrink-0 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#5c5245] font-extrabold text-[11px]">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  <span>최근 착수:</span>
                  {lastMove ? (
                    <span className="font-mono text-[#2d261e] bg-[#fdfbf7] border border-[#e8e1d5] px-1.5 py-0.5 rounded">
                      {String.fromCharCode(65 + lastMove.c)}{15 - lastMove.r}
                    </span>
                  ) : (
                    <span className="text-[#786e63]">대국 시작 대기</span>
                  )}
                </div>
                <div className="text-[11px] text-[#786e63] font-bold">
                  총 {moveHistory.length}수 진행 중
                </div>
              </div>

              {/* 4. 컴팩트 퀵챗 독 & 기권 액션 바 (40px) */}
              <div className="bg-[#fdfbf7] border-t border-[#e8e1d5] px-3 py-1.5 shrink-0 flex items-center justify-between gap-2">
                <button
                  onClick={handleSurrender}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-white px-2.5 py-1 rounded-lg border border-[#e8e1d5] shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3 h-3" /> 기권
                </button>

                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {['안녕하세요!', '좋은 수네요!', '감사합니다!', '한 판 더!'].map(msg => (
                    <button
                      key={msg}
                      onClick={() => sendQuickChat(msg)}
                      className="px-2 py-0.5 rounded-full bg-white hover:bg-[#eee8dc] text-[#5c5245] font-medium shrink-0 border border-[#e8e1d5] transition-colors cursor-pointer"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              {/* 승패 모달 */}
              {gameResult && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                  <div 
                    data-screenshot-point="result"
                    className="bg-[#fdfbf7] rounded-3xl shadow-2xl border border-[#e8e1d5] max-w-xs w-full p-5 text-center flex flex-col items-center space-y-3"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
                      gameResult === 'WIN' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {gameResult === 'WIN' ? <Trophy className="w-7 h-7" /> : <Award className="w-7 h-7" />}
                    </div>
                    <h3 className="text-xl font-black text-[#2d261e]">
                      {gameResult === 'WIN' 
                        ? (gameMode === 'ONLINE' ? '대국 승리 (+20 LP)' : 'AI 대전 승리!') 
                        : (gameMode === 'ONLINE' ? '대국 패배 (-15 LP)' : 'AI 대전 패배')}
                    </h3>
                    <p className="text-xs text-[#5c5245] leading-relaxed">
                      {gameEndReason || (gameResult === 'WIN'
                        ? '축하합니다! 5목을 먼저 연결하여 승리를 거두셨습니다.'
                        : '아쉽게 패배하였습니다. 재대결을 신청해 보세요!')}
                    </p>
                    <div className="w-full flex gap-2 pt-2">
                      <button
                        onClick={handleLeaveRoom}
                        className="flex-1 py-2.5 rounded-xl border border-[#e8e1d5] bg-white hover:bg-[#f7f4ed] text-[#5c5245] text-xs font-bold cursor-pointer"
                      >
                        로비로 나가기
                      </button>
                      <button
                        onClick={() => {
                          handleLeaveRoom();
                          if (gameMode === 'ONLINE') handleQuickMatch();
                          else startAiPractice();
                        }}
                        data-screenshot-click="result"
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-md"
                      >
                        새 대국 시작
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      )}
    </div>
  );
}
