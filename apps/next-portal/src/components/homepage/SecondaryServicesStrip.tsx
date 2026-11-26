import React from 'react';
import Link from 'next/link';

interface SecondaryServiceItem {
  label: string;
  desc: string;
  href: string;
  icon: string;
  accentBg: string;
  accentText: string;
}

const SECONDARY_SERVICES: SecondaryServiceItem[] = [
  {
    label: '정통 사주 · 만세력',
    desc: '오행 분석 & 오늘의 운세',
    href: '/entertainment/saju',
    icon: 'fa-yin-yang',
    accentBg: 'bg-violet-50 border-violet-100',
    accentText: 'text-violet-600',
  },
  {
    label: '전국 · 해외 여행',
    desc: '테마별 명소 & 코스 가이드',
    href: '/entertainment/travel',
    icon: 'fa-plane-departure',
    accentBg: 'bg-sky-50 border-sky-100',
    accentText: 'text-sky-600',
  },
  {
    label: '웹소설 연재관',
    desc: '판타지 · 무협 무료 열람',
    href: '/entertainment/novel',
    icon: 'fa-book-open',
    accentBg: 'bg-rose-50 border-rose-100',
    accentText: 'text-rose-600',
  },
  {
    label: '배당 · DSR 금융',
    desc: '대출한도 & 배당 시뮬레이터',
    href: '/finance/util',
    icon: 'fa-chart-pie',
    accentBg: 'bg-emerald-50 border-emerald-100',
    accentText: 'text-emerald-600',
  },
  {
    label: '실시간 라운지',
    desc: '이슈 토론 & 생활 커뮤니티',
    href: '/lounge',
    icon: 'fa-comments',
    accentBg: 'bg-fuchsia-50 border-fuchsia-100',
    accentText: 'text-fuchsia-600',
  },
];

export const SecondaryServicesStrip: React.FC = () => {
  return (
    <section
      aria-label="VERA 부가 서비스 바로가기"
      className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <i className="fas fa-compass text-indigo-500"></i>
          <span>함께 즐기는 VERA 서비스</span>
        </h2>
        <span className="text-[11px] font-semibold text-slate-400">사주 · 여행 · 웹소설 · 금융 · 라운지</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {SECONDARY_SERVICES.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:bg-slate-50/80 transition-all min-w-0"
          >
            <span
              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${item.accentBg} ${item.accentText}`}
            >
              <i className={`fas ${item.icon} text-sm`}></i>
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-[13px] font-extrabold text-slate-900 group-hover:text-indigo-700 truncate">
                {item.label}
              </h3>
              <p className="text-[11px] text-slate-500 truncate">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default SecondaryServicesStrip;
