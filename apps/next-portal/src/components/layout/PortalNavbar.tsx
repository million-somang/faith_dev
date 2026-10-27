'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export const FULL_MENU_ITEMS = [
  { label: '홈', icon: 'fa-home', bg: 'bg-blue-50', color: 'text-blue-600', path: '/' },
  { label: '마이페이지', icon: 'fa-user', bg: 'bg-indigo-50', color: 'text-indigo-600', path: '/mypage' },
  { label: '뉴스', icon: 'fa-newspaper', bg: 'bg-sky-50', color: 'text-sky-600', path: '/news' },
  { label: '생활도구', icon: 'fa-screwdriver-wrench', bg: 'bg-green-50', color: 'text-green-600', path: '/lifestyle' },
  { label: '금융', icon: 'fa-won-sign', bg: 'bg-orange-50', color: 'text-orange-600', path: '/finance' },
  { label: '게임', icon: 'fa-gamepad', bg: 'bg-purple-50', color: 'text-purple-600', path: '/game' },
  { label: '재미', icon: 'fa-masks-theater', bg: 'bg-rose-50', color: 'text-rose-600', path: '/entertainment' },
  { label: '라운지', icon: 'fa-comments', bg: 'bg-violet-50', color: 'text-violet-600', path: '/lounge' },
  { label: '지식 가이드', icon: 'fa-book-open-reader', bg: 'bg-teal-50', color: 'text-teal-600', path: '/guides' },
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
      className="flex items-center gap-1 text-[10px] sm:text-xs font-black px-2 sm:px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer shadow-xs"
      title={lang === 'ko' ? 'English로 변경' : '한국어로 변경'}
    >
      <span>{lang === 'ko' ? '🇰🇷 KO' : '🇺🇸 EN'}</span>
    </button>
  );
};

export const PortalNavbar: React.FC = () => {
  const { user, logout } = useAuth();
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
    if (activeMode === mode) return;
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_8px_rgba(15,30,80,0.06)]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 flex justify-between items-center h-14">
        {/* 좌측: 로고 (모바일 좌측 정렬, 햄버거 메뉴 제거) 및 데스크탑 네비게이션 */}
        <div className="flex items-center gap-2 sm:gap-6 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity flex-shrink-0"
            aria-label="VERA 홈으로 이동"
          >
            <img
              src="/logo-192.png"
              alt="VERA Logo"
              className="w-8 h-8 rounded-lg object-contain drop-shadow-xs"
            />
            <span className="font-black text-xl tracking-wider text-gray-900 select-none">
              V<span className={modeColor}>ERA</span>
            </span>
          </Link>

          {/* 데스크탑 네비게이션 메뉴 */}
          {activeMode === 'general' && (
            <nav className="hidden md:flex items-center gap-1 text-sm font-bold text-gray-600">
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
              <Link
                href="/guides"
                className={`px-2.5 lg:px-3 py-1.5 rounded-lg ${modeBg} transition-colors text-teal-700 font-extrabold`}
              >
                지식 가이드
              </Link>
            </nav>
          )}
        </div>

        {/* 우측: 모드 스위처 + 언어 설정 + 인증 (Flex로 나란히 배치하여 겹침 근본 방지) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* 포털 / 라운지 스위처 */}
          <div className="flex items-center p-0.5 bg-slate-100 border border-slate-200/60 rounded-full text-[10px] sm:text-xs font-black text-slate-500 shadow-inner">
            <button
              onClick={() => handleModeSwitch('general')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all cursor-pointer ${
                activeMode === 'general'
                  ? 'bg-white text-blue-600 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              포털
            </button>
            <button
              onClick={() => handleModeSwitch('lounge')}
              className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full transition-all cursor-pointer ${
                activeMode === 'lounge'
                  ? 'bg-white text-fuchsia-600 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              라운지
            </button>
          </div>

          {/* 언어 변경 */}
          <LanguageSwitcher />

          {/* 로그인 / 회원가입 / 마이페이지 / 로그아웃 */}
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden md:inline text-xs font-bold text-gray-500">{user.name}님</span>
              <Link
                href="/mypage"
                className={`hidden md:inline-block text-xs font-bold text-gray-600 ${modeColor} transition-colors`}
              >
                마이페이지
              </Link>
              <button
                onClick={logout}
                className="text-xs font-bold px-2.5 sm:px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/login"
                className="text-xs font-bold px-2 sm:px-2.5 py-1 text-gray-600 hover:text-blue-600 transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="hidden md:inline-block text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
              >
                회원가입
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
