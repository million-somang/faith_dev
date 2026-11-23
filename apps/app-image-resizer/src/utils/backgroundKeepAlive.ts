interface NavigatorLocksLike {
  request(name: string, callback: () => Promise<void>): Promise<void>;
}

interface WakeLockSentinelLike {
  readonly released?: boolean;
  release(): Promise<void>;
}

interface NavigatorWakeLockLike {
  request(type: 'screen'): Promise<WakeLockSentinelLike>;
}

interface NavigatorWithKeepAlive {
  readonly locks?: NavigatorLocksLike;
  readonly wakeLock?: NavigatorWakeLockLike;
}

export interface BackgroundGuardHandle {
  readonly wakeLockActive: boolean;
  release(): Promise<void>;
}

/**
 * 백그라운드 탭에서도 정지(rAF)나 1초/1분 스로틀링(setTimeout) 없이
 * 다음 이벤트 루프 턴으로 제어권을 양보하는 유틸리티
 */
export function yieldWithoutBackgroundThrottle(): Promise<void> {
  if (typeof MessageChannel !== 'undefined') {
    return new Promise<void>((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.onmessage = null;
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(undefined);
    });
  }
  return Promise.resolve();
}

/**
 * 백그라운드 업스케일 중 브라우저 탭 동결·언로드·절전·오클릭 이탈을 억제하는 통합 가드
 */
export async function acquireBackgroundGuards(): Promise<BackgroundGuardHandle> {
  let isReleased = false;
  let releaseLockResolver: (() => void) | null = null;
  let wakeLockSentinel: WakeLockSentinelLike | null = null;
  let wakeLockActive = false;

  const nav =
    typeof navigator !== 'undefined'
      ? (navigator as unknown as NavigatorWithKeepAlive)
      : undefined;

  // 1. Web Locks API: 작업 중 크롬 백그라운드 탭 메모리 폐기(Tab Discard) 억제
  if (nav?.locks && typeof nav.locks.request === 'function') {
    const lockPromise = new Promise<void>((resolve) => {
      releaseLockResolver = resolve;
    });
    void nav.locks
      .request('veranex-image-upscale-active', () => lockPromise)
      .catch(() => {
        // 사생활 보호 모드 등 Web Locks 제한 환경에서는 조용히 무시
      });
  }

  // 2. Screen Wake Lock API: 화면 자동 꺼짐 방지 (지원 환경에서만 조용히 획득)
  const requestWakeLock = async (): Promise<boolean> => {
    if (isReleased || !nav?.wakeLock || typeof nav.wakeLock.request !== 'function') {
      return false;
    }
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
      return false;
    }
    try {
      const sentinel = await nav.wakeLock.request('screen');
      if (isReleased) {
        await sentinel.release().catch(() => {});
        return false;
      }
      wakeLockSentinel = sentinel;
      return true;
    } catch {
      return false;
    }
  };

  wakeLockActive = await requestWakeLock();

  const handleVisibilityChange = (): void => {
    if (isReleased || typeof document === 'undefined') return;
    if (document.visibilityState === 'visible') {
      if (!wakeLockSentinel || wakeLockSentinel.released) {
        void requestWakeLock().then((ok) => {
          if (ok && !isReleased) {
            wakeLockActive = true;
          }
        });
      }
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // 3. beforeunload: 작업 중 실수로 탭 닫기/새로고침 방지
  const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
    if (isReleased) return;
    event.preventDefault();
    event.returnValue = '';
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  return {
    wakeLockActive,
    async release(): Promise<void> {
      if (isReleased) return;
      isReleased = true;

      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
      if (releaseLockResolver) {
        releaseLockResolver();
        releaseLockResolver = null;
      }
      if (wakeLockSentinel) {
        const currentSentinel = wakeLockSentinel;
        wakeLockSentinel = null;
        await currentSentinel.release().catch(() => {});
      }
    },
  };
}

export function captureOriginalTitle(): string {
  if (typeof document === 'undefined') return '';
  return document.title;
}

export function setProcessingTabTitle(
  percent: number,
  currentIndex: number,
  totalCount: number
): void {
  if (typeof document === 'undefined') return;
  const pct = Math.max(1, Math.min(99, Math.round(percent)));
  document.title =
    totalCount > 1
      ? `[${pct}%] 업스케일 중 (${currentIndex}/${totalCount}장) · VeraNex`
      : `[${pct}%] 업스케일 중 · VeraNex`;
}

export function setCompletedTabTitle(doneCount: number): void {
  if (typeof document === 'undefined') return;
  document.title =
    doneCount > 1
      ? `[완료!] 업스케일 ${doneCount}장 완료 · VeraNex`
      : '[완료!] 업스케일 완료 · VeraNex';
}

export function restoreDocumentTitle(originalTitle: string): void {
  if (typeof document === 'undefined' || !originalTitle) return;
  document.title = originalTitle;
}

export function supportsDesktopNotification(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    window.isSecureContext
  );
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!supportsDesktopNotification()) return 'unsupported';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | 'unsupported'
> {
  if (!supportsDesktopNotification()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function sendBackgroundCompletionNotification(
  doneCount: number,
  isUpscale: boolean
): void {
  if (!supportsDesktopNotification()) return;
  if (Notification.permission !== 'granted') return;
  if (typeof document === 'undefined' || !document.hidden) return;

  try {
    const title = isUpscale ? 'VeraNex 업스케일 완료' : 'VeraNex 이미지 변환 완료';
    const body =
      doneCount > 1
        ? `${doneCount}장의 이미지 처리가 완료되었습니다. 클릭하여 결과를 확인하세요.`
        : '이미지 처리가 완료되었습니다. 클릭하여 결과를 확인하세요.';

    const notification = new Notification(title, {
      body,
      icon: '/logo-192.png',
      tag: 'veranex-upscale-complete',
    });

    notification.onclick = () => {
      if (typeof window !== 'undefined') {
        window.focus();
      }
      notification.close();
    };
  } catch {
    // 일부 모바일/임베디드 브라우저에서 Notification 생성자 예외 시 무시
  }
}
