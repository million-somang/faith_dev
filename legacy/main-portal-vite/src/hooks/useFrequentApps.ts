const STORAGE_KEY = 'faithportal_frequent_apps';
const MAX_FREQUENT_APPS = 5;

interface AppUsage {
    [appId: string]: number;
}

/**
 * 자주 쓰는 앱을 localStorage 기반으로 추적하는 유틸리티.
 * - recordUsage: 앱 사용 시 호출하여 사용 횟수를 기록
 * - getFrequentAppIds: 사용 횟수 순으로 상위 N개 앱 ID를 반환
 */

/** 현재 저장된 사용 기록을 불러옴 */
function getUsageData(): AppUsage {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            return JSON.parse(raw) as AppUsage;
        }
    } catch {
        // 파싱 실패 시 빈 객체 반환
    }
    return {};
}

/** 사용 기록을 저장 */
function saveUsageData(data: AppUsage): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // localStorage 용량 초과 등의 에러 무시
    }
}

/** 특정 앱의 사용 횟수를 1 증가시킴 */
export function recordAppUsage(appId: string): void {
    const data = getUsageData();
    data[appId] = (data[appId] || 0) + 1;
    saveUsageData(data);
}

/** 사용 횟수 기준 상위 앱 ID 배열을 반환 (최대 MAX_FREQUENT_APPS개) */
export function getFrequentAppIds(): string[] {
    const data = getUsageData();
    const entries = Object.entries(data);
    if (entries.length === 0) return [];

    return entries
        .sort(([, a], [, b]) => b - a)
        .slice(0, MAX_FREQUENT_APPS)
        .map(([appId]) => appId);
}
