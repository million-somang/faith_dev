import React, { useState } from 'react';
import { UpscaleProcessingState } from '../types/index';

interface UpscaleProgressStageProps {
  readonly state: UpscaleProcessingState;
  readonly onCancel: () => void;
}

const STAGE_LABELS = [
  '1. 모델·엔진 준비',
  '2. 초해상도 복원',
  '3. 엣지 선명화',
  '4. 포맷 인코딩',
] as const;

const RING_RADIUS = 86;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const UpscaleProgressStage: React.FC<UpscaleProgressStageProps> = ({
  state,
  onCancel,
}) => {
  const [logoError, setLogoError] = useState(false);

  const clampedPercent = Math.max(1, Math.min(100, Math.round(state.overallPercent)));
  const dashOffset = RING_CIRCUMFERENCE * (1 - clampedPercent / 100);
  const liquidTopY = 100 - clampedPercent;
  const elapsedSec = (state.elapsedMs / 1000).toFixed(1);

  return (
    <section
      data-progress-stage={state.isCompleting ? 'completing' : 'active'}
      aria-live="polite"
      className={`bg-white rounded-3xl p-4 sm:p-7 border border-[#EBE6DD] border-t-4 shadow-lg space-y-4 animate-fade-in transition-colors duration-300 ${
        state.isCompleting ? 'border-t-emerald-500' : 'border-t-indigo-600'
      }`}
    >
      {/* 상단 엔진 · 배치 진행 배지 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EBE6DD] pb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black shadow-2xs ${
              state.isCompleting
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            <i
              className={`fas ${
                state.isCompleting ? 'fa-circle-check' : 'fa-wand-magic-sparkles animate-pulse'
              } text-[10px]`}
            ></i>
            <span>{state.isCompleting ? '100% 업스케일 완료!' : 'CSR 고화질 업스케일 실행 중'}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#DFD9CE] text-[10px] font-extrabold text-[#2D2A26]">
            {state.engineLabel}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-stone-500">
          <span>
            {state.currentIndex} / {state.totalCount}장
          </span>
          <span className="text-stone-300">•</span>
          <span>{elapsedSec}s</span>
        </div>
      </div>

      {/* 중앙 몰입형 비주얼: 1~100% 원형 네온 그라데이션 링 + 스파클 + 3D 회전 VeraNex 컬러 채움 디스크 */}
      <div className="flex flex-col items-center text-center pt-1">
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          {/* 외곽 회전 궤도 + 1~100% SVG 네온 그라데이션 링 + 스파클 이펙트 */}
          <svg
            viewBox="0 0 220 220"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="upscaleNeonRing" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={state.isCompleting ? '#10B981' : '#6366F1'} />
                <stop offset="52%" stopColor={state.isCompleting ? '#34D399' : '#8B5CF6'} />
                <stop offset="100%" stopColor={state.isCompleting ? '#059669' : '#06B6D4'} />
              </linearGradient>
              <filter id="upscaleNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* 회전하는 궤도 점선 링 */}
            <g className="animate-orbit-slow origin-center">
              <circle
                cx="110"
                cy="110"
                r="100"
                fill="none"
                stroke={state.isCompleting ? '#A7F3D0' : '#D8D2C5'}
                strokeWidth="1.25"
                strokeDasharray="4 8"
              />
            </g>

            {/* 트랙 원형 링 */}
            <circle
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="#ECE7DC"
              strokeWidth="10"
            />

            {/* 1~100% 실시간 네온 그라데이션 링 */}
            <circle
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="url(#upscaleNeonRing)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 110 110)"
              filter="url(#upscaleNeonGlow)"
              className="ring-progress-transition"
            />

            {/* 스파클 반짝임 포인트 */}
            <g className="animate-sparkle-a" fill="#6366F1">
              <path d="M188 44 L190 50 L196 52 L190 54 L188 60 L186 54 L180 52 L186 50 Z" />
            </g>
            <g className="animate-sparkle-b" fill="#06B6D4">
              <path d="M32 62 L33.8 67 L39 68.8 L33.8 70.6 L32 75.5 L30.2 70.6 L25 68.8 L30.2 67 Z" />
            </g>
            <g className="animate-sparkle-c" fill="#8B5CF6">
              <path d="M192 162 L193.8 167 L199 168.8 L193.8 170.6 L192 175.5 L190.2 170.6 L185 168.8 L190.2 167 Z" />
            </g>
            <circle cx="38" cy="166" r="3" fill="#818CF8" className="animate-sparkle-b" />
            <circle cx="110" cy="10" r="3.2" fill="#06B6D4" className="animate-sparkle-a" />
            <circle cx="110" cy="210" r="2.6" fill="#A855F7" className="animate-sparkle-c" />
          </svg>

          {/* 중앙 뉴모피즘 볼록 디스크: 아래→위 컬러 채움 + 3D 회전 VeraNex 엠블럼 */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-[#FAF8F5] nm-stage-disc overflow-hidden flex items-center justify-center border border-[#EBE6DD]">
            {/* 1~100% 아래에서 위로 차오르는 물결 컬러 필 */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="stageLiquidGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop
                    offset="0%"
                    stopColor={state.isCompleting ? '#10B981' : '#4F46E5'}
                    stopOpacity="0.24"
                  />
                  <stop
                    offset="55%"
                    stopColor={state.isCompleting ? '#34D399' : '#8B5CF6'}
                    stopOpacity="0.20"
                  />
                  <stop
                    offset="100%"
                    stopColor={state.isCompleting ? '#059669' : '#06B6D4'}
                    stopOpacity="0.28"
                  />
                </linearGradient>
                <clipPath id="stageFillHeightClip">
                  <rect x="0" y={liquidTopY} width="100" height={clampedPercent} />
                </clipPath>
              </defs>

              <rect
                x="0"
                y="0"
                width="100"
                height="100"
                fill="url(#stageLiquidGrad)"
                clipPath="url(#stageFillHeightClip)"
              />

              {/* 상단 수면 웨이브 밴드 */}
              <g clipPath="url(#stageFillHeightClip)">
                <g className="animate-wave-slide">
                  <path
                    d={`M 0 ${liquidTopY} Q 25 ${liquidTopY - 3} 50 ${liquidTopY} T 100 ${liquidTopY} T 150 ${liquidTopY} T 200 ${liquidTopY} L 200 ${liquidTopY + 8} L 0 ${liquidTopY + 8} Z`}
                    fill={state.isCompleting ? '#10B981' : '#6366F1'}
                    fillOpacity="0.24"
                  />
                </g>
              </g>
            </svg>

            {/* 3D 회전 VeraNex 공식 로고 엠블럼 */}
            <div
              className={`relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/95 border border-[#E6DFD3] shadow-sm flex items-center justify-center p-2.5 ${
                state.isCompleting ? 'animate-pop-celebrate ring-4 ring-emerald-200' : 'animate-emblem-spin-3d'
              }`}
            >
              {!logoError ? (
                <img
                  src="https://veranex.app/logo-192.png"
                  alt="VeraNex 3D Emblem"
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <span className="text-2xl font-black text-indigo-600">V</span>
              )}

              {state.isCompleting && (
                <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center shadow-md border-2 border-white animate-pop-celebrate">
                  <i className="fas fa-check"></i>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 대형 1~100% 숫자 카운터 + 상태 문구 */}
        <div className="mt-2 space-y-1">
          <div className="flex items-baseline justify-center gap-1">
            <span
              data-progress-percent={clampedPercent}
              className={`text-4xl sm:text-5xl font-mono font-black tracking-tight tabular-nums ${
                state.isCompleting ? 'text-emerald-600' : 'text-[#1E293B]'
              }`}
            >
              {clampedPercent}
            </span>
            <span
              className={`text-lg sm:text-xl font-mono font-black ${
                state.isCompleting ? 'text-emerald-500' : 'text-indigo-600'
              }`}
            >
              %
            </span>
          </div>
          <p className="text-xs sm:text-sm font-extrabold text-[#2D2A26] min-h-[20px]">
            {state.statusText}
          </p>
        </div>

        {/* 시머(Shimmer) 보조 리니어 게이지 */}
        <div className="relative w-full max-w-md h-3 rounded-full bg-[#ECE6DA] overflow-hidden shadow-inner mt-2.5">
          <svg
            viewBox="0 0 100 4"
            preserveAspectRatio="none"
            className="w-full h-full block rounded-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="linearBarGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={state.isCompleting ? '#10B981' : '#6366F1'} />
                <stop offset="55%" stopColor={state.isCompleting ? '#34D399' : '#8B5CF6'} />
                <stop offset="100%" stopColor={state.isCompleting ? '#059669' : '#06B6D4'} />
              </linearGradient>
            </defs>
            <rect
              x="0"
              y="0"
              width={clampedPercent}
              height="4"
              rx="2"
              fill="url(#linearBarGrad)"
            />
          </svg>
          {!state.isCompleting && (
            <div className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/55 to-transparent animate-shimmer-sweep" />
          )}
        </div>
      </div>

      {/* 4단계 실시간 파이프라인 칩 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {STAGE_LABELS.map((label, idx) => {
          const isDone = state.isCompleting || idx < state.stageIndex;
          const isCurrent = !state.isCompleting && idx === state.stageIndex;
          return (
            <div
              key={label}
              className={`px-2.5 py-2 rounded-xl text-[11px] font-black border flex items-center justify-center gap-1.5 transition-all ${
                isDone
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : isCurrent
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs ring-2 ring-indigo-100'
                    : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-400'
              }`}
            >
              <i
                className={`fas ${
                  isDone
                    ? 'fa-circle-check text-emerald-600'
                    : isCurrent
                      ? 'fa-spinner fa-spin text-indigo-600'
                      : 'fa-circle text-[7px] text-stone-300'
                }`}
              ></i>
              <span className="truncate">{label}</span>
            </div>
          );
        })}
      </div>

      {/* 현재 작업 중인 이미지 썸네일 + 스캔빔 + 해상도 카드 */}
      <div className="bg-[#FAF8F5] rounded-2xl p-3 sm:p-3.5 border border-[#E5DDD0] nm-inset-panel flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-white border border-[#DFD9CE] shrink-0">
            {state.currentPreviewUrl && (
              <img
                src={state.currentPreviewUrl}
                alt={state.currentFileName}
                className="w-full h-full object-cover"
              />
            )}
            {!state.isCompleting && (
              <div className="pointer-events-none absolute inset-x-0 h-3 bg-gradient-to-b from-transparent via-indigo-400/65 to-transparent animate-scan-beam" />
            )}
          </div>

          <div className="min-w-0 flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-[#2D2A26] truncate">
                {state.currentFileName}
              </span>
              {state.totalCount > 1 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white border border-[#DFD9CE] text-indigo-700 shrink-0">
                  {state.itemPercent}%
                </span>
              )}
            </div>
            <div className="text-[11px] font-mono font-bold text-indigo-700 mt-0.5">
              {state.currentOriginalDims} ➔ {state.currentTargetDims}
            </div>
          </div>
        </div>

        <span className="text-[10px] font-bold text-stone-500 hidden sm:inline-flex items-center gap-1 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-[#E5DDD0]">
          <i className="fas fa-lock text-emerald-600"></i>
          로컬 보안 실행
        </span>
      </div>

      {/* 하단 안내 + 작업 중단 버튼 */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1.5">
          <i className="fas fa-shield-alt text-emerald-600"></i>
          <span>서버 전송 없이 브라우저 내에서만 연산됩니다</span>
        </span>

        {!state.isCompleting && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <i className="fas fa-stop-circle"></i>
            <span>작업 중단</span>
          </button>
        )}
      </div>
    </section>
  );
};
