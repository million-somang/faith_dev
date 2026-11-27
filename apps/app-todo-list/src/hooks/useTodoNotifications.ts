import { useCallback, useEffect, useRef, useState } from 'react';
import { TODO_LOCAL_FIRED_ALARMS_KEY } from '../constants/todoMeta';
import type { TodoItem } from '../types/todo';
import { getLocalDateString } from '../utils/todoAnalytics';
import { safeStorage } from '../utils/safeStorage';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getLocalAlarmTimestampMs(dateStr: string, hhmm: string, remindBeforeMinutes: number): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) {
    return null;
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  const [hh, mm] = hhmm.split(':').map(Number);
  const target = new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  return target - remindBeforeMinutes * 60_000;
}

interface UseTodoNotificationsOptions {
  readonly isAuthenticated: boolean;
  readonly activeItems: readonly TodoItem[];
  readonly onLocalAlarmTrigger?: (item: TodoItem) => void;
}

export interface UseTodoNotificationsReturn {
  readonly isSupported: boolean;
  readonly isPushApiSupported: boolean;
  readonly permission: NotificationPermission | 'unsupported';
  readonly isDeviceSubscribed: boolean;
  readonly isBusy: boolean;
  readonly isIosSafari: boolean;
  readonly statusMessage: string | null;
  readonly clearStatusMessage: () => void;
  readonly enableNotifications: () => Promise<boolean>;
  readonly refreshPushStatus: () => Promise<void>;
}

export function useTodoNotifications({
  isAuthenticated,
  activeItems,
  onLocalAlarmTrigger,
}: UseTodoNotificationsOptions): UseTodoNotificationsReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isPushApiSupported, setIsPushApiSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [isDeviceSubscribed, setIsDeviceSubscribed] = useState<boolean>(false);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [isIosSafari, setIsIosSafari] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const itemsRef = useRef<readonly TodoItem[]>(activeItems);
  itemsRef.current = activeItems;
  const triggerCallbackRef = useRef(onLocalAlarmTrigger);
  triggerCallbackRef.current = onLocalAlarmTrigger;

  const clearStatusMessage = useCallback(() => setStatusMessage(null), []);

  const refreshPushStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const navWithStandalone = navigator as Navigator & { standalone?: boolean };
    const isStandalone =
      Boolean(window.matchMedia?.('(display-mode: standalone)').matches) ||
      navWithStandalone.standalone === true;
    setIsIosSafari(isIos && !isStandalone);

    const notifSupported = 'Notification' in window;
    const pushSupported = notifSupported && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(notifSupported);
    setIsPushApiSupported(pushSupported);
    setPermission(notifSupported ? Notification.permission : 'unsupported');

    if (!pushSupported) {
      setIsDeviceSubscribed(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      const sub = await registration.pushManager.getSubscription();
      setIsDeviceSubscribed(Boolean(sub));
    } catch {
      setIsDeviceSubscribed(false);
    }
  }, []);

  useEffect(() => {
    void refreshPushStatus();
  }, [refreshPushStatus, isAuthenticated]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStatusMessage(
        isIosSafari
          ? 'iPhone은 Safari 공유 → [홈 화면에 추가]로 앱을 설치해야 푸시 알람을 받을 수 있습니다.'
          : '현재 브라우저는 푸시 알람을 지원하지 않습니다.'
      );
      return false;
    }

    setIsBusy(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setStatusMessage('브라우저 알림 권한이 차단되어 있습니다. 주소창 설정에서 알림을 허용해 주세요.');
        return false;
      }

      if (!isAuthenticated) {
        setStatusMessage('로컬 브라우저 알림 권한이 켜졌습니다. 지정 시간에 화면·알림창으로 알려드려요.');
        return true;
      }

      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatusMessage('브라우저 알림이 켜졌습니다. (이 기기는 백그라운드 웹 푸시를 지원하지 않습니다)');
        return true;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      let sub = await registration.pushManager.getSubscription();
      if (!sub) {
        const keyRes = await fetch('/api/notifications/public-key', { credentials: 'include' });
        const keyJson = (await keyRes.json()) as { success?: boolean; data?: { publicKey?: string } };
        const publicKey = keyJson.data?.publicKey;
        if (!keyRes.ok || !keyJson.success || !publicKey) {
          throw new Error('서버 푸시 공개키(VAPID)를 가져오지 못했습니다.');
        }
        const keyBytes = urlBase64ToUint8Array(publicKey);
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes.buffer as ArrayBuffer,
        });
      }

      const saveRes = await fetch('/api/notifications/subscriptions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          deviceLabel: '스마트 투두 기기',
        }),
      });
      if (!saveRes.ok) {
        throw new Error('기기의 푸시 구독 등록에 실패했습니다.');
      }

      setIsDeviceSubscribed(true);
      setStatusMessage('🔔 이 기기에 백그라운드 웹 푸시 알람이 연결되었습니다!');
      return true;
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : '알람 연결 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsBusy(false);
    }
  }, [isAuthenticated, isIosSafari]);

  // 비로그인(로컬 모드) 전용 15초 주기 로컬 알람 감시
  useEffect(() => {
    if (isAuthenticated) return;

    const checkLocalAlarms = () => {
      const nowMs = Date.now();
      const todayStr = getLocalDateString();
      const firedMap = safeStorage.get<Record<string, number>>(TODO_LOCAL_FIRED_ALARMS_KEY, {});
      let changed = false;

      // 2일 이상 지난 로컬 발송 기록 정리
      for (const [key, ts] of Object.entries(firedMap)) {
        if (typeof ts !== 'number' || nowMs - ts > 2 * 86_400_000) {
          delete firedMap[key];
          changed = true;
        }
      }

      for (const item of itemsRef.current) {
        if (item.isDeleted || item.completed || !item.reminderEnabled || !item.dueTime) {
          continue;
        }
        const isRecurring = item.recurrence.type !== 'none';
        const targetDate = isRecurring
          ? item.occurrence.isDueToday
            ? todayStr
            : null
          : item.dueDate ?? todayStr;
        if (!targetDate) continue;

        const alarmAtMs = getLocalAlarmTimestampMs(targetDate, item.dueTime, item.remindBeforeMinutes);
        if (alarmAtMs === null) continue;

        // 지정 알람 시각이 60초 이내 도래~지남 범위일 때 1회만 울림
        if (nowMs >= alarmAtMs && nowMs - alarmAtMs <= 90_000) {
          const fireKey = `${item.id}::${targetDate}::${item.dueTime}::${item.remindBeforeMinutes}`;
          if (firedMap[fireKey]) continue;

          firedMap[fireKey] = nowMs;
          changed = true;

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const lead =
              item.remindBeforeMinutes > 0
                ? ` (${item.remindBeforeMinutes === 60 ? '1시간 전' : `${item.remindBeforeMinutes}분 전`})`
                : '';
            const body = item.memo ? `${item.title}\n${item.memo.slice(0, 80)}` : item.title;
            try {
              new Notification(`⏰ [스마트 투두] ${item.dueTime}${lead} 알림`, {
                body,
                icon: '/logo-192.png',
                tag: `todo-local-${item.id}`,
              });
            } catch {
              // 일부 인앱 웹뷰에서 Notification 생성 실패 무시
            }
          }

          triggerCallbackRef.current?.(item);
        }
      }

      if (changed) {
        safeStorage.set(TODO_LOCAL_FIRED_ALARMS_KEY, firedMap);
      }
    };

    checkLocalAlarms();
    const timer = setInterval(checkLocalAlarms, 15_000);
    return () => clearInterval(timer);
  }, [isAuthenticated]);

  return {
    isSupported,
    isPushApiSupported,
    permission,
    isDeviceSubscribed,
    isBusy,
    isIosSafari,
    statusMessage,
    clearStatusMessage,
    enableNotifications,
    refreshPushStatus,
  };
}
