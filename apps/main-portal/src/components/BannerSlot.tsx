import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url?: string | null;
    open_new_tab?: number;
}

/**
 * 배너 슬롯 컴포넌트
 * - slotKey에 등록된 활성 배너를 API에서 불러와 표시
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

    if (banners.length === 0) return null;
    const banner = banners[Math.min(idx, banners.length - 1)];

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
