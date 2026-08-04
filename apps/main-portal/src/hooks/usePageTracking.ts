import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, initGA, setGAUserContext } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';

/**
 * React Router SPA 전용 GA4 자동 페이지뷰 추적 Hook
 */
export function usePageTracking() {
    const location = useLocation();
    const { user } = useAuth();

    // 앱 마운트 시 GA 동적 초기화
    useEffect(() => {
        initGA();
    }, []);

    // 회원이 로그인해 있는 경우 GA User Property 설정
    useEffect(() => {
        if (user && user.id) {
            setGAUserContext(user.id, user.role);
        }
    }, [user]);

    // 라우트 이동 시마다 페이지뷰 전송 및 PII 마스킹 처리
    useEffect(() => {
        const currentPath = location.pathname + location.search;
        trackPageView(currentPath);
    }, [location]);
}
