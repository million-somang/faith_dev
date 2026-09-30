import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import { 
  Users, Globe, Trophy, Shield, Play, Plus, Key, ArrowLeft, 
  MessageSquare, Volume2, VolumeX, Wifi, RefreshCw, Award, Copy, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import axios from 'axios';
import { Board, Cell, OnlineRoom, Player, PlayerProfile, Point, WinningLine } from './types/omok';
import { playStoneSound, playWinSound } from './utils/soundEffects';

const BOARD_SIZE = 15;
const STAR_POINTS: Point[] = [
  { r: 3, c: 3 }, { r: 3, c: 11 }, { r: 7, c: 7 }, { r: 11, c: 3 }, { r: 11, c: 11 }
];

export default function App() {
  const [viewMode, setViewMode] = useState<'LOBBY' | 'MATCHING' | 'WAITING' | 'GAME'>('LOBBY');
  
  // 실제 로그인 유저 프로필 & 전적
  const [myProfile, setMyProfile] = useState<PlayerProfile>({
    name: '접속 확인 중...',
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
  const [winningLine, setWinningLine] = useState<WinningLine | null>(null);
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSS' | null>(null);
  const [gameEndReason, setGameEndReason] = useState<string>('');
  const [turnTimer, setTurnTimer] = useState<number>(30);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [chatMessage, setChatMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // 1. 유저 프로필 획득
  const fetchProfile = useCallback(async () => {
    try {
      const res = await axios.get('/api/omok/profile', { withCredentials: true });
      if (res.data.success && res.data.profile) {
        setMyProfile(res.data.profile);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'AUTH', profile: res.data.profile }));
        }
      }
    } catch (e) {
      console.warn('[Profile Fetch Failed]', e);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // 2. WebSocket 연결 수립 및 이벤트 수신
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/omok`;

    let ws: WebSocket;
    let reconnectTimeout: any = null;

    function connect() {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        if (myProfile.name !== '접속 확인 중...') {
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
        // 3초 후 재연결 시도
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS Error]', err);
        ws.close();
      };
    }

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // 소켓 메시지 디스패처
  const handleSocketMessage = useCallback((msg: any) => {
    switch (msg.type) {
      case 'LOBBY_STATE':
        setRooms(msg.rooms || []);
        if (msg.onlineCount) setOnlineCount(msg.onlineCount);
        break;

      case 'ROOM_CREATED':
        setCurrentRoom(msg.room);
        setViewMode('WAITING');
        break;

      case 'MATCH_CANCELLED':
        setViewMode('LOBBY');
        break;

      case 'GAME_START':
        setCurrentRoom(prev => prev ? { ...prev, id: msg.roomId } : null);
        setMyStone(msg.myStone);
        setCurrentTurn(msg.currentTurn || 'BLACK');
        setOpponentName(msg.opponent.name);
        setOpponentRating(msg.opponent.rating);
        setOpponentTier(msg.opponent.tier || '골드 II');
        setBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null)));
        setLastMove(null);
        setWinningLine(null);
        setGameResult(null);
        setGameEndReason('');
        setTurnTimer(30);
        setViewMode('GAME');
        break;

      case 'MOVE_MADE':
        setBoard(prev => {
          const next = prev.map(row => [...row]);
          next[msg.r][msg.c] = msg.stone;
          return next;
        });
        setLastMove({ r: msg.r, c: msg.c });
        setCurrentTurn(msg.nextTurn);
        playStoneSound(isMuted);
        break;

      case 'TIMER_TICK':
        setTurnTimer(msg.seconds);
        break;

      case 'GAME_OVER': {
        const isWinner = msg.winnerStone === myStone;
        setGameResult(isWinner ? 'WIN' : 'LOSS');
        setGameEndReason(
          msg.reason === 'TIMEOUT' ? (isWinner ? '상대방 시간초과 승리' : '시간초과 패배') :
          msg.reason === 'SURRENDER' ? (isWinner ? '상대방 기권 승리' : '기권 패배') :
          msg.reason === 'DISCONNECT' ? '상대방 연결 끊김 (기권승)' :
          '5목 완성 승리'
        );

        if (msg.winningLine) {
          setWinningLine(msg.winningLine);
        }

        if (isWinner) {
          playWinSound(isMuted);
          try {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          } catch {}
        }

        // 전적 새로고침
        fetchProfile();
        break;
      }

      case 'CHAT_MESSAGE':
        setChatMessage(`${msg.sender}: "${msg.text}"`);
        setTimeout(() => setChatMessage(null), 3500);
        break;

      case 'ERROR':
        alert(msg.message);
        break;
    }
  }, [fetchProfile, isMuted, myStone]);

  // 착수 요청 전송
  const handleCellClick = useCallback((r: number, c: number) => {
    if (viewMode !== 'GAME' || gameResult || board[r][c] !== null) return;
    if (currentTurn !== myStone) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    wsRef.current.send(JSON.stringify({ type: 'MOVE', r, c }));
  }, [board, currentTurn, gameResult, myStone, viewMode]);

  // 빠른 매칭 시작
  const handleQuickMatch = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('서버와 실시간 연결 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setViewMode('MATCHING');
    wsRef.current.send(JSON.stringify({ type: 'QUICK_MATCH' }));
  };

  // 빠른 매칭 취소
  const handleCancelMatch = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CANCEL_MATCH' }));
    }
    setViewMode('LOBBY');
  };

  // 방 만들기
  const handleCreateRoom = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('서버와 연결되어 있지 않습니다.');
      return;
    }
    const title = prompt('생성할 대국실 제목을 입력하세요:', `${myProfile.name}님의 대국실`);
    if (title === null) return;

    const isPrivate = window.confirm('비공개 대국실(비밀코드 입장 전용)로 생성하시겠습니까?\n[확인] 비공개 / [취소] 공개 대국실');
    wsRef.current.send(JSON.stringify({ type: 'CREATE_ROOM', title: title.trim(), isPrivate }));
  };

  // 방 입장
  const handleJoinRoom = (roomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('서버와 연결되어 있지 않습니다.');
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
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    }
    setViewMode('LOBBY');
    setCurrentRoom(null);
  };

  // 기권 선언
  const handleSurrender = () => {
    if (window.confirm('정말 기권하시겠습니까? 패배로 처리됩니다.')) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'SURRENDER' }));
      }
    }
  };

  // 퀵 채팅 전송
  const sendQuickChat = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'CHAT', text }));
      setChatMessage(`나: "${text}"`);
      setTimeout(() => setChatMessage(null), 3000);
    }
  };

  return (
    <MiniAppLayout title="베라오목 온라인">
      <main className="w-full max-w-[450px] min-h-[850px] mx-auto bg-slate-50 flex flex-col justify-between shadow-2xl relative select-none overflow-hidden font-sans">
        
        {/* =========================================================================
            상태 1: LOBBY (온라인 대기실 및 실제 방 목록)
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
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                  isConnected ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'
                }`}>
                  <Wifi className="w-3.5 h-3.5" />
                  <span>{isConnected ? `온라인 (${onlineCount}명)` : '연결 중...'}</span>
                </div>
              </div>

              {/* 빠른 1:1 매칭 CTA 카드 */}
              <button
                onClick={handleQuickMatch}
                disabled={!isConnected}
                className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-between shadow-lg shadow-blue-600/20 hover:shadow-xl transition-all group active:scale-[0.99] mb-4 disabled:opacity-50 cursor-pointer"
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
                    <div className="text-xs text-blue-100">접속 중인 실제 플레이어와 즉시 1:1 대국을 매칭합니다</div>
                  </div>
                </div>
                <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
              </button>

              {/* 방 생성 & 코드 참가 액션 바 */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={handleCreateRoom}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  <span>방 만들기 (Create)</span>
                </button>
                <button
                  onClick={handleJoinByCode}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 flex items-center justify-center gap-2 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>비공개 코드 입장</span>
                </button>
              </div>

              {/* 실제 활성 대국실 리스트 (목업 완전 제거) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>실시간 대기실 목록 ({rooms.length}개)</span>
                  </h2>
                  <button 
                    onClick={() => {
                      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                        wsRef.current.send(JSON.stringify({ type: 'GET_LOBBY' }));
                      }
                    }} 
                    className="text-slate-400 hover:text-slate-600 text-xs flex items-center gap-1 cursor-pointer"
                  >
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
                          방장: {room.hostName} ({room.hostRating} LP) • 방코드: #{room.id}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        입장하기
                      </button>
                    </div>
                  ))}

                  {rooms.length === 0 && (
                    <div className="bg-white rounded-xl p-8 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                      <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                      현재 대기 중인 대국실이 없습니다.<br />
                      <strong>[방 만들기]</strong>로 새 대국실을 개설하거나 <strong>[빠른 매칭]</strong>을 눌러보세요!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 하단 푸터 (VeraNex 100% 브랜딩) */}
            <div className="pt-4 border-t border-slate-200/80 text-center text-xs text-slate-400">
              <div className="flex items-center justify-center gap-1 font-semibold text-slate-600 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-600" />
                <span>VeraNex 회원 전용 1:1 실시간 오목 네트워크</span>
              </div>
              <p className="text-[10px]">© 2026 VeraNex. All rights reserved.</p>
            </div>
          </div>
        )}

        {/* =========================================================================
            상태 2: MATCHING (실제 서버 큐 매칭 대기)
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
              <h2 className="text-2xl font-black text-slate-900">상대 플레이어 매칭 중...</h2>
              <p className="text-xs text-slate-500 mt-2">
                서버 대기열에서 접속 유저를 찾고 있습니다. 다른 플레이어가 매칭을 누르면 즉시 대국이 시작됩니다.
              </p>
            </div>
            <button
              onClick={handleCancelMatch}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              매칭 취소
            </button>
          </div>
        )}

        {/* =========================================================================
            상태 2-1: WAITING (방 개설 후 상대 입장 대기)
           ========================================================================= */}
        {viewMode === 'WAITING' && currentRoom && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5 animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-md">
              <Globe className="w-9 h-9 animate-spin-slow" />
            </div>

            <div>
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                대기 중인 방 #{currentRoom.id}
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">{currentRoom.title}</h2>
              <p className="text-xs text-slate-500 mt-1">상대 플레이어가 입장하기를 기다리고 있습니다.</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs w-full max-w-[280px]">
              <span className="text-[11px] font-bold text-slate-400 block mb-1">친구 초대 방 코드</span>
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
                <span className="font-mono text-lg font-black tracking-widest text-indigo-700">#{currentRoom.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentRoom.id);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? '복사됨' : '복사'}</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
            >
              대기실 취소 및 나가기
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
                  onClick={handleSurrender}
                  className="flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> 기권 / 나가기
                </button>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    실시간 대국 중
                  </span>
                  <button onClick={() => setIsMuted(!isMuted)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-600" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 border border-slate-200">
                {/* 나 */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    myStone === 'BLACK' ? 'stone-black text-white' : 'stone-white text-slate-700 border border-slate-300'
                  }`}>
                    {myStone === 'BLACK' ? '흑' : '백'}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-800">{myProfile.name} (나)</div>
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
                    <div className="text-[10px] text-slate-400">{opponentRating} LP • {opponentTier}</div>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    myStone === 'BLACK' ? 'stone-white text-slate-700 border border-slate-300' : 'stone-black text-white'
                  }`}>
                    {myStone === 'BLACK' ? '백' : '흑'}
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
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium shrink-0 transition-colors cursor-pointer"
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
                    {gameResult === 'WIN' ? '대국 승리 (+20 LP)' : '대국 패배 (-15 LP)'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {gameEndReason || (gameResult === 'WIN'
                      ? '실시간 대국에서 승리하셨습니다!'
                      : '상대방에게 패배했습니다. 재대결을 신청해 보세요!')}
                  </p>
                  <div className="w-full flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        handleLeaveRoom();
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer"
                    >
                      로비로 나가기
                    </button>
                    <button
                      onClick={() => {
                        handleLeaveRoom();
                        handleQuickMatch();
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer shadow-md"
                    >
                      새 매칭
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
