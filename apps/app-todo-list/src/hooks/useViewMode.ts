import { useEffect, useState } from 'react';

export interface ViewModeState {
  readonly isEmbed: boolean;
  readonly isStandalone: boolean;
}

function detectEmbedMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const isIframe = window.self !== window.top;
  const isPopup = Boolean(window.opener && window.opener !== window);
  return isIframe || isPopup || params.get('embed') === 'true';
}

export function useViewMode(): ViewModeState {
  const [isEmbed, setIsEmbed] = useState<boolean>(() => detectEmbedMode());

  useEffect(() => {
    setIsEmbed(detectEmbedMode());
  }, []);

  return {
    isEmbed,
    isStandalone: !isEmbed,
  };
}
