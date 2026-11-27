export const KNOWN_NOTIFICATION_CATEGORIES = [
    'azit.kitchen',
    'azit.garden',
    'azit.camp',
    'schedule',
    'todo',
    'system',
] as const;

export type KnownNotificationCategory = (typeof KNOWN_NOTIFICATION_CATEGORIES)[number];
export type NotificationCategory = KnownNotificationCategory | string;

export interface PushSubscriptionKeys {
    p256dh: string;
    auth: string;
}

export interface PushSubscriptionPayload {
    endpoint: string;
    keys: PushSubscriptionKeys;
}

export interface PushSubscriptionMeta {
    deviceLabel?: string;
    userAgent?: string;
}

export interface PushDeviceRecord {
    id: number;
    endpoint: string;
    deviceLabel: string | null;
    userAgent: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface PushDeliveryPayload {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    category?: string;
    notificationId?: number;
    data?: Record<string, unknown>;
}

export interface PushSendResult {
    sentCount: number;
    failedCount: number;
    expiredCount: number;
    totalDevices: number;
}

export interface NotificationPreferences {
    userId: number;
    categories: Record<string, boolean>;
    quietHoursEnabled: boolean;
    quietStartHHMM: string;
    quietEndHHMM: string;
    timezone: string;
    updatedAt: string | null;
}

export interface NotificationPreferencesPatch {
    categories?: Record<string, boolean>;
    quietHoursEnabled?: boolean;
    quietStartHHMM?: string;
    quietEndHHMM?: string;
}

export type NotificationJobStatus =
    | 'pending'
    | 'processing'
    | 'sent'
    | 'cancelled'
    | 'skipped_disabled'
    | 'failed';

export interface SendNotificationInput {
    userId: number;
    category?: string;
    sourceApp?: string;
    title: string;
    body: string;
    url?: string;
    icon?: string;
    tag?: string;
    renotify?: boolean;
    requireInteraction?: boolean;
    data?: Record<string, unknown>;
    ignorePreferences?: boolean;
    ignoreQuietHours?: boolean;
}

export interface SendNotificationOutcome {
    delivered: boolean;
    deliveryId?: number;
    deferredUntilMs?: number;
    jobId?: number;
    skippedReason?: 'category_disabled';
    sendResult?: PushSendResult;
}

export interface ScheduleNotificationInput {
    userId: number;
    category?: string;
    sourceApp?: string;
    dedupeKey?: string | null;
    title: string;
    body: string;
    url?: string;
    icon?: string;
    tag?: string;
    data?: Record<string, unknown>;
    scheduledAtMs: number;
    ignoreQuietHours?: boolean;
}

export interface ScheduleNotificationOutcome {
    jobId: number;
    upserted: boolean;
    scheduledAtMs: number;
}

export interface CancelNotificationInput {
    userId: number;
    dedupeKey?: string;
    jobId?: number;
}

export interface CancelNotificationOutcome {
    cancelledCount: number;
}

export interface NotificationJobRecord {
    id: number;
    userId: number;
    category: string;
    sourceApp: string;
    dedupeKey: string | null;
    title: string;
    body: string;
    url: string;
    icon: string;
    tag: string | null;
    data: Record<string, unknown> | null;
    scheduledAtMs: number;
    ignoreQuietHours: boolean;
    status: NotificationJobStatus;
    sentAt: string | null;
    errorMessage: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface NotificationInboxItem {
    id: number;
    jobId: number | null;
    category: string;
    sourceApp: string;
    title: string;
    body: string;
    url: string;
    data: Record<string, unknown> | null;
    sentDeviceCount: number;
    failedDeviceCount: number;
    readAt: string | null;
    createdAt: string | null;
}

export interface NotificationInboxResult {
    items: NotificationInboxItem[];
    unreadCount: number;
}
