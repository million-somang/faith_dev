import { useCallback } from 'react';

export type PortalMessageType = 'MISSION_CLEAR' | 'POINTS_UPDATED' | 'APP_CLOSED' | 'TODO_UPDATED';

export function usePortalMessenger() {
  const sendToPortal = useCallback((type: PortalMessageType, payload?: Record<string, unknown>) => {
    if (typeof window === 'undefined' || !window.opener || window.opener === window) {
      return;
    }
    try {
      window.opener.postMessage(
        { type, payload, source: 'VERANEX_TODO' },
        window.location.origin
      );
    } catch {
      // 크로스 오리진 팝업 오프너 통신 예외 무시
    }
  }, []);

  return { sendToPortal };
}
