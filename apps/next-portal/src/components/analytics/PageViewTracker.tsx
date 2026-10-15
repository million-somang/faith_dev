'use client';

import React, { Suspense } from 'react';
import { useAnalyticsTracker } from '@/hooks/useAnalyticsTracker';

function TrackerInner(): null {
  useAnalyticsTracker();
  return null;
}

export function PageViewTracker(): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <TrackerInner />
    </Suspense>
  );
}
