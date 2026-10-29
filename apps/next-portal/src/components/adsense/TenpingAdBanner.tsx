'use client';

import React, { useEffect, useRef } from 'react';

interface TenpingAdBannerProps {
    className?: string;
    adClient?: string;
    adDisplayType?: string;
}

export function TenpingAdBanner({
    className = '',
    adClient = '1sPlEGM1OPa%2fqKrfOfiJFkwaIKsrMIKWxlIDMXXpYhtE%2b%2fp%2b3GD6ia1%2fr90Upi7N',
    adDisplayType = 'UD8Mia8gyIoT5Z2MT6VB3Q%3d%3d',
}: TenpingAdBannerProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.innerHTML = '';

        const tenpingEl = document.createElement('tenping');
        tenpingEl.className = 'adsbytenping';
        tenpingEl.style.cssText = 'width: 100%; margin: 0px auto; display: block; max-width: 580px;';
        tenpingEl.setAttribute('tenping-ad-client', adClient);
        tenpingEl.setAttribute('tenping-ad-display-type', adDisplayType);
        container.appendChild(tenpingEl);

        const script = document.createElement('script');
        script.async = true;
        script.src = '//ads.tenping.kr/scripts/adsbytenping.min.js';
        container.appendChild(script);

        return () => {
            container.innerHTML = '';
        };
    }, [adClient, adDisplayType]);

    return (
        <div className={`w-full flex flex-col items-center justify-center ${className}`}>
            <div
                ref={containerRef}
                className="w-full max-w-[580px] mx-auto overflow-hidden rounded-2xl"
            />
        </div>
    );
}

export default TenpingAdBanner;
