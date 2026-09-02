import React, { useEffect, useState } from 'react';

interface BannerSlotProps {
    slotKey?: string;
    className?: string;
}

export default function BannerSlot({ slotKey = 'game_loading_bottom', className = '' }: BannerSlotProps) {
    const [adLoaded, setAdLoaded] = useState(false);

    useEffect(() => {
        try {
            // @ts-expect-error adsbygoogle global
            if (typeof window !== 'undefined' && window.adsbygoogle) {
                // @ts-expect-error adsbygoogle push
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                setAdLoaded(true);
            }
        } catch {
            setAdLoaded(false);
        }
    }, [slotKey]);

    return (
        <div className={`w-full max-w-sm mx-auto overflow-hidden rounded-2xl bg-white/90 border border-slate-200/80 p-3 shadow-sm ${className}`}>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1.5 px-1">
                <span>SPONSORED</span>
                <span>AD</span>
            </div>
            
            {/* Google AdSense container */}
            <div className="min-h-[60px] flex items-center justify-center bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl overflow-hidden text-center">
                {adLoaded ? (
                    <ins
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client="ca-pub-9041638273592776"
                        data-ad-slot="9876543210"
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    ></ins>
                ) : (
                    <div className="p-3 text-xs flex items-center justify-center gap-2 text-indigo-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="font-extrabold">FaithPortal 쾌속 브라우저 게임 센터</span>
                    </div>
                )}
            </div>
        </div>
    );
}
