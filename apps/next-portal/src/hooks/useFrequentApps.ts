const STORAGE_KEY = 'faithportal_frequent_apps';
const MAX_FREQUENT_APPS = 5;

interface AppUsage {
    [appId: string]: number;
}

function getUsageData(): AppUsage {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw) as AppUsage;
        }
    } catch {
        // fallback
    }
    return {};
}

function saveUsageData(data: AppUsage): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // ignore
    }
}

export function recordAppUsage(appId: string): void {
    const data = getUsageData();
    data[appId] = (data[appId] || 0) + 1;
    saveUsageData(data);
}

export function getFrequentAppIds(): string[] {
    const data = getUsageData();
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    return entries
        .sort(([, a], [, b]) => b - a)
        .slice(0, MAX_FREQUENT_APPS)
        .map(([appId]) => appId);
}
