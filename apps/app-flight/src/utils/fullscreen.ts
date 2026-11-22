/**
 * 크로스 브라우징 Fullscreen API 안전 래퍼
 * - iOS Safari, 일부 인앱 웹뷰 등 미지원/차단 환경에서는 예외 없이 안전하게 폴백
 */

interface FullscreenElementExt extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

interface FullscreenDocumentExt extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}

export function isFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocumentExt;
  const root = document.documentElement as FullscreenElementExt;
  const enabled = doc.fullscreenEnabled ?? doc.webkitFullscreenEnabled ?? true;
  const hasRequester =
    typeof root.requestFullscreen === 'function' ||
    typeof root.webkitRequestFullscreen === 'function';
  return Boolean(enabled && hasRequester);
}

export function isBrowserFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as FullscreenDocumentExt;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export async function enterBrowserFullscreen(target?: HTMLElement | null): Promise<boolean> {
  if (typeof document === 'undefined' || isBrowserFullscreen()) {
    return isBrowserFullscreen();
  }
  const el = (target || document.documentElement) as FullscreenElementExt | null;
  if (!el) return false;

  try {
    if (typeof el.requestFullscreen === 'function') {
      await el.requestFullscreen();
      return true;
    }
    if (typeof el.webkitRequestFullscreen === 'function') {
      await el.webkitRequestFullscreen();
      return true;
    }
  } catch {
    // 사용자 제스처 제한·iframe 정책·미지원 기기에서는 웹 전체화면(100dvh)으로 매끄럽게 유지
  }
  return false;
}

export async function exitBrowserFullscreen(): Promise<void> {
  if (typeof document === 'undefined' || !isBrowserFullscreen()) return;
  const doc = document as FullscreenDocumentExt;

  try {
    if (typeof doc.exitFullscreen === 'function') {
      await doc.exitFullscreen();
    } else if (typeof doc.webkitExitFullscreen === 'function') {
      await doc.webkitExitFullscreen();
    }
  } catch {
    // ignore fullscreen exit errors
  }
}

export async function toggleBrowserFullscreen(target?: HTMLElement | null): Promise<boolean> {
  if (isBrowserFullscreen()) {
    await exitBrowserFullscreen();
    return false;
  }
  return enterBrowserFullscreen(target);
}

export function subscribeFullscreenChange(onChange: (active: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = () => {
    onChange(isBrowserFullscreen());
  };
  document.addEventListener('fullscreenchange', handler);
  document.addEventListener('webkitfullscreenchange', handler);
  return () => {
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
  };
}
