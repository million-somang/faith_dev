'use client';

import { useState, useEffect } from 'react';

interface SeoSafePopupOptions {
  scrollThreshold?: number; // 0~1 (기본 0.5 = 50%)
  timeThresholdSeconds?: number; // 기본 10초
  storageKey?: string;
}

export function useSeoSafePopup({
  scrollThreshold = 0.5,
  timeThresholdSeconds = 10,
  storageKey = 'seo_safe_popup_seen',
}: SeoSafePopupOptions = {}) {
  const [canShowPopup, setCanShowPopup] = useState(false);
  const [isFromSearchEngine, setIsFromSearchEngine] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. 이미 오늘 봤거나 닫은 경우 차단
    const alreadySeen = sessionStorage.getItem(storageKey);
    if (alreadySeen) return;

    // 2. 검색엔진(구글, 네이버, 다음 등) 첫 진입 판별 (구글 Intrusive Interstitial 방어)
    const referrer = document.referrer.toLowerCase();
    const isSearchBotOrLanding =
      referrer.includes('google.') ||
      referrer.includes('naver.') ||
      referrer.includes('daum.') ||
      referrer.includes('bing.') ||
      referrer.includes('yahoo.');

    setIsFromSearchEngine(isSearchBotOrLanding);

    // 검색엔진 첫 유입 시 즉시 팝업을 띄우는 행위 원천 차단
    if (isSearchBotOrLanding) {
      return;
    }

    let timer: NodeJS.Timeout;

    // 3. 체류 시간 10초 이상 시 트리거 허용
    timer = setTimeout(() => {
      setCanShowPopup(true);
    }, timeThresholdSeconds * 1000);

    // 4. 스크롤 50% 이상 도달 시 트리거 허용
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (scrollPos / docHeight >= scrollThreshold) {
        setCanShowPopup(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollThreshold, timeThresholdSeconds, storageKey]);

  const dismissPopup = () => {
    setCanShowPopup(false);
    sessionStorage.setItem(storageKey, 'true');
  };

  return { canShowPopup, isFromSearchEngine, dismissPopup };
}
