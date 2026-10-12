'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const PortalNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: '스마트도구', href: '/utility', icon: 'fa-calculator' },
    { label: '미니게임', href: '/game', icon: 'fa-gamepad' },
    { label: '지식가이드', href: '/guides', icon: 'fa-book-open', highlight: true },
    { label: '금융시세', href: '/finance', icon: 'fa-chart-line' },
  ];

  return (
    <>
      <header className="header-gradient text-white shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl font-black tracking-wider bg-white text-blue-600 px-2 py-0.5 rounded-lg shadow-sm">
                VERA
              </span>
              <span className="text-sm font-semibold text-blue-100 hidden sm:inline">
                통합 라이프 포털
              </span>
            </Link>
          </div>

          {/* 데스크톱 메뉴 */}
          <nav className="hidden md:flex items-center gap-2 text-sm font-bold text-white/90">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-white/20 text-white font-black'
                      : 'hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <i className={`fas ${item.icon} text-xs opacity-80`}></i>
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full font-black ml-0.5">
                      HOT
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* 모바일 햄버거 버튼 */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="메뉴 열기"
            >
              <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'} text-lg`}></i>
            </button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-blue-950/95 backdrop-blur-md border-t border-white/10 px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <i className={`fas ${item.icon} text-xs text-blue-300 w-4 text-center`}></i>
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="text-[10px] bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded font-black">
                      추천
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
};
