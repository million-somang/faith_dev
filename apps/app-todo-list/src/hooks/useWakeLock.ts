import { useEffect, useRef, useState } from 'react';

interface WakeLockSentinelLike extends EventTarget {
  readonly released: boolean;
  release: () => Promise<void>;
}

interface NavigatorWakeLockLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

export interface WakeLockState {
  readonly isSupported: boolean;
  readonly isLocked: boolean;
}

function getWakeLockApi(): NavigatorWakeLockLike | null {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return null;
  }
  const candidate: unknown = Reflect.get(navigator, 'wakeLock');
  if (
    typeof candidate === 'object' &&
    candidate !== null &&
    'request' in candidate &&
    typeof Reflect.get(candidate, 'request') === 'function'
  ) {
    return candidate as NavigatorWakeLockLike;
  }
  return null;
}

export function useWakeLock(isActive: boolean): WakeLockState {
  const [isSupported] = useState<boolean>(() => getWakeLockApi() !== null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const isActiveRef = useRef<boolean>(isActive);
  isActiveRef.current = isActive;

  useEffect(() => {
    const wakeLockApi = getWakeLockApi();
    if (!wakeLockApi) {
      setIsLocked(false);
      return;
    }

    let cancelled = false;

    const releaseCurrent = async () => {
      const current = sentinelRef.current;
      sentinelRef.current = null;
      if (current && !current.released) {
        try {
          await current.release();
        } catch {
          // 이미 해제된 경우 무시
        }
      }
      if (!cancelled) {
        setIsLocked(false);
      }
    };

    const acquireLock = async () => {
      if (cancelled || !isActiveRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      if (sentinelRef.current && !sentinelRef.current.released) return;

      try {
        const sentinel = await wakeLockApi.request('screen');
        if (cancelled || !isActiveRef.current) {
          try {
            await sentinel.release();
          } catch {
            // 무시
          }
          return;
        }

        const handleRelease = () => {
          if (sentinelRef.current === sentinel) {
            sentinelRef.current = null;
          }
          if (!cancelled) {
            setIsLocked(false);
          }
        };

        sentinel.addEventListener('release', handleRelease, { once: true });
        sentinelRef.current = sentinel;
        setIsLocked(true);
      } catch {
        if (!cancelled) {
          setIsLocked(false);
        }
      }
    };

    if (isActive) {
      void acquireLock();
    } else {
      void releaseCurrent();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActiveRef.current) {
        void acquireLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      const current = sentinelRef.current;
      sentinelRef.current = null;
      if (current && !current.released) {
        void current.release().catch(() => {});
      }
      setIsLocked(false);
    };
  }, [isActive]);

  return {
    isSupported,
    isLocked,
  };
}
