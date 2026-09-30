import React from 'react';

export type AppDosaMood = 'idle' | 'loading' | 'result' | 'winking' | 'sparkle';

interface AppDosaCharacterProps {
  mood?: AppDosaMood;
  size?: 'sm' | 'md' | 'lg';
  speechBubble?: string;
  onClick?: () => void;
  className?: string;
}

export const AppDosaCharacter: React.FC<AppDosaCharacterProps> = ({
  mood = 'idle',
  size = 'md',
  speechBubble,
  onClick,
  className = '',
}) => {
  // Dimensions
  const dims = {
    sm: { w: 100, h: 100, viewH: 140 },
    md: { w: 140, h: 140, viewH: 160 },
    lg: { w: 180, h: 180, viewH: 190 },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 1. 사이다 말풍선 (Speech Bubble) */}
      {speechBubble && (
        <div className="relative mb-2 px-3 py-1.5 bg-white border border-indigo-200/90 rounded-2xl shadow-md text-slate-800 text-xs font-bold leading-relaxed max-w-[280px] text-center animate-bounce-subtle z-10">
          <span className="text-indigo-600 font-extrabold mr-1">💬</span>
          {speechBubble}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-indigo-200/90 rotate-45"></div>
        </div>
      )}

      {/* 2. 메인 벡터 캐릭터 (100% SVG) */}
      <div className="relative transition-transform duration-300 hover:scale-105 active:scale-95">
        {/* 신비로운 오행 후광 오라 (Aura) */}
        <div
          className={`absolute -inset-2 rounded-full blur-xl transition-all duration-700 pointer-events-none ${
            mood === 'loading'
              ? 'bg-gradient-to-tr from-amber-400 via-indigo-500 to-rose-400 opacity-40 animate-spin-slow'
              : mood === 'result'
              ? 'bg-gradient-to-tr from-indigo-500 via-sky-400 to-emerald-400 opacity-35 animate-pulse'
              : 'bg-indigo-300/25 opacity-20'
          }`}
        />

        <svg
          width={dims.w}
          height={dims.h}
          viewBox="0 0 160 160"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-1"
        >
          <defs>
            {/* 부드러운 그라데이션 */}
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E0E7FF" />
            </linearGradient>
            <linearGradient id="robeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#312E81" />
            </linearGradient>
            <linearGradient id="gatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
            <linearGradient id="headphoneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <linearGradient id="tabletGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F8FAFC" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* A. 둥실둥실 구름 베이스 (Cloud) */}
          <g className="animate-float-cloud">
            <ellipse cx="80" cy="144" rx="46" ry="12" fill="url(#cloudGrad)" filter="url(#softShadow)" />
            <circle cx="56" cy="140" r="11" fill="url(#cloudGrad)" />
            <circle cx="104" cy="140" r="11" fill="url(#cloudGrad)" />
            <circle cx="80" cy="136" r="14" fill="#FFFFFF" />
            {/* 구름 속 작은 빛 파티클 */}
            <circle cx="48" cy="138" r="1.5" fill="#818CF8" opacity="0.6" />
            <circle cx="112" cy="138" r="1.5" fill="#38BDF8" opacity="0.6" />
          </g>

          {/* B. 캐릭터 바디 (MZ 트렌디 도사) */}
          <g className="animate-dosa-bounce">
            {/* 1. 도포 (Trendy Modern Robe) */}
            <path
              d="M52 110 C52 96 64 88 80 88 C96 88 108 96 108 110 L115 135 C115 138 112 140 108 140 L52 140 C48 140 45 138 45 135 Z"
              fill="url(#robeGrad)"
              filter="url(#softShadow)"
            />
            {/* 도포 옷깃 (Modern Lapel) */}
            <path d="M72 88 L80 112 L88 88" stroke="#E0E7FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M80 112 L80 140" stroke="#CBD5E1" strokeWidth="1.5" strokeDasharray="3 2" />

            {/* 도포 허리띠 (Belt) */}
            <rect x="62" y="118" width="36" height="5" rx="2.5" fill="#F59E0B" />
            <circle cx="80" cy="120.5" r="3.5" fill="#FEF3C7" stroke="#D97706" strokeWidth="1" />

            {/* 2. 목 & 얼굴 */}
            <rect x="74" y="82" width="12" height="10" rx="3" fill="#FED7AA" />
            <circle cx="80" cy="68" r="24" fill="#FFEDD5" filter="url(#softShadow)" />

            {/* 3. 볼 터치 (Blush) */}
            <circle cx="64" cy="74" r="4.5" fill="#FCA5A5" opacity="0.6" />
            <circle cx="96" cy="74" r="4.5" fill="#FCA5A5" opacity="0.6" />

            {/* 4. 표정 (Eyes, Eyebrows, Mouth based on mood) */}
            {mood === 'loading' ? (
              // 집중 모드: 감은 눈 (부드러운 호선)
              <g>
                <path d="M66 68 Q72 64 76 68" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M84 68 Q88 64 94 68" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <ellipse cx="80" cy="78" rx="2.5" ry="1.5" fill="#E11D48" />
              </g>
            ) : mood === 'result' || mood === 'winking' ? (
              // 결과/도출 모드: 윙크 & 활짝 웃는 입
              <g>
                {/* 왼쪽 윙크 */}
                <path d="M65 69 Q70 63 76 68" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* 오른쪽 초롱초롱한 눈 */}
                <circle cx="90" cy="67" r="4" fill="#0F172A" />
                <circle cx="91.5" cy="65.5" r="1.5" fill="#FFFFFF" />
                {/* 활짝 웃는 입 */}
                <path d="M74 76 Q80 84 86 76" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="#E11D48" />
              </g>
            ) : (
              // 평상시(idle): 맑고 총명한 눈
              <g>
                <circle cx="70" cy="67" r="3.5" fill="#0F172A" />
                <circle cx="71.5" cy="65.5" r="1.2" fill="#FFFFFF" />
                <circle cx="90" cy="67" r="3.5" fill="#0F172A" />
                <circle cx="91.5" cy="65.5" r="1.2" fill="#FFFFFF" />
                <path d="M76 76 Q80 80 84 76" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>
            )}

            {/* 5. 힙한 무선 헤드폰 (Headphones) */}
            <g>
              {/* 헤드밴드 (갓 밑으로 통과) */}
              <path d="M54 62 C54 48 106 48 106 62" stroke="url(#headphoneGrad)" strokeWidth="4" strokeLinecap="round" fill="none" />
              {/* 왼쪽 이어컵 */}
              <rect x="50" y="60" width="8" height="15" rx="4" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
              <circle cx="54" cy="67.5" r="2" fill="#BAE6FD" />
              {/* 오른쪽 이어컵 */}
              <rect x="102" y="60" width="8" height="15" rx="4" fill="#0284C7" stroke="#38BDF8" strokeWidth="1" />
              <circle cx="106" cy="67.5" r="2" fill="#BAE6FD" />
            </g>

            {/* 6. MZ 갓 (Modern Gat) */}
            <g>
              {/* 갓 챙 (Brim) */}
              <ellipse cx="80" cy="48" rx="42" ry="7" fill="url(#gatGrad)" filter="url(#softShadow)" />
              <ellipse cx="80" cy="48" rx="42" ry="7" stroke="#6366F1" strokeWidth="0.8" opacity="0.6" fill="none" />
              {/* 갓 대 (Crown) */}
              <path d="M66 48 L70 24 C70 22 90 22 90 24 L94 48 Z" fill="url(#gatGrad)" />
              {/* 갓 꼭지 장식 (옥로) */}
              <circle cx="80" cy="21" r="3" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1" />
              {/* 반투명 갓끈 (Modern Neon Gat Strings) */}
              <path d="M68 49 C64 64 68 84 74 94" stroke="#818CF8" strokeWidth="1.2" opacity="0.85" fill="none" />
              <path d="M92 49 C96 64 92 84 86 94" stroke="#818CF8" strokeWidth="1.2" opacity="0.85" fill="none" />
            </g>

            {/* 7. 소품: 스마트패드(도술 태블릿) & 손 */}
            <g>
              {/* 태블릿 본체 */}
              <rect
                x="62"
                y="102"
                width="36"
                height="24"
                rx="4"
                fill="url(#tabletGrad)"
                stroke="#6366F1"
                strokeWidth="1.5"
                filter="url(#softShadow)"
              />
              {/* 태블릿 화면 (천기누설 오행 그래픽) */}
              <rect x="65" y="105" width="30" height="18" rx="2" fill="#1E1B4B" />
              {/* 태블릿 화면 속 오행 빛 마크 */}
              <circle cx="80" cy="114" r="4.5" fill="#4F46E5" />
              <circle cx="80" cy="114" r="2" fill="#38BDF8" className="animate-ping" />
              {/* 양손 (귀여운 도포 소매 끝 손) */}
              <circle cx="61" cy="114" r="4" fill="#FED7AA" />
              <circle cx="99" cy="114" r="4" fill="#FED7AA" />
            </g>

            {/* 엄지척 또는 도술 스파클 이펙트 */}
            {mood === 'result' && (
              <g className="animate-bounce">
                {/* 우측 엄지척 */}
                <rect x="100" y="104" width="8" height="6" rx="3" fill="#FED7AA" />
                <path d="M104 105 L104 98 C104 96 107 96 107 98 L107 105" stroke="#FED7AA" strokeWidth="3" strokeLinecap="round" />
                {/* 반짝이 별 */}
                <path d="M118 80 L120 85 L125 87 L120 89 L118 94 L116 89 L111 87 L116 85 Z" fill="#FBBF24" />
                <path d="M42 85 L44 89 L48 90 L44 91 L42 95 L40 91 L36 90 L40 89 Z" fill="#38BDF8" />
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* 상태 태그 */}
      <div className="mt-1 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-100/80 shadow-2xs">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
        <span className="text-[10px] font-extrabold text-indigo-700 tracking-wider">
          VERANEX 앱도사
        </span>
      </div>
    </div>
  );
};

export default AppDosaCharacter;
