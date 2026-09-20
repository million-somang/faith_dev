import { BaseRunners, PitchEffect } from '../types/baseball';

interface BaseballDiamondProps {
  runners: BaseRunners;
  isPitching: boolean;
  pitchEffect: PitchEffect | null;
  inputDigits: string[];
}

export default function BaseballDiamond({
  runners,
  isPitching,
  pitchEffect,
  inputDigits,
}: BaseballDiamondProps) {
  return (
    <div className="relative w-full bg-gradient-to-b from-emerald-50 via-slate-50 to-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden p-3 flex flex-col items-center">
      {/* 1. 현재 입력 대기 숫자 표시 바 (Home Plate 인근) */}
      <div className="w-full flex items-center justify-between px-2 mb-1.5 z-10">
        <div className="flex items-center gap-1 text-[11px] font-black text-slate-700">
          <i className="fas fa-crosshairs text-indigo-600 text-xs"></i>
          <span>투구할 3자리 숫자:</span>
        </div>
        <div className="flex gap-1.5 font-mono">
          {[0, 1, 2].map((idx) => (
            <span
              key={idx}
              className={`w-7 h-7 rounded-lg border flex items-center justify-center text-sm font-black transition-all ${
                inputDigits[idx]
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-300 border-slate-200 border-dashed'
              }`}
            >
              {inputDigits[idx] || '?'}
            </span>
          ))}
        </div>
      </div>

      {/* 2. 벡터 다이아몬드 구장 캔버스 (SVG 280 x 170) */}
      <div className="relative w-full max-w-[340px] h-[170px] flex items-center justify-center">
        <svg viewBox="0 0 300 160" className="w-full h-full drop-shadow-sm select-none">
          <defs>
            {/* 외야 잔디 그라데이션 */}
            <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
            </linearGradient>

            {/* 내야 흙 그라데이션 */}
            <radialGradient id="dirtGrad" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fed7aa" />
            </radialGradient>
          </defs>

          {/* 외야 잔디 부채꼴 */}
          <path
            d="M 150 145 L 30 50 A 170 170 0 0 1 270 50 Z"
            fill="url(#grassGrad)"
            stroke="#a7f3d0"
            strokeWidth="1.5"
          />

          {/* 내야 흙 원형 영역 */}
          <ellipse cx="150" cy="85" rx="80" ry="55" fill="url(#dirtGrad)" stroke="#fcd34d" strokeWidth="1.2" />

          {/* 내야 잔디 다이아몬드 내부 */}
          <polygon points="150,45 205,85 150,125 95,85" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1" />

          {/* 베이스 러닝 라인 (하얀 분필 라인) */}
          <line x1="150" y1="130" x2="205" y2="85" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 2" />
          <line x1="205" y1="85" x2="150" y2="40" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 2" />
          <line x1="150" y1="40" x2="95" y2="85" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 2" />
          <line x1="95" y1="85" x2="150" y2="130" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="3 2" />

          {/* 투수 마운드 (중앙) */}
          <circle cx="150" cy="85" r="9" fill="#fed7aa" stroke="#f59e0b" strokeWidth="1.5" />
          <rect x="145" y="83.5" width="10" height="3" fill="#ffffff" rx="1" />

          {/* 2루 베이스 (상단) */}
          <polygon
            points="150,33 157,40 150,47 143,40"
            fill={runners.second ? '#f59e0b' : '#ffffff'}
            stroke={runners.second ? '#d97706' : '#94a3b8'}
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          {runners.second && (
            <circle cx="150" cy="40" r="10" fill="#f59e0b" opacity="0.25" className="animate-ping" />
          )}

          {/* 1루 베이스 (우측) */}
          <polygon
            points="205,78 212,85 205,92 198,85"
            fill={runners.first ? '#10b981' : '#ffffff'}
            stroke={runners.first ? '#047857' : '#94a3b8'}
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          {runners.first && (
            <circle cx="205" cy="85" r="10" fill="#10b981" opacity="0.25" className="animate-ping" />
          )}

          {/* 3루 베이스 (좌측) */}
          <polygon
            points="95,78 102,85 95,92 88,85"
            fill={runners.third ? '#f59e0b' : '#ffffff'}
            stroke={runners.third ? '#d97706' : '#94a3b8'}
            strokeWidth="2"
            className="transition-colors duration-300"
          />
          {runners.third && (
            <circle cx="95" cy="85" r="10" fill="#f59e0b" opacity="0.25" className="animate-ping" />
          )}

          {/* 홈플레이트 (하단 오각형) */}
          <polygon points="150,135 156,128 156,123 144,123 144,128" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
        </svg>

        {/* 투구 중 야구공 비행 애니메이션 */}
        {isPitching && (
          <div className="absolute top-[85px] left-[150px] -translate-x-1/2 -translate-y-1/2 z-20 animate-pitch pointer-events-none">
            <div className="w-5 h-5 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-[10px]">
              ⚾
            </div>
          </div>
        )}

        {/* 출루 주자 아이콘 표시 */}
        {runners.first && (
          <div className="absolute top-[85px] left-[205px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-xs">
            🏃
          </div>
        )}
        {runners.second && (
          <div className="absolute top-[40px] left-[150px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-xs">
            🏃
          </div>
        )}
        {runners.third && (
          <div className="absolute top-[85px] left-[95px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-xs">
            🏃
          </div>
        )}
      </div>

      {/* 3. 판정 플로팅 오버레이 배너 (실제 야구 중계 효과) */}
      {pitchEffect && (
        <div
          key={pitchEffect.key}
          className={`w-full text-center py-1.5 px-3 rounded-xl border font-black text-xs transition-all shadow-xs animate-pop ${
            pitchEffect.type === 'HOMERUN'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-amber-300 shadow-amber-200'
              : pitchEffect.type === 'HIT'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : pitchEffect.type === 'STRIKE'
              ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
              : pitchEffect.type === 'BALL'
              ? 'bg-amber-50 text-amber-800 border-amber-300'
              : 'bg-rose-50 text-rose-800 border-rose-300'
          }`}
        >
          {pitchEffect.message}
        </div>
      )}
    </div>
  );
}
