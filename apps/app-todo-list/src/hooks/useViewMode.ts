import { useEffect, useState } from 'react';

export interface ViewModeState {
  readonly isEmbed: boolean;
  readonly isStandalone: boolean;
}

export function useViewMode(): ViewModeState {
  const [isEmbed, setIsEmbed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return window.self !== window.top || params.get('embed') === 'true';
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsEmbed(window.self !== window.top || params.get('embed') === 'true');
  }, []);

  return {
    isEmbed,
    isStandalone: !isEmbed,
  };
}
