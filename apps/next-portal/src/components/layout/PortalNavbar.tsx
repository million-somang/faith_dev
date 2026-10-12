'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const FULL_MENU_ITEMS = [
  { label: '홈', icon: 'fa-home', bg: 'bg-blue-50', color: 'text-blue-600', path: '/' },
  { label: '뉴스', icon: 'fa-newspaper', bg: 'bg-sky-50', color: 'text-sky-600', path: '/news' },
  { label: '생활도구', icon: 'fa-screwdriver-wrench', bg: 'bg-green-50', color: 'text-green-600', path: '/lifestyle' },
  { label: '금융', icon: 'fa-won-sign', bg: 'bg-orange-50', color: 'text-orange-600', path: '/finance' },
  { label: '게임', icon: 'fa-gamepad', bg: 'bg-purple-50', color: 'text-purple-600', path: '/game' },
  { label: '재미', icon: 'fa-masks-theater', bg: 'bg-rose-50', color: 'text-rose-600', path: '/entertainment' },
  { label: '지식 가이드', icon: 'fa-book-open-reader', bg: 'bg-teal-50', color: 'text-teal-600', path: '/guides' },
  { label: '라운지', icon: 'fa-comments', bg: 'bg-violet-50', color: 'text-violet-600', path: '/lounge' },
  { label: '마이페이지', icon: 'fa-user', bg: 'bg-indigo-50', color: 'text-indigo-600', path: '/mypage' },
  { label: '리워드', icon: 'fa-gift', bg: 'bg-amber-50', color: 'text-amber-600', path: '/reward' },
  { label: '홈페이지 제작', icon: 'fa-magic', bg: 'bg-emerald-50', color: 'text-emerald-600', path: '/b2b' },
];

export const LanguageSwitcher = () => {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('user_lang');
      if (saved === 'ko' || saved === 'en') {
        setLang(saved);
      }
    }
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'ko' ? 'en' : 'ko';
    setLang(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_lang', nextLang);
      window.location.reload();
    }
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer shadow-sm"
      title={lang === 'ko' ? 'English로 변경' : '한국어로 변경'}
    >
      <span>{lang === 'ko' ? '🇰🇷 KO' : '🇺🇸 EN'}</span>
    </button>
  );
};

export const PortalNavbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'general' | 'lounge'>('general');
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      let mode: 'general' | 'lounge' = 'general';
      if (path.startsWith('/lounge')) mode = 'lounge';
      setActiveMode(mode);
      localStorage.setItem('vera_portal_mode', mode);
    }
  }, [pathname]);

  const handleModeSwitch = (mode: 'general' | 'lounge') => {
    setActiveMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('vera_portal_mode', mode);
      if (mode === 'lounge') {
        window.location.href = '/lounge';
      } else {
        window.location.href = '/';
      }
    }
  };

  const modeColor = activeMode === 'lounge' ? 'text-fuchsia-600' : 'text-violet-600';
  const modeBg = activeMode === 'lounge' ? 'hover:bg-fuchsia-50 hover:text-fuchsia-600' : 'hover:bg-violet-50 hover:text-violet-600';

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_8px_rgba(15,30,80,0.06)]">
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-14 relative">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* 모바일/태블릿 전체메뉴 햄버거 (좌측 상단: md 미만 상시 표출) */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden w-9 h-9 -ml-1 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="전체메뉴 열기"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity absolute left-1/2 -translate-x-1/2 md:static md:left-auto md:translate-x-0"
            >
              <img
                src="/logo-192.png"
                alt="VERA Logo"
                className="w-8 h-8 rounded-lg object-contain drop-shadow-xs"
              />
              <span className="font-black text-xl tracking-wider text-gray-900">
                V<span className={modeColor}>ERA</span>
              </span>
            </Link>

            {/* 데스크탑/태블릿 모드 스위처 */}
            <div className="hidden lg:flex items-center p-0.5 bg-slate-100 border border-slate-200/50 rounded-full text-[10px] font-black text-slate-500 gap-0.5 ml-2 shadow-inner">
              {activeMode !== 'general' && (
                <button
                  onClick={() => handleModeSwitch('general')}
                  className="px-3 py-1 rounded-full transition-all cursor-pointer hover:text-slate-800"
                >
                  일반 포털
                </button>
              )}
              {activeMode !== 'lounge' && (
                <button
                  onClick={() => handleModeSwitch('lounge')}
                  className="px-3 py-1 rounded-full transition-all cursor-pointer hover:text-slate-800"
                >
                  라운지
                </button>
              )}
            </div>

            {/* 모바일 모드 스위처 */}
            <div className="flex lg:hidden items-center p-0.5 bg-slate-100 border border-slate-200/50 rounded-full text-[9px] font-extrabold text-slate-500 gap-0.5 ml-1 absolute right-4 md:static">
              {activeMode !== 'general' && (
                <button
                  onClick={() => handleModeSwitch('general')}
                  className="px-2 py-0.5 rounded-full transition-all"
                >
                  포털
                </button>
              )}
              {activeMode !== 'lounge' && (
                <button
                  onClick={() => handleModeSwitch('lounge')}
                  className="px-2 py-0.5 rounded-full transition-all"
                >
                  라운지
                </button>
              )}
            </div>

            {activeMode === 'general' && (
              <nav className="hidden md:flex gap-1 text-sm font-bold text-gray-600">
                <Link
                  href="/guides"
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors text-teal-700 font-extrabold`}
                >
                  지식 가이드
                </Link>
                <Link
                  href="/news"
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors`}
                >
                  뉴스
                </Link>
                <Link
                  href="/lifestyle"
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors`}
                >
                  생활도구
                </Link>
                <Link
                  href="/finance"
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors`}
                >
                  금융
                </Link>
                <Link
                  href="/game"
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors`}
                >
                  게임
                </Link>
                <Link
                  href="/entertainment"
                  className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors`}
                >
                  재미
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link
              href="/login"
              className="text-xs font-bold text-gray-600 hover:text-blue-600 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="hidden md:inline-block text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
            >
              회원가입
            </Link>
          </div>
        </div>
      </header>

      {/* 모바일/태블릿 전체메뉴 드로어 (왼쪽 슬라이드: md 미만 상시 가능) */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="전체메뉴">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)}></div>
          <div className="absolute top-0 left-0 h-full w-72 max-w-[80%] bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 flex-shrink-0">
              <span className="font-black text-lg text-gray-900">전체메뉴</span>
              <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <button
                  onClick={() => setMenuOpen(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                  aria-label="메뉴 닫기"
                >
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              {FULL_MENU_ITEMS.filter((m) => {
                if (m.path === '/reward') return false;
                if (activeMode === 'lounge') return false;
                return m.path !== '/b2b' && m.path !== '/lounge';
              }).map((m) => {
                const isMyPageItem = m.path === '/mypage';
                const itemLabel = isMyPageItem ? '로그인' : m.label;
                const itemPath = isMyPageItem ? '/login' : m.path;
                const itemIcon = isMyPageItem ? 'fa-sign-in-alt' : m.icon;
                const itemBg = isMyPageItem ? 'bg-blue-50' : m.bg;
                const itemColor = isMyPageItem ? 'text-blue-600' : m.color;

                return (
                  <Link
                    key={m.path}
                    href={itemPath}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-lg ${itemBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                      >
                        <i className={`fas ${itemIcon} ${itemColor}`}></i>
                      </span>
                      <span className="font-bold text-gray-800">{itemLabel}</span>
                    </div>
                    {m.label === '라운지' && (
                      <span className="text-[9px] bg-violet-100 text-violet-600 font-extrabold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-0.5">
                        HOT <i className="fas fa-fire text-[8px] text-violet-500"></i>
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};
