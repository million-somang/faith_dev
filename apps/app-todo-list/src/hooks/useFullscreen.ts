import { useCallback, useEffect, useState } from 'react';

export interface FullscreenState {
  readonly isSupported: boolean;
  readonly isFullscreen: boolean;
  readonly enterFullscreen: () => Promise<void>;
  readonly exitFullscreen: () => Promise<void>;
  readonly toggleFullscreen: () => Promise<void>;
}

function checkFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return (
    typeof root.requestFullscreen === 'function' ||
    typeof Reflect.get(root, 'webkitRequestFullscreen') === 'function'
  );
}

function getCurrentFullscreenElement(): Element | null {
  if (typeof document === 'undefined') return null;
  if (document.fullscreenElement) return document.fullscreenElement;
  const webkitEl: unknown = Reflect.get(document, 'webkitFullscreenElement');
  return webkitEl instanceof Element ? webkitEl : null;
}

export function useFullscreen(): FullscreenState {
  const [isSupported] = useState<boolean>(() => checkFullscreenSupported());
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() =>
    Boolean(getCurrentFullscreenElement())
  );

  useEffect(() => {
    const syncState = () => {
      setIsFullscreen(Boolean(getCurrentFullscreenElement()));
    };

    syncState();
    document.addEventListener('fullscreenchange', syncState);
    document.addEventListener('webkitfullscreenchange', syncState);

    return () => {
      document.removeEventListener('fullscreenchange', syncState);
      document.removeEventListener('webkitfullscreenchange', syncState);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (getCurrentFullscreenElement()) return;
    const root = document.documentElement;

    try {
      if (typeof root.requestFullscreen === 'function') {
        await root.requestFullscreen();
        return;
      }
      const webkitReq: unknown = Reflect.get(root, 'webkitRequestFullscreen');
      if (typeof webkitReq === 'function') {
        await Promise.resolve((webkitReq as () => void | Promise<void>).call(root));
      }
    } catch {
      // 권한 거부·iOS·iframe 환경에서는 뷰포트 전체화면 오버레이로 폴백
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return;
    if (!getCurrentFullscreenElement()) return;

    try {
      if (typeof document.exitFullscreen === 'function') {
        await document.exitFullscreen();
        return;
      }
      const webkitExit: unknown = Reflect.get(document, 'webkitExitFullscreen');
      if (typeof webkitExit === 'function') {
        await Promise.resolve((webkitExit as () => void | Promise<void>).call(document));
      }
    } catch {
      // 이미 전체화면이 해제된 경우 무시
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (getCurrentFullscreenElement()) {
      await exitFullscreen();
    } else {
      await enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  return {
    isSupported,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}
