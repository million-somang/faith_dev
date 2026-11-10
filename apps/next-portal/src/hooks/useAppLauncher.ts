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
                window.location.href = url;
                return;
            }

            popup.focus();
        } catch (error) {
            console.error('Failed to launch app, falling back to direct navigation:', error);
            window.location.href = url;
        }
    }, []);

    return { launchApp };
}
