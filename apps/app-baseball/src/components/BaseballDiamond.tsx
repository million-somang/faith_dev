import { BaseRunners, PitchEffect } from '../types/baseball';

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
    <div className="relative w-full bg-gradient-to-b from-emerald-50 via-slate-50 to-white rounded-2xl border border-slate-200/90 shadow-[4px_4px_10px_#d1d9e6,-4px_-4px_10px_#ffffff] overflow-hidden p-2 flex flex-col items-center">
      {/* 벡터 다이아몬드 구장 캔버스 (SVG 300 x 135) */}
      <div className="relative w-full max-w-[310px] h-[120px] flex items-center justify-center">
        <svg viewBox="0 0 300 135" className="w-full h-full drop-shadow-xs select-none">
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
            d="M 150 125 L 45 42 A 150 150 0 0 1 255 42 Z"
            fill="url(#grassGrad)"
            stroke="#a7f3d0"
            strokeWidth="1.2"
          />

          {/* 내야 흙 원형 영역 */}
          <ellipse cx="150" cy="72" rx="72" ry="46" fill="url(#dirtGrad)" stroke="#fcd34d" strokeWidth="1" />

          {/* 내야 잔디 다이아몬드 내부 */}
          <polygon points="150,36 198,72 150,108 102,72" fill="#ecfdf5" stroke="#6ee7b7" strokeWidth="1" />

          {/* 베이스 러닝 라인 (하얀 분필 라인) */}
          <line x1="150" y1="110" x2="198" y2="72" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="198" y1="72" x2="150" y2="34" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="150" y1="34" x2="102" y2="72" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
          <line x1="102" y1="72" x2="150" y2="110" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />

          {/* 투수 마운드 (중앙) */}
          <circle cx="150" cy="72" r="8" fill="#fed7aa" stroke="#f59e0b" strokeWidth="1.2" />
          <rect x="146" y="70.5" width="8" height="2.5" fill="#ffffff" rx="0.5" />

          {/* 2루 베이스 (상단) */}
          <polygon
            points="150,28 156,34 150,40 144,34"
            fill={runners.second ? '#f59e0b' : '#ffffff'}
            stroke={runners.second ? '#d97706' : '#94a3b8'}
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
          {runners.second && (
            <circle cx="150" cy="34" r="8" fill="#f59e0b" opacity="0.3" className="animate-ping" />
          )}

          {/* 1루 베이스 (우측) */}
          <polygon
            points="198,66 204,72 198,78 192,72"
            fill={runners.first ? '#10b981' : '#ffffff'}
            stroke={runners.first ? '#047857' : '#94a3b8'}
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
          {runners.first && (
            <circle cx="198" cy="72" r="8" fill="#10b981" opacity="0.3" className="animate-ping" />
          )}

          {/* 3루 베이스 (좌측) */}
          <polygon
            points="102,66 108,72 102,78 96,72"
            fill={runners.third ? '#f59e0b' : '#ffffff'}
            stroke={runners.third ? '#d97706' : '#94a3b8'}
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />
          {runners.third && (
            <circle cx="102" cy="72" r="8" fill="#f59e0b" opacity="0.3" className="animate-ping" />
          )}

          {/* 홈플레이트 (하단 오각형) */}
          <polygon points="150,115 155,109 155,105 145,105 145,109" fill="#ffffff" stroke="#334155" strokeWidth="1.2" />
        </svg>

        {/* 투구 중 야구공 비행 애니메이션 */}
        {isPitching && (
          <div className="absolute top-[72px] left-[150px] -translate-x-1/2 -translate-y-1/2 z-20 animate-pitch pointer-events-none">
            <div className="w-4 h-4 rounded-full bg-white border border-slate-300 shadow-md flex items-center justify-center text-[8px]">
              ⚾
            </div>
          </div>
        )}

        {/* 출루 주자 아이콘 표시 */}
        {runners.first && (
          <div className="absolute top-[72px] left-[198px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-[11px]">
            🏃
          </div>
        )}
        {runners.second && (
          <div className="absolute top-[34px] left-[150px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-[11px]">
            🏃
          </div>
        )}
        {runners.third && (
          <div className="absolute top-[72px] left-[102px] -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none text-[11px]">
            🏃
          </div>
        )}
      </div>

      {/* 판정 플로팅 오버레이 배너 (실제 야구 중계 효과 - 슬림형) */}
      {pitchEffect ? (
        <div
          key={pitchEffect.key}
          className={`w-full text-center py-1 px-2 rounded-xl border font-black text-[11px] transition-all shadow-2xs animate-pop ${
            pitchEffect.type === 'HOMERUN'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-amber-300'
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
      ) : (
        <div className="text-[10px] font-semibold text-slate-400 py-0.5">
          ⚾ 번호를 입력하고 [투구]를 눌러 타석을 공략하세요
        </div>
      )}
    </div>
  );
}
