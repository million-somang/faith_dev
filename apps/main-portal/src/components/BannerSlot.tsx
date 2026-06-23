import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url?: string | null;
    open_new_tab?: number;
    ad_code?: string | null;
}

/**
 * 배너 슬롯 컴포넌트
 * - slotKey에 등록된 활성 배너를 API에서 불러와 표시
 * - 구글 에드센스 스크립트 및 HTML (ad_code) 렌더링 지원
 * - 여러 개면 일정 간격으로 로테이션
 * - 배너가 없으면 영역 자체를 렌더링하지 않음
 */
export function BannerSlot({ slotKey, className = '', rotateMs = 8000 }: {
    slotKey: string;
    className?: string;
    rotateMs?: number;
}) {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [idx, setIdx] = useState(0);
    const adRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        axios.get<{ success: boolean; banners: Banner[] }>(`${API_BASE_URL}/api/banners/${slotKey}`)
            .then(res => {
                if (res.data?.success) setBanners(res.data.banners || []);
            })
            .catch(e => console.error(`배너 로드 실패 (${slotKey}):`, e));
    }, [slotKey]);

    useEffect(() => {
        if (banners.length < 2) return;
        const timer = setInterval(() => setIdx(i => (i + 1) % banners.length), rotateMs);
        return () => clearInterval(timer);
    }, [banners.length, rotateMs]);

    const banner = banners[Math.min(idx, banners.length - 1)];

    useEffect(() => {
        if (!banner || !banner.ad_code) return;

        // 1. 구글 에드센스 라이브러리 스크립트가 헤드에 없으면 동적 삽입
        const scriptId = 'adsense-main-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            
            // 광고 코드에서 client ID를 파싱해 쿼리 파라미터로 붙임
            const clientMatch = banner.ad_code.match(/data-ad-client="([^"]+)"/);
            if (clientMatch && clientMatch[1]) {
                script.src += `?client=${clientMatch[1]}`;
            }
            
            document.head.appendChild(script);
        }

        // 2. DOM 렌더링이 완료된 후 adsbygoogle.push를 안전하게 1회 호출
        const timer = setTimeout(() => {
            try {
                const adsbygoogle = (window as any).adsbygoogle;
                if (adRef.current && adRef.current.querySelector('.adsbygoogle')) {
                    (adsbygoogle || []).push({});
                }
            } catch (e) {
                console.error('Adsense push error:', e);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [banner]);

    if (banners.length === 0) return null;

    // 구글 에드센스 광고 배너 렌더링
    if (banner.ad_code) {
        return (
            <div 
                ref={adRef}
                className={`w-full flex justify-center overflow-hidden ${className}`}
                dangerouslySetInnerHTML={{ __html: banner.ad_code }}
            />
        );
    }

    // 일반 이미지 배너 렌더링
    const img = (
        <img
            src={banner.image_url}
            alt={banner.title}
            className="max-w-full hover:opacity-90 transition-opacity"
        />
    );

    return (
        <div className={`w-full flex justify-center ${className}`}>
            {banner.link_url ? (
                <a
                    href={banner.link_url}
                    target={banner.open_new_tab ? '_blank' : undefined}
                    rel="noopener noreferrer"
                >
                    {img}
                </a>
            ) : img}
        </div>
    );
}

export default BannerSlot;
