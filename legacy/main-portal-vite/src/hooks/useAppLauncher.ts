import { useCallback } from 'react';

export function useAppLauncher() {
    const launchApp = useCallback((url: string, appId: string) => {
        // 모바일 환경 판별 (단순 가로 해상도 및 UA 교차 검증)
        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);

        try {
            let popup: Window | null = null;

            if (isMobile) {
                // 모바일: 전체 화면으로 열기 (새 탭 형태)
                popup = window.open(url, appId);
            } else {
                // PC: 모바일 사이즈의 정중앙 팝업 모달 형태로 열기
                const width = 450;
                const height = 850;
                const left = (window.screen.width / 2) - (width / 2);
                const top = (window.screen.height / 2) - (height / 2);

                popup = window.open(
                    url,
                    appId, // target을 appId로 고정하여 단일 창(Singleton) 유도
                    `width=${width},height=${height},top=${top},left=${left},resizable=no,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
                );
            }

            // 팝업 차단 방어 로직
            if (!popup) {
                alert('브라우저의 팝업 차단을 해제해주세요. 시스템 기능을 사용하기 위해 팝업 허용이 필요합니다.');
                return;
            }

            // 창이 이미 열려있었다면 포커스 이동
            popup.focus();
        } catch (error) {
            console.error('Failed to launch app:', error);
            alert('앱 실행 중 오류가 발생했습니다.');
        }
    }, []);

    return { launchApp };
}
