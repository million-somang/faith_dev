type PortalMessageType = 'MISSION_CLEAR' | 'POINTS_UPDATED' | 'APP_CLOSED';
export declare function usePortalMessenger(): {
    sendToPortal: (type: PortalMessageType, payload?: any) => void;
};
export {};
//# sourceMappingURL=usePortalMessenger.d.ts.map