'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export interface PageViewPayload {
  sessionId: string;
  path: string;
  referrer: string;
  initialReferrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  screenWidth: number;
  userId?: number | string;
}

export interface DurationPayload {
  sessionId: string;
  path: string;
  durationMs: number;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getTodayDateString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const today = getTodayDateString();
    let sessionId = sessionStorage.getItem('fl_session_id');
    const savedDate = localStorage.getItem('fl_session_date');
    const savedLocalId = localStorage.getItem('fl_session_id');

    if (!sessionId) {
      if (savedDate === today && savedLocalId) {
        sessionId = savedLocalId;
      } else {
        sessionId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : generateUUID();
      }
      sessionStorage.setItem('fl_session_id', sessionId);
    }

    localStorage.setItem('fl_session_id', sessionId);
    localStorage.setItem('fl_session_date', today);
    return sessionId;
  } catch {
    return generateUUID();
  }
}

function getInitialReferrer(): string {
  if (typeof window === 'undefined') return '';
  try {
    let ref = sessionStorage.getItem('fl_initial_referrer');
    if (ref === null) {
      ref = document.referrer || '';
      sessionStorage.setItem('fl_initial_referrer', ref);
    }
    return ref;
  } catch {
    return document.referrer || '';
  }
}

function getUtmParams(searchParamsString: string): {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
} {
  if (typeof window === 'undefined') return {};
  try {
    if (!searchParamsString) {
      const savedSource = sessionStorage.getItem('fl_utm_source');
      const savedMedium = sessionStorage.getItem('fl_utm_medium');
      const savedCampaign = sessionStorage.getItem('fl_utm_campaign');
      return {
        utmSource: savedSource || undefined,
        utmMedium: savedMedium || undefined,
        utmCampaign: savedCampaign || undefined,
      };
    }

    const params = new URLSearchParams(searchParamsString);
    const utmSource = params.get('utm_source') || params.get('ref') || undefined;
    const utmMedium = params.get('utm_medium') || undefined;
    const utmCampaign = params.get('utm_campaign') || undefined;

    if (utmSource) sessionStorage.setItem('fl_utm_source', utmSource);
    if (utmMedium) sessionStorage.setItem('fl_utm_medium', utmMedium);
    if (utmCampaign) sessionStorage.setItem('fl_utm_campaign', utmCampaign);

    return { utmSource, utmMedium, utmCampaign };
  } catch {
    return {};
  }
}

function sendAnalyticsRequest(endpoint: string, payload: PageViewPayload | DurationPayload): void {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const sent = navigator.sendBeacon(
        endpoint,
        new Blob([body], { type: 'application/json' })
      );
      if (sent) return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // 트래킹 실패는 사용자 경험에 영향 주지 않음
    });
  } catch {
    // 무시
  }
}

export function useAnalyticsTracker(): void {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const currentPathRef = useRef<string>('');
  const pageEnteredAtRef = useRef<number>(Date.now());
  const userIdRef = useRef<number | string | undefined>(undefined);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  const sendDuration = () => {
    const trackedPath = currentPathRef.current;
    const enteredAt = pageEnteredAtRef.current;
    if (!trackedPath || !enteredAt) return;

    const durationMs = Date.now() - enteredAt;
    if (durationMs < 1000) return;

    const sessionId = getSessionId();
    if (!sessionId) return;

    const payload: DurationPayload = {
      sessionId,
      path: trackedPath,
      durationMs: Math.min(durationMs, 30 * 60 * 1000),
    };
    sendAnalyticsRequest('/api/analytics/duration', payload);
  };

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    if (currentPathRef.current === pathname) return;

    if (currentPathRef.current) {
      sendDuration();
    }

    currentPathRef.current = pathname;
    pageEnteredAtRef.current = Date.now();

    const sessionId = getSessionId();
    if (!sessionId) return;

    const searchStr = searchParams ? searchParams.toString() : '';
    const initialReferrer = getInitialReferrer();
    const { utmSource, utmMedium, utmCampaign } = getUtmParams(searchStr);

    let effectiveReferrer = typeof document !== 'undefined' ? document.referrer || '' : '';
    if (!effectiveReferrer && initialReferrer) {
      effectiveReferrer = initialReferrer;
    }
    if (
      utmSource &&
      (!effectiveReferrer ||
        (typeof window !== 'undefined' && effectiveReferrer.includes(window.location.hostname)))
    ) {
      effectiveReferrer = `utm://${utmSource}${utmMedium ? '/' + utmMedium : ''}${
        utmCampaign ? '?c=' + utmCampaign : ''
      }`;
    }

    const storedUserId =
      userIdRef.current ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') || undefined : undefined);

    const payload: PageViewPayload = {
      sessionId,
      path: pathname,
      referrer: effectiveReferrer,
      initialReferrer,
      utmSource,
      utmMedium,
      utmCampaign,
      screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
      userId: storedUserId,
    };

    sendAnalyticsRequest('/api/analytics/pageview', payload);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendDuration();
      } else if (document.visibilityState === 'visible') {
        pageEnteredAtRef.current = Date.now();
      }
    };

    const handleBeforeUnload = () => {
      sendDuration();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
