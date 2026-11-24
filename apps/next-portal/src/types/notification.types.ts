export type NotificationCategoryKey =
    | 'azit.kitchen'
    | 'azit.garden'
    | 'azit.camp'
    | 'schedule'
    | 'system';

export interface PushDeviceSummary {
    id: number;
    endpoint: string;
    deviceLabel: string | null;
    userAgent: string | null;
    createdAt: string | null;
    updatedAt: string | null;
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

export interface PushSendResultSummary {
    sentCount: number;
    failedCount: number;
    expiredCount: number;
    totalDevices: number;
}

export interface NotificationTestResult {
    delivered: boolean;
    deliveryId?: number;
    deferredUntilMs?: number;
    skippedReason?: 'category_disabled';
    sendResult?: PushSendResultSummary;
}

export interface NotificationApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
    };
}
