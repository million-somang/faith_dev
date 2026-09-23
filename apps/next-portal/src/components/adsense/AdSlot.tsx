'use client';

import React, { useEffect } from 'react';

interface AdSlotProps {
  slotId?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
}

export function AdSlot({
  slotId = '0000000000',
  format = 'auto',
  className = '',
}: AdSlotProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const adsbygoogle = (window as any).adsbygoogle || [];
        adsbygoogle.push({});
      }
    } catch (e) {
      // AdSense 로드 에러 무시
    }
  }, []);

  // Zero-CLS를 위해 최소 높이를 반드시 예약
  const minHeightClass = format === 'rectangle' ? 'min-h-[280px]' : 'min-h-[100px]';

  return (
    <div className={`w-full my-6 flex flex-col items-center justify-center ${className}`}>
      {/* 구글 정책 준수: 광고 라벨 명시 및 여백 확보 */}
      <span className="text-[10px] text-gray-400 font-medium mb-1 tracking-wider uppercase">
        ADVERTISEMENT
      </span>
      <div
        className={`w-full max-w-4xl bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center ${minHeightClass}`}
      >
        <ins
          className="adsbygoogle"
          style={{ display: 'block', width: '100%', textAlign: 'center' }}
          data-ad-client="ca-pub-YOUR_ADSENSE_ID"
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
