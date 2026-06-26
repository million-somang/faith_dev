import { useState, useEffect, useCallback } from 'react';

// 메인 포털과 동일 출처의 인증 API로 현재 로그인 사용자를 확인한다.
const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

export interface AuthUser {
    id: number;
    email: string;
    name: string;
    role?: string;
    level?: number;
    status?: string;
}

/**
 * 금융 앱(별도 SPA)에서 메인 포털 세션 쿠키로 로그인 상태를 가져온다.
 * Header에 user/onLogout을 넘겨, 금융 페이지에서도 로그인 상태가 유지돼 보이도록 한다.
 */
export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        fetch(`${MAIN_PORTAL_URL}/api/auth/check`, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (!cancelled && data && data.success && data.user) setUser(data.user);
            })
            .catch(() => {
                /* 비로그인/네트워크 실패는 조용히 무시 */
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch(`${MAIN_PORTAL_URL}/api/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            /* 무시 */
        }
        setUser(null);
        // 로그아웃 후 메인 포털 홈으로 이동
        window.location.href = `${MAIN_PORTAL_URL}/`;
    }, []);

    return { user, logout, isLoading };
}
