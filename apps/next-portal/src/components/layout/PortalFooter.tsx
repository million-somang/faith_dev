'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PortalFooter: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone)
    ) {
      setIsInstalled(true);
    }

    try {
      if (localStorage.getItem('faithlink_pwa_installed') === '1') {
        setIsInstalled(true);
      }
    } catch {
      // LocalStorage access restricted in some iframes
    }

    const nav = window.navigator as unknown as { getInstalledRelatedApps?: () => Promise<unknown[]> };
    if (typeof nav.getInstalledRelatedApps === 'function') {
      nav.getInstalledRelatedApps()
        .then((apps) => {
          if (apps && apps.length > 0) setIsInstalled(true);
        })
        .catch(() => {});
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalling(false);
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('faithlink_pwa_installed', '1');
      } catch {}
      setTimeout(() => {
        alert('VERA 앱이 성공적으로 설치되었습니다!');
      }, 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      alert('이미 VERA 앱이 기기에 설치되어 있습니다.\n홈 화면에서 아이콘을 찾아 실행해 보세요.');
      return;
    }

    if (!deferredPrompt) {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isKakao = userAgent.includes('kakaotalk');
      const isNaver = userAgent.includes('naver');

      if (isKakao || isNaver) {
        alert('⚠️ 카카오톡/네이버 인앱 브라우저에서는 앱 설치가 지원되지 않습니다.\n\n우측 하단의 [⋮] 또는 메뉴를 눌러 "다른 브라우저로 열기(크롬/사파리)"를 선택한 후 설치해주세요!');
        return;
      }

      if (isIOS) {
        alert('🍎 아이폰(Safari) 설치 안내\n\n화면 맨 아래의 [공유] 아이콘(가운데 네모 위 화살표)을 누른 후, 메뉴를 위로 올려서 [홈 화면에 추가]를 눌러주세요!');
      } else {
        alert('📱 안드로이드 설치 안내\n\n브라우저 우측 상단의 [⋮] 메뉴를 누른 후 [홈 화면에 추가] 또는 [앱 설치]를 선택해주세요!');
      }
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200 mt-20 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* PWA 설치 배너 카드 */}
        {!isInstalled && (
          <div className="mb-10 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0 text-blue-600">
                <i className="fas fa-mobile-screen-button text-2xl"></i>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">VERA 홈 화면 앱 설치</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  바탕화면에 아이콘을 추가하고 실시간 뉴스, 스마트 도구, 미니게임을 더 빠르고 편리하게 즐기세요.
                </p>
              </div>
            </div>
            <button
              onClick={handleInstallClick}
              disabled={isInstalled || isInstalling}
              className={`w-full sm:w-auto px-6 py-3 font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-sm ${
                isInstalled
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
              }`}
            >
              {isInstalling ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>설치 진행 중...</span>
                </>
              ) : isInstalled ? (
                <>
                  <i className="fas fa-check"></i>
                  <span>설치 완료</span>
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  <span>홈 화면에 추가</span>
                </>
              )}
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <img src="/logo-192.png" alt="VERA Logo" className="w-7 h-7 rounded-md object-contain" />
              <h2 className="text-xl font-black text-gray-900">VERA</h2>
            </div>
            <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
              세상의 모든 지식과 일상의 스마트함을 하나로 묶는 라이프 포털. 더 정확하고 유용한 일상을 위해 매일 성장합니다.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm">주요 서비스</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/guides" className="hover:text-blue-600 font-semibold text-slate-800 transition-colors">
                    지식 가이드 & 칼럼
                  </Link>
                </li>
                <li>
                  <Link href="/game" className="hover:text-blue-600 transition-colors">
                    미니게임 센터
                  </Link>
                </li>
                <li>
                  <Link href="/utility" className="hover:text-blue-600 transition-colors">
                    스마트 생활도구
                  </Link>
                </li>
                <li>
                  <Link href="/finance" className="hover:text-blue-600 transition-colors">
                    금융 대시보드
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4 text-sm">약관 및 신뢰성 정책</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <Link href="/editorial-policy" className="hover:text-blue-600 font-semibold text-teal-800 transition-colors">
                    편집 및 팩트체크 정책
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="font-bold text-gray-700 hover:text-blue-600 transition-colors">
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-blue-600 transition-colors">
                    서비스 이용약관
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-blue-600 transition-colors">
                    서비스 소개
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-blue-600 transition-colors">
                    문의 및 고객센터
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-500">
            <Link href="/editorial-policy" className="hover:underline text-teal-800 font-medium">편집/팩트체크</Link>
            <span>|</span>
            <Link href="/guides" className="text-gray-700 hover:underline">가이드/칼럼</Link>
            <span>|</span>
            <Link href="/privacy" className="font-bold text-gray-700 hover:underline">개인정보처리방침</Link>
            <span>|</span>
            <Link href="/terms" className="hover:underline">이용약관</Link>
            <span>|</span>
            <Link href="/about" className="hover:underline">서비스 소개</Link>
            <span>|</span>
            <Link href="/contact" className="hover:underline">문의하기</Link>
          </div>

          <div className="text-left sm:text-right text-xs text-gray-400 space-y-0.5">
            <p>© 2026 VERA (베라). All rights reserved.</p>
            <p>운영: VERA Management Team · 문의: contact@veranex.app (sukman@naver.com)</p>
            <p>고객지원: 평일 09:00 ~ 18:00 · Google AdSense DART 쿠키 및 검색 필수사항(Search Essentials) 준수</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
