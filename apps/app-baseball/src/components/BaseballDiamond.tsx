import { BaseRunners, PitchEffect } from '../types/baseball';
import { BASEBALL_ASSETS } from '../utils/assets';

interface BaseballDiamondProps {
  runners: BaseRunners;
  isPitching: boolean;
  pitchEffect: PitchEffect | null;
}

export default function BaseballDiamond({
  runners,
  isPitching,
  pitchEffect,
}: BaseballDiamondProps) {
  return (
    <div className="relative w-full rounded-2xl border border-slate-700/80 shadow-[0_8px_20px_rgba(15,23,42,0.18)] overflow-hidden p-2 flex flex-col items-center bg-slate-950">
      {/* 나노바나나 메이저리그 야간 스타디움 배경 이미지 */}
      <img
        src={BASEBALL_ASSETS.stadiumBg}
        alt="Vera Baseball Stadium"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-85 scale-105 pointer-events-none select-none"
      />
      {/* 구장 조명 및 전술 라인 시인성을 위한 그라데이션 오버레이 */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/45 via-emerald-950/20 to-slate-950/80 pointer-events-none" />

      {/* 벡터 다이아몬드 구장 오버레이 캔버스 (SVG 300 x 135) */}
      <div className="relative z-10 w-full max-w-[310px] h-[120px] flex items-center justify-center">
        <svg viewBox="0 0 300 135" className="w-full h-full drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)] select-none">
          <defs>
            {/* 외야 잔디 반투명 글로우 */}
            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.14" />
            </linearGradient>

            {/* 내야 마사토 흙 그라데이션 */}
            <radialGradient id="dirtGrad" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#92400e" stopOpacity="0.45" />
            </radialGradient>
          </defs>

          {/* 외야 잔디 부채꼴 라인 */}
          <path
            d="M 150 125 L 45 42 A 150 150 0 0 1 255 42 Z"
            fill="url(#grassGrad)"
            stroke="#34d399"
            strokeOpacity="0.7"
            strokeWidth="1.5"
          />

          {/* 내야 흙 원형 영역 */}
          <ellipse
            cx="150"
            cy="72"
            rx="72"
            ry="46"
            fill="url(#dirtGrad)"
            stroke="#fbbf24"
            strokeOpacity="0.55"
            strokeWidth="1.2"
          />

          {/* 내야 잔디 다이아몬드 내부 */}
          <polygon
            points="150,36 198,72 150,108 102,72"
            fill="#065f46"
            fillOpacity="0.55"
            stroke="#6ee7b7"
            strokeOpacity="0.8"
            strokeWidth="1.2"
          />

          {/* 베이스 러닝 라인 (선명한 화이트 초크 라인) */}
          <line x1="150" y1="110" x2="198" y2="72" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="3 2" />
          <line x1="198" y1="72" x2="150" y2="34" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="3 2" />
          <line x1="150" y1="34" x2="102" y2="72" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="3 2" />
          <line x1="102" y1="72" x2="150" y2="110" stroke="#ffffff" strokeWidth="2.2" strokeDasharray="3 2" />

          {/* 투수 마운드 (중앙) */}
          <circle cx="150" cy="72" r="8.5" fill="#b45309" stroke="#fcd34d" strokeWidth="1.4" />
          <rect x="145.5" y="70.5" width="9" height="2.8" fill="#ffffff" rx="0.8" />

          {/* 2루 베이스 (상단) */}
          <polygon
            points="150,27 157,34 150,41 143,34"
            fill={runners.second ? '#fbbf24' : '#ffffff'}
            stroke={runners.second ? '#fef08a' : '#cbd5e1'}
            strokeWidth="1.6"
            className="transition-colors duration-300"
          />
          {runners.second && (
            <circle cx="150" cy="34" r="10" fill="#fbbf24" opacity="0.45" className="animate-ping" />
          )}

          {/* 1루 베이스 (우측) */}
          <polygon
            points="198,65 205,72 198,79 191,72"
            fill={runners.first ? '#34d399' : '#ffffff'}
            stroke={runners.first ? '#a7f3d0' : '#cbd5e1'}
            strokeWidth="1.6"
            className="transition-colors duration-300"
          />
          {runners.first && (
            <circle cx="198" cy="72" r="10" fill="#34d399" opacity="0.45" className="animate-ping" />
          )}

          {/* 3루 베이스 (좌측) */}
          <polygon
            points="102,65 109,72 102,79 95,72"
            fill={runners.third ? '#fbbf24' : '#ffffff'}
            stroke={runners.third ? '#fef08a' : '#cbd5e1'}
            strokeWidth="1.6"
            className="transition-colors duration-300"
          />
          {runners.third && (
            <circle cx="102" cy="72" r="10" fill="#fbbf24" opacity="0.45" className="animate-ping" />
          )}

          {/* 홈플레이트 (하단 오각형) */}
          <polygon
            points="150,116 156,109 156,104 144,104 144,109"
            fill="#ffffff"
            stroke="#fbbf24"
            strokeWidth="1.5"
          />
        </svg>

        {/* 투구 중 3D 야구공 비행 애니메이션 */}
        {isPitching && (
          <div className="absolute top-[72px] left-[150px] -translate-x-1/2 -translate-y-1/2 z-20 animate-pitch pointer-events-none">
            <img
              src={BASEBALL_ASSETS.ball}
              alt="Pitching Ball"
              className="w-5 h-5 rounded-full object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] animate-spin"
            />
          </div>
        )}

        {/* 출루 주자 헬멧 마커 표시 */}
        {runners.first && (
          <div className="absolute top-[70px] left-[198px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-slate-900/90 border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] flex items-center justify-center p-0.5 animate-bounce">
              <img src={BASEBALL_ASSETS.runnerHelmet} alt="1루 주자" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
        {runners.second && (
          <div className="absolute top-[32px] left-[150px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-slate-900/90 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] flex items-center justify-center p-0.5 animate-bounce">
              <img src={BASEBALL_ASSETS.runnerHelmet} alt="2루 주자" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
        {runners.third && (
          <div className="absolute top-[70px] left-[102px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <div className="w-6 h-6 rounded-full bg-slate-900/90 border-2 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] flex items-center justify-center p-0.5 animate-bounce">
              <img src={BASEBALL_ASSETS.runnerHelmet} alt="3루 주자" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
      </div>

      {/* 판정 플로팅 오버레이 배너 (실제 스포츠 방송 중계 자막 바 스타일) */}
      <div className="relative z-10 w-full mt-0.5">
        {pitchEffect ? (
          <div
            key={pitchEffect.key}
            className={`w-full text-center py-1 px-2.5 rounded-xl border font-black text-[11px] transition-all shadow-md animate-pop flex items-center justify-center gap-1.5 ${
              pitchEffect.type === 'HOMERUN'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-slate-950 border-white'
                : pitchEffect.type === 'HIT'
                ? 'bg-emerald-600/95 text-white border-emerald-300'
                : pitchEffect.type === 'STRIKE'
                ? 'bg-indigo-600/95 text-white border-indigo-300'
                : pitchEffect.type === 'BALL'
                ? 'bg-amber-500/95 text-slate-950 border-amber-200'
                : 'bg-rose-600/95 text-white border-rose-300'
            }`}
          >
            <img src={BASEBALL_ASSETS.ball} alt="" className="w-3.5 h-3.5 rounded-full object-contain shrink-0" />
            <span>{pitchEffect.message}</span>
          </div>
        ) : (
          <div className="w-full text-center text-[10px] font-bold text-emerald-100/95 bg-slate-950/65 backdrop-blur-xs rounded-xl py-1 px-2 border border-white/15 flex items-center justify-center gap-1.5">
            <img src={BASEBALL_ASSETS.ball} alt="" className="w-3.5 h-3.5 rounded-full object-contain shrink-0" />
            <span>번호를 입력하고 [투구]를 눌러 타석을 공략하세요</span>
          </div>
        )}
      </div>
    </div>
  );
}
