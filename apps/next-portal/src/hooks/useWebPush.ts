'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
    NotificationApiResponse,
    NotificationInboxItem,
    NotificationPreferences,
    NotificationPreferencesPatch,
    NotificationTestResult,
    PushDeviceSummary,
} from '@/types/notification.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

const DEFAULT_PREFERENCES: NotificationPreferences = {
    userId: 0,
    categories: {
        'azit.kitchen': true,
        'azit.garden': true,
        'azit.camp': true,
        schedule: true,
        system: true,
    },
    quietHoursEnabled: false,
    quietStartHHMM: '23:00',
    quietEndHHMM: '08:00',
    timezone: 'Asia/Seoul',
    updatedAt: null,
};

export interface UseWebPushOptions {
    enabled: boolean;
}

export interface UseWebPushReturn {
    isSupported: boolean;
    permission: NotificationPermission | 'unsupported';
    isSubscribed: boolean;
    isBusy: boolean;
    isLoading: boolean;
    isIos: boolean;
    isStandalonePwa: boolean;
    needsIosHomeScreenInstall: boolean;
    devices: PushDeviceSummary[];
    preferences: NotificationPreferences;
    inbox: NotificationInboxItem[];
    unreadCount: number;
    feedback: { type: 'success' | 'error' | 'info'; message: string } | null;
    clearFeedback: () => void;
    subscribe: (deviceLabel?: string) => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
    toggleSubscription: () => Promise<boolean>;
    sendTestPush: () => Promise<boolean>;
    updatePreferences: (patch: NotificationPreferencesPatch) => Promise<boolean>;
    markRead: (id: number) => Promise<void>;
    markAllRead: () => Promise<void>;
    dismissInboxItem: (id: number) => Promise<void>;
    refreshAll: () => Promise<void>;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<NotificationApiResponse<T>> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(init?.headers || {}),
        },
        ...init,
    });
    const json = (await res.json()) as NotificationApiResponse<T>;
    if (!res.ok || !json.success) {
        return {
            success: false,
            error: json.error || { code: res.status, message: '요청을 처리하지 못했습니다.' },
        };
    }
    return json;
}

export function useWebPush({ enabled }: UseWebPushOptions): UseWebPushReturn {
    const [isSupported, setIsSupported] = useState<boolean>(false);
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [isBusy, setIsBusy] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isIos, setIsIos] = useState<boolean>(false);
    const [isStandalonePwa, setIsStandalonePwa] = useState<boolean>(false);
    const [devices, setDevices] = useState<PushDeviceSummary[]>([]);
    const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
    const [inbox, setInbox] = useState<NotificationInboxItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

    const clearFeedback = useCallback(() => setFeedback(null), []);

    const syncLocalSubscription = useCallback(async () => {
        if (typeof window === 'undefined') return;
        const ua = navigator.userAgent.toLowerCase();
        const iosDetected = /iphone|ipad|ipod/.test(ua);
        const navWithStandalone = navigator as Navigator & { standalone?: boolean };
        const standalone =
            Boolean(window.matchMedia?.('(display-mode: standalone)').matches) ||
            navWithStandalone.standalone === true;

        setIsIos(iosDetected);
        setIsStandalonePwa(standalone);

        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);
        setPermission('Notification' in window ? Notification.permission : 'unsupported');

        if (!supported) {
            setIsSubscribed(false);
            return;
        }

        try {
            await navigator.serviceWorker.register('/sw.js');
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            setIsSubscribed(Boolean(sub));
        } catch {
            setIsSubscribed(false);
        }
    }, []);

    const refreshAll = useCallback(async () => {
        if (!enabled) return;
        setIsLoading(true);
        try {
            const [subRes, prefRes, inboxRes] = await Promise.all([
                apiFetch<{ devices: PushDeviceSummary[]; count: number }>('/api/notifications/subscriptions'),
                apiFetch<NotificationPreferences>('/api/notifications/preferences'),
                apiFetch<{ items: NotificationInboxItem[]; unreadCount: number }>('/api/notifications/inbox?limit=30'),
            ]);
            if (subRes.success && subRes.data) {
                setDevices(subRes.data.devices || []);
            }
            if (prefRes.success && prefRes.data) {
                setPreferences(prefRes.data);
            }
            if (inboxRes.success && inboxRes.data) {
                setInbox(inboxRes.data.items || []);
                setUnreadCount(Number(inboxRes.data.unreadCount ?? 0));
            }
        } catch (err) {
            console.error('[useWebPush] refreshAll failed:', err);
        } finally {
            setIsLoading(false);
        }
    }, [enabled]);

    useEffect(() => {
        syncLocalSubscription().catch(() => {});
    }, [syncLocalSubscription]);

    useEffect(() => {
        if (!enabled) {
            setDevices([]);
            setInbox([]);
            setUnreadCount(0);
            return;
        }
        refreshAll().catch(() => {});
    }, [enabled, refreshAll]);

    const needsIosHomeScreenInstall = isIos && !isStandalonePwa;

    const subscribe = useCallback(
        async (deviceLabel?: string): Promise<boolean> => {
            if (typeof window === 'undefined') return false;
            if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
                setFeedback({
                    type: 'info',
                    message: needsIosHomeScreenInstall
                        ? 'iPhone은 Safari 공유 버튼 → [홈 화면에 추가]로 앱 설치 후 실행해야 푸시 알림을 켤 수 있습니다.'
                        : '현재 브라우저는 웹 푸시 알림을 지원하지 않습니다.',
                });
                return false;
            }

            setIsBusy(true);
            try {
                const perm = await Notification.requestPermission();
                setPermission(perm);
                if (perm !== 'granted') {
                    setFeedback({
                        type: 'error',
                        message: '브라우저 알림 권한이 거부되었습니다. 주소창 왼쪽 자물쇠/설정에서 알림을 허용해 주세요.',
                    });
                    return false;
                }

                await navigator.serviceWorker.register('/sw.js');
                const registration = await navigator.serviceWorker.ready;

                let sub = await registration.pushManager.getSubscription();
                if (!sub) {
                    const keyRes = await apiFetch<{ publicKey: string }>('/api/notifications/public-key');
                    const publicKey = keyRes.data?.publicKey;
                    if (!keyRes.success || !publicKey) {
                        throw new Error(keyRes.error?.message || '푸시 공개키(VAPID)를 불러오지 못했습니다.');
                    }
                    const keyBytes = urlBase64ToUint8Array(publicKey);
                    sub = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: keyBytes.buffer as ArrayBuffer,
                    });
                }

                const saveRes = await apiFetch<{ devices: PushDeviceSummary[]; count: number }>(
                    '/api/notifications/subscriptions',
                    {
                        method: 'POST',
                        body: JSON.stringify({
                            subscription: sub.toJSON(),
                            deviceLabel,
                        }),
                    }
                );

                if (!saveRes.success) {
                    throw new Error(saveRes.error?.message || '기기 구독 등록에 실패했습니다.');
                }

                setDevices(saveRes.data?.devices || []);
                setIsSubscribed(true);
                setFeedback({
                    type: 'success',
                    message: '🔔 이 기기에 푸시 알림이 연결되었습니다! 아지트 요리·작물·원정 완료 시 바로 알려드려요.',
                });
                return true;
            } catch (err) {
                const message = err instanceof Error ? err.message : '푸시 알림 설정 중 오류가 발생했습니다.';
                setFeedback({ type: 'error', message });
                return false;
            } finally {
                setIsBusy(false);
            }
        },
        [needsIosHomeScreenInstall]
    );

    const unsubscribe = useCallback(async (): Promise<boolean> => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
        setIsBusy(true);
        try {
            await navigator.serviceWorker.register('/sw.js').catch(() => null);
            const registration = await navigator.serviceWorker.ready;
            const sub = await registration.pushManager.getSubscription();
            if (sub) {
                await apiFetch('/api/notifications/subscriptions', {
                    method: 'DELETE',
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                });
                await sub.unsubscribe().catch(() => false);
            }
            setIsSubscribed(false);
            await refreshAll();
            setFeedback({
                type: 'info',
                message: '🔕 이 기기의 웹 푸시 알림이 해제되었습니다.',
            });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : '알림 해제 중 오류가 발생했습니다.';
            setFeedback({ type: 'error', message });
            return false;
        } finally {
            setIsBusy(false);
        }
    }, [refreshAll]);

    const toggleSubscription = useCallback(async (): Promise<boolean> => {
        if (isSubscribed) {
            return unsubscribe();
        }
        return subscribe();
    }, [isSubscribed, subscribe, unsubscribe]);

    const sendTestPush = useCallback(async (): Promise<boolean> => {
        setIsBusy(true);
        try {
            if (!isSubscribed) {
                const ok = await subscribe();
                if (!ok) return false;
            }
            const res = await apiFetch<NotificationTestResult>('/api/notifications/test', {
                method: 'POST',
                body: JSON.stringify({}),
            });
            if (!res.success || !res.data) {
                throw new Error(res.error?.message || '테스트 알림 발송에 실패했습니다.');
            }
            const sentCount = res.data.sendResult?.sentCount ?? 0;
            const totalDevices = res.data.sendResult?.totalDevices ?? 0;
            await refreshAll();

            if (sentCount > 0) {
                setFeedback({
                    type: 'success',
                    message: `✅ 연결된 기기 ${sentCount}/${totalDevices}대로 테스트 알림을 보냈습니다!`,
                });
            } else {
                setFeedback({
                    type: 'info',
                    message: '알림함에 기록되었으나 활성 푸시 기기가 없거나 전송에 실패했습니다. 기기 구독을 다시 켜보세요.',
                });
            }
            return sentCount > 0;
        } catch (err) {
            const message = err instanceof Error ? err.message : '테스트 알림 발송 중 오류가 발생했습니다.';
            setFeedback({ type: 'error', message });
            return false;
        } finally {
            setIsBusy(false);
        }
    }, [isSubscribed, subscribe, refreshAll]);

    const updatePreferences = useCallback(async (patch: NotificationPreferencesPatch): Promise<boolean> => {
        setIsBusy(true);
        try {
            const res = await apiFetch<NotificationPreferences>('/api/notifications/preferences', {
                method: 'PUT',
                body: JSON.stringify(patch),
            });
            if (!res.success || !res.data) {
                throw new Error(res.error?.message || '알림 설정 저장에 실패했습니다.');
            }
            setPreferences(res.data);
            setFeedback({
                type: 'success',
                message: '알림 설정이 저장되었습니다.',
            });
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : '알림 설정 저장 중 오류가 발생했습니다.';
            setFeedback({ type: 'error', message });
            return false;
        } finally {
            setIsBusy(false);
        }
    }, []);

    const markRead = useCallback(async (id: number) => {
        const res = await apiFetch<{ updatedCount: number }>('/api/notifications/inbox/read', {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
        if (res.success) {
            const nowIso = new Date().toISOString();
            setInbox((prev) =>
                prev.map((item) => (item.id === id && !item.readAt ? { ...item, readAt: nowIso } : item))
            );
            setUnreadCount((prev) => Math.max(0, prev - (res.data?.updatedCount ?? 0)));
        }
    }, []);

    const markAllRead = useCallback(async () => {
        const res = await apiFetch<{ updatedCount: number }>('/api/notifications/inbox/read', {
            method: 'POST',
            body: JSON.stringify({ all: true }),
        });
        if (res.success) {
            const nowIso = new Date().toISOString();
            setInbox((prev) => prev.map((item) => (item.readAt ? item : { ...item, readAt: nowIso })));
            setUnreadCount(0);
        }
    }, []);

    const dismissInboxItem = useCallback(async (id: number) => {
        const target = inbox.find((item) => item.id === id);
        const res = await apiFetch<{ dismissed: boolean }>(`/api/notifications/inbox/${id}`, {
            method: 'DELETE',
        });
        if (res.success && res.data?.dismissed) {
            setInbox((prev) => prev.filter((item) => item.id !== id));
            if (target && !target.readAt) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        }
    }, [inbox]);

    return {
        isSupported,
        permission,
        isSubscribed,
        isBusy,
        isLoading,
        isIos,
        isStandalonePwa,
        needsIosHomeScreenInstall,
        devices,
        preferences,
        inbox,
        unreadCount,
        feedback,
        clearFeedback,
        subscribe,
        unsubscribe,
        toggleSubscription,
        sendTestPush,
        updatePreferences,
        markRead,
        markAllRead,
        dismissInboxItem,
        refreshAll,
    };
}
