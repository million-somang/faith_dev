'use client';

import { useCallback } from 'react';

export function useAppLauncher() {
    const launchApp = useCallback((url: string, appId: string) => {
        if (typeof window === 'undefined') return;

        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

        try {
            let popup: Window | null = null;

            if (isMobile) {
                popup = window.open(url, appId);
            } else {
                const width = 450;
                const height = 850;
                const left = (window.screen.width / 2) - (width / 2);
                const top = (window.screen.height / 2) - (height / 2);

                popup = window.open(
                    url,
                    appId,
                    `width=${width},height=${height},top=${top},left=${left},resizable=no,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
                );
            }

            if (!popup) {
                alert('브라우저의 팝업 차단을 해제해주세요. 시스템 기능을 사용하기 위해 팝업 허용이 필요합니다.');
                return;
            }

            popup.focus();
        } catch (error) {
            console.error('Failed to launch app:', error);
            alert('앱 실행 중 오류가 발생했습니다.');
        }
    }, []);

    return { launchApp };
}
