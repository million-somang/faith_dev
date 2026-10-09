import { useState, useEffect } from 'react';

export interface ViewModeInfo {
  isPopup: boolean;
  isStandalone: boolean;
  width: number;
  height: number;
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px ~ 1023px
  isDesktop: boolean; // >= 1024px
}

export function useViewMode(): ViewModeInfo {
  const [viewInfo, setViewInfo] = useState<ViewModeInfo>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 450;
    const height = typeof window !== 'undefined' ? window.innerHeight : 850;
    const isPopup = typeof window !== 'undefined' ? (window.opener !== null || window !== window.top) : false;
    return {
      isPopup,
      isStandalone: !isPopup,
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isPopup = window.opener !== null || window !== window.top;
      setViewInfo({
        isPopup,
        isStandalone: !isPopup,
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewInfo;
}
