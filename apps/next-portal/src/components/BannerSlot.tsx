'use client';

import React, { useEffect, useState, useRef } from 'react';

export interface Banner {
  id: number;
  title: string;
  image_url: string;
  link_url?: string | null;
  open_new_tab?: number;
  ad_code?: string | null;
}

// 쿠팡 파트너스 공식 배너 (API 응답 전에도 즉시 표출되어 깜빡임 없는 fallback)
const DEFAULT_COUPANG_BANNER: Banner = {
  id: 1,
  title: '쿠팡 파트너스 배너',
  image_url:
    'https://ads-partners.coupang.com/banners/959332?subId=&traceId=V0-301-879dd1202e5c73b2-I959332&w=728&h=90',
  link_url: 'https://link.coupang.com/a/g0xNo8o8fk',
  open_new_tab: 1,
  ad_code: null,
};

export function BannerSlot({
  slotKey,
  fallbackSlotKey,
  className = '',
  rotateMs = 8000,
  label,
  wrapperClassName = '',
}: {
  slotKey: string;
  fallbackSlotKey?: string;
  className?: string;
  rotateMs?: number;
  label?: string;
  wrapperClassName?: string;
}) {
  const [banners, setBanners] = useState<Banner[]>(() => {
    return slotKey === 'home_main_top' ? [DEFAULT_COUPANG_BANNER] : [];
  });
  const [idx, setIdx] = useState(0);
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/banners/${slotKey}`)
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.success && data.banners && data.banners.length > 0) {
          setBanners(data.banners);
        } else if (fallbackSlotKey) {
          fetch(`/api/banners/${fallbackSlotKey}`)
            .then((r) => r.json())
            .then((fb) => {
              if (active && fb?.success && fb.banners && fb.banners.length > 0) {
                setBanners(fb.banners);
              }
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        console.warn(`[BannerSlot] 배너 로드 실패 (${slotKey}):`, err);
        if (slotKey === 'home_main_top' && banners.length === 0) {
          setBanners([DEFAULT_COUPANG_BANNER]);
        }
      });

    return () => {
      active = false;
    };
  }, [slotKey, fallbackSlotKey]);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => setIdx((i) => (i + 1) % banners.length), rotateMs);
    return () => clearInterval(timer);
  }, [banners.length, rotateMs]);

  if (banners.length === 0) return null;

  const banner = banners[Math.min(idx, banners.length - 1)];

  const content = banner.ad_code ? (
    <div
      ref={adRef}
      className={`w-full flex justify-center overflow-hidden ${className}`}
      dangerouslySetInnerHTML={{ __html: banner.ad_code }}
    />
  ) : (
    <div className={`w-full flex justify-center ${className}`}>
      {banner.link_url ? (
        <a
          href={banner.link_url}
          target={banner.open_new_tab ? '_blank' : undefined}
          rel="noopener noreferrer"
          referrerPolicy="unsafe-url"
          className="block hover:shadow-md transition-shadow rounded-2xl overflow-hidden group max-w-full"
        >
          <img
            src={banner.image_url}
            alt={banner.title}
            className="max-w-full h-auto rounded-2xl shadow-xs group-hover:opacity-95 transition-opacity"
          />
        </a>
      ) : (
        <img
          src={banner.image_url}
          alt={banner.title}
          className="max-w-full h-auto rounded-2xl shadow-xs"
        />
      )}
    </div>
  );

  if (label) {
    return (
      <aside
        className={
          wrapperClassName ||
          'w-full flex flex-col items-center justify-center p-4 overflow-hidden'
        }
        aria-label={label}
      >
        <span className="text-[9px] font-bold text-gray-400 tracking-wider mb-2 uppercase">
          {label}
        </span>
        {content}
      </aside>
    );
  }

  return content;
}

export default BannerSlot;
