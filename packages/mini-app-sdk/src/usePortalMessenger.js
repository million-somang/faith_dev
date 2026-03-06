import { useCallback } from 'react';
export function usePortalMessenger() {
    const sendToPortal = useCallback((type, payload) => {
        if (!window.opener || window.opener === window) {
            console.log(`[usePortalMessenger] Dropped message: no opener. type=${type}`);
            return;
        }
        window.opener.postMessage({ type, payload, source: 'FAITHLINK_MINI_APP' }, '*');
    }, []);
    return { sendToPortal };
}
