import { useCallback } from 'react';

type PortalMessageType = 'MISSION_CLEAR' | 'POINTS_UPDATED' | 'APP_CLOSED';

export function usePortalMessenger() {
    const sendToPortal = useCallback((type: PortalMessageType, payload?: any) => {
        if (!window.opener || window.opener === window) {
            console.log(`[usePortalMessenger] Dropped message: no opener. type=${type}`);
            return;
        }

        window.opener.postMessage(
            { type, payload, source: 'FAITHLINK_MINI_APP' },
            '*'
        );
    }, []);

    return { sendToPortal };
}
