import { useEffect, useState, useRef } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:4200' : '';

interface Banner {
    id: number;
    title: string;
    image_url: string;
    link_url?: string | null;
    open_new_tab?: number;
    ad_code?: string | null;
}

/**
 * 금융 페이지 배너 / 구글 애드센스 슬롯 컴포넌트
 */
export function BannerSlot({ slotKey = 'finance_middle', fallbackSlotKey = 'main_center', className = '', rotateMs = 8000 }: {
    slotKey?: string;
    fallbackSlotKey?: string;
    className?: string;
    rotateMs?: number;
}) {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [idx, setIdx] = useState(0);
    const adRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        axios.get<{ success: boolean; banners: Banner[] }>(`${API_BASE_URL}/api/banners/${slotKey}`)
            .then(res => {
                if (res.data?.success && res.data.banners && res.data.banners.length > 0) {
                    setBanners(res.data.banners);
                } else if (fallbackSlotKey) {
                    axios.get<{ success: boolean; banners: Banner[] }>(`${API_BASE_URL}/api/banners/${fallbackSlotKey}`)
                        .then(fallbackRes => {
                            if (fallbackRes.data?.success) setBanners(fallbackRes.data.banners || []);
                        })
                        .catch(() => {});
                }
            })
            .catch(e => {
                console.error(`배너 로드 실패 (${slotKey}):`, e);
                if (fallbackSlotKey) {
                    axios.get<{ success: boolean; banners: Banner[] }>(`${API_BASE_URL}/api/banners/${fallbackSlotKey}`)
                        .then(fallbackRes => {
                            if (fallbackRes.data?.success) setBanners(fallbackRes.data.banners || []);
                        })
                        .catch(() => {});
                }
            });
    }, [slotKey, fallbackSlotKey]);

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

    // 배너가 DB에 등록되어 있지 않은 경우, 기본 구글 애드센스 / 프리미엄 스폰서 반응형 슬롯 표시
    if (banners.length === 0) {
        return (
            <div className={`w-full my-6 bg-gradient-to-r from-slate-50 via-slate-100/70 to-slate-50 rounded-2xl border border-slate-200/80 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs ${className}`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-lg shrink-0">
                        <i className="fas fa-bullhorn"></i>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-200/70 px-1.5 py-0.5 rounded">SPONSORED</span>
                            <h4 className="font-extrabold text-slate-800 text-sm">글로벌 투자 & 증권 프리미엄 파트너십</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">실시간 시세 알림 및 해외주식 0% 수수료 혜택을 확인해보세요.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <a
                        href="/lifestyle"
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
                    >
                        혜택 자세히 보기
                    </a>
                </div>
            </div>
        );
    }

    // 구글 에드센스 광고 배너 렌더링
    if (banner.ad_code) {
        return (
            <div 
                ref={adRef}
                className={`w-full my-6 flex justify-center overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-2 ${className}`}
                dangerouslySetInnerHTML={{ __html: banner.ad_code }}
            />
        );
    }

    // 일반 이미지 배너 렌더링
    const img = (
        <img
            src={banner.image_url}
            alt={banner.title}
            className="max-w-full rounded-2xl hover:opacity-95 transition-opacity"
        />
    );

    return (
        <div className={`w-full my-6 flex justify-center ${className}`}>
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
