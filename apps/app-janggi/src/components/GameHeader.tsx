import { useEffect, useRef, useState } from 'react';
import {
  BoardTheme,
  GameMode,
  SajuElementBuff,
  Side,
  SoundSettings,
} from '../types/janggi';
import { soundEffects } from '../utils/soundEffects';

interface GameHeaderProps {
  currentMode: GameMode;
  currentTurn: Side;
  isCheck: boolean;
  timeRemaining: number; // 샷클락 또는 제한시간(초)
  isMiniMode: boolean;
  isMuted: boolean;
  soundSettings: SoundSettings;
  boardTheme: BoardTheme;
  showKoreanSubLabel: boolean;
  sajuBuff: SajuElementBuff;
  onToggleMute: () => void;
  onUpdateSoundSettings: (partial: Partial<SoundSettings>) => void;
  onChangeBoardTheme: (theme: BoardTheme) => void;
  onToggleKoreanSubLabel: () => void;
  onOpenRules: () => void;
  onSelectMode: (mode: GameMode) => void;
}

const BOARD_THEME_OPTIONS: {
  id: BoardTheme;
  name: string;
  swatchClass: string;
}[] = [
  {
    id: 'classic_wood',
    name: '전통 비자목',
    swatchClass: 'bg-gradient-to-br from-[#f4e4cb] to-[#cb9d66] border-[#b38249]',
  },
  {
    id: 'royal_ebony',
    name: '궁중 흑단',
    swatchClass: 'bg-gradient-to-br from-[#3b2316] to-[#1c110b] border-[#d4af37]',
  },
  {
    id: 'night_ink',
    name: '야간 대국실',
    swatchClass: 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-[#64748b]',
  },
];

export function GameHeader({
  currentMode,
  currentTurn,
  isCheck,
  timeRemaining,
  isMiniMode,
  isMuted,
  soundSettings,
  boardTheme,
  showKoreanSubLabel,
  sajuBuff,
  onToggleMute,
  onUpdateSoundSettings,
  onChangeBoardTheme,
  onToggleKoreanSubLabel,
  onOpenRules,
  onSelectMode,
}: GameHeaderProps) {
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPrefsOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsPrefsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isPrefsOpen]);

  // 시간 분:초 포맷
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const isChoTurn = currentTurn === 'cho';

  return (
    <header className="w-full space-y-2.5 relative z-30">
      {/* 1. 최상단 모드 탭 바 (Clean Neumorphism 알약 트랙 - 100% 1줄 고정) */}
      <nav className="flex w-full p-1 bg-slate-200/80 rounded-2xl gap-1 overflow-x-auto no-scrollbar shadow-inner" role="tablist">
        <button
          type="button"
          onClick={() => onSelectMode('classic')}
          className={`flex-1 min-w-0 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
            currentMode === 'classic'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🏆</span>
          <span className="whitespace-nowrap">정통</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('puzzle')}
          className={`flex-1 min-w-0 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
            currentMode === 'puzzle'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>🧩</span>
          <span className="whitespace-nowrap">묘수</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('mini')}
          className={`flex-1 min-w-0 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
            currentMode === 'mini'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>⚡</span>
          <span className="whitespace-nowrap">미니</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('battle')}
          className={`flex-1 min-w-0 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
            currentMode === 'battle'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>💥</span>
          <span className="whitespace-nowrap">배틀</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectMode('saju')}
          className={`flex-1 min-w-0 py-1.5 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap shrink-0 ${
            currentMode === 'saju'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>☯️</span>
          <span className="whitespace-nowrap">오행</span>
        </button>
      </nav>

      {/* 2. 대국 현황 바: 현재 턴, 타이머, 테마·사운드 설정, 룰 가이드 */}
      <div className="nm-card-sm p-2.5 sm:p-3 bg-white border border-slate-200/90 flex items-center justify-between gap-1.5 shadow-xs relative" ref={popoverRef}>
        {/* 턴 상태 인디케이터 */}
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shadow-xs shrink-0 ${
              isChoTurn
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-rose-600 text-white shadow-rose-200'
            }`}
          >
            {isChoTurn ? '楚' : '漢'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-slate-900 truncate">
                {isChoTurn ? '초(楚)나라 턴' : '한(漢)나라 턴'}
              </span>
              {isCheck && (
                <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded text-[10px] font-black animate-ping shrink-0">
                  장군!
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {isChoTurn ? '청록 비취 선공 진영' : '주홍 진홍 후공 (덤 1.5점)'}
            </p>
          </div>
        </div>

        {/* 중앙 샷클락 / 대국 타이머 */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-black text-slate-800 shrink-0">
          <i className={`fas fa-stopwatch ${timeRemaining <= 5 ? 'text-rose-500 animate-bounce' : 'text-slate-500'}`}></i>
          <span className={timeRemaining <= 5 ? 'text-rose-600 font-black' : ''}>
            {isMiniMode ? `${timeRemaining}초` : formatTime(timeRemaining)}
          </span>
        </div>

        {/* 우측 유틸 버튼: 테마·사운드 팝오버, 룰 가이드, 음소거 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEffects.playUiClick();
              setIsPrefsOpen((prev) => !prev);
            }}
            title="장기판 테마 및 사운드 세부 설정"
            aria-label="테마 및 사운드 세부 설정"
            className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs cursor-pointer transition-colors border ${
              isPrefsOpen
                ? 'bg-amber-100 border-amber-400 text-amber-800'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
          >
            <i className="fas fa-palette"></i>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEffects.playUiClick();
              onOpenRules();
            }}
            title="장기 룰 및 행마법 가이드"
            aria-label="장기 룰 및 행마법 가이드"
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs cursor-pointer transition-colors border border-slate-200"
          >
            <i className="fas fa-question"></i>
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? '전체 음소거 해제' : '전체 음소거'}
            aria-label={isMuted ? '전체 음소거 해제' : '전체 음소거'}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center text-xs cursor-pointer transition-colors border border-slate-200"
          >
            <i
              className={`fas ${
                isMuted
                  ? 'fa-volume-xmark text-slate-400'
                  : soundSettings.bgmEnabled
                  ? 'fa-music text-amber-600'
                  : 'fa-volume-high text-blue-600'
              }`}
            ></i>
          </button>
        </div>

        {/* 테마 · 사운드 빠른 설정 팝오버 */}
        {isPrefsOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3.5 z-50 space-y-3 text-xs animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-black text-slate-900 flex items-center gap-1.5">
                <i className="fas fa-sliders text-amber-600"></i>
                <span>대국실 테마 · 사운드</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPrefsOpen(false)}
                className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="설정 닫기"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>
            </div>

            {/* 1. 사운드 개별 ON/OFF */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                사운드 패키지
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playUiClick();
                    onUpdateSoundSettings({ sfxEnabled: !soundSettings.sfxEnabled });
                  }}
                  className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                    soundSettings.sfxEnabled
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <i className="fas fa-drum text-xs"></i>
                  <span>효과음</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playUiClick();
                    onUpdateSoundSettings({ voiceEnabled: !soundSettings.voiceEnabled });
                  }}
                  className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                    soundSettings.voiceEnabled
                      ? 'bg-amber-50 border-amber-400 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <i className="fas fa-comment-dots text-xs"></i>
                  <span>보이스</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playUiClick();
                    onUpdateSoundSettings({ bgmEnabled: !soundSettings.bgmEnabled });
                  }}
                  className={`py-1.5 px-1.5 rounded-xl border text-[11px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                    soundSettings.bgmEnabled
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <i className="fas fa-music text-xs"></i>
                  <span>국악 BGM</span>
                </button>
              </div>
            </div>

            {/* 2. 장기판 테마 3종 */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                장기판 테마
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {BOARD_THEME_OPTIONS.map((t) => {
                  const active = boardTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        soundEffects.playUiClick();
                        onChangeBoardTheme(t.id);
                      }}
                      className={`py-1.5 px-1 rounded-xl border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        active
                          ? 'bg-amber-50 border-amber-500 text-amber-950 font-black shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-600 font-bold hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-6 h-4 rounded-md border ${t.swatchClass}`} />
                      <span className="text-[10px] leading-tight">{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. 한글 보조 표기 토글 */}
            <button
              type="button"
              onClick={() => {
                soundEffects.playUiClick();
                onToggleKoreanSubLabel();
              }}
              className="w-full py-2 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="text-left">
                <div className="text-[11px] font-extrabold text-slate-800">
                  기물 한글 보조 표기
                </div>
                <div className="text-[9px] text-slate-500">한자 아래 (차·포·마) 함께 표시</div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  showKoreanSubLabel
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {showKoreanSubLabel ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 3. 오행 만세력 모드 활성화 시 상단 버프 알림 배너 */}
      {currentMode === 'saju' && (
        <div className="nm-card-sm p-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex items-center justify-between text-xs px-3">
          <div className="flex items-center gap-2">
            <span className="text-base">{sajuBuff.icon}</span>
            <span className="font-extrabold text-amber-900">{sajuBuff.title}</span>
          </div>
          <span className="text-[11px] text-amber-700 font-semibold">{sajuBuff.desc}</span>
        </div>
      )}
    </header>
  );
}
