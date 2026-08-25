import React, { useState, useEffect } from 'react';
import type { ProductItem } from './ShoppingProductCard.js';

interface GoldBoxBannerProps {
    products: ProductItem[];
}

export const GoldBoxBanner: React.FC<GoldBoxBannerProps> = ({ products }) => {
    const [timeLeft, setTimeLeft] = useState<{ hours: string; minutes: string; seconds: string }>({
        hours: '00',
        minutes: '00',
        seconds: '00'
    });

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);

            const diff = midnight.getTime() - now.getTime();
            if (diff <= 0) {
                setTimeLeft({ hours: '00', minutes: '00', seconds: '00' });
                return;
            }

            const h = Math.floor(diff / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({
                hours: String(h).padStart(2, '0'),
                minutes: String(m).padStart(2, '0'),
                seconds: String(s).padStart(2, '0')
            });
        };

        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, []);

    if (!products || products.length === 0) return null;

    return (
        <section className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-8 relative overflow-hidden">
            {/* 배경 데코레이션 이펙트 */}
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-10 -top-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-xl pointer-events-none"></div>

            <div className="relative z-10">
                {/* 상단 헤더: 타이틀 & 실시간 카운트다운 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/20">
                    <div className="space-y-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black tracking-wider uppercase">
                            <i className="fas fa-bolt text-yellow-300"></i>
                            TODAY'S SPECIAL DEAL
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            오늘의 골드박스 타임세일
                        </h2>
                        <p className="text-white/80 text-xs sm:text-sm font-medium">
                            단 24시간 동안만 제공되는 쿠팡 엄선 한정수량 특가 핫딜
                        </p>
                    </div>

                    {/* 카운트다운 박스 */}
                    <div className="flex items-center gap-2 self-start sm:self-auto bg-black/30 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                        <span className="text-xs font-bold text-yellow-300 flex items-center gap-1.5 mr-1">
                            <i className="far fa-clock"></i> 남은 시간
                        </span>
                        <div className="flex items-center gap-1 font-mono font-black text-base sm:text-lg">
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg">{timeLeft.hours}</span>
                            <span>:</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg">{timeLeft.minutes}</span>
                            <span>:</span>
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg">{timeLeft.seconds}</span>
                        </div>
                    </div>
                </div>

                {/* 골드박스 상품 4종 가로 스크롤 / 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {products.slice(0, 4).map((item) => (
                        <a
                            key={item.productId}
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white rounded-2xl p-3.5 text-slate-900 shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between group"
                        >
                            <div>
                                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                                    <img 
                                        src={item.productImage} 
                                        alt={item.productName} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {item.discountRate && item.discountRate > 0 && (
                                        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-0.5 rounded-lg text-xs font-black shadow-sm">
                                            {item.discountRate}% 특가
                                        </div>
                                    )}
                                </div>
                                <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-red-600 transition-colors mb-2">
                                    {item.productName}
                                </h4>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    {item.originalPrice && (
                                        <div className="text-[10px] text-slate-400 line-through">
                                            {item.originalPrice.toLocaleString()}원
                                        </div>
                                    )}
                                    <div className="text-base font-black text-red-600">
                                        {item.productPrice.toLocaleString()}<span className="text-xs font-bold text-slate-800">원</span>
                                    </div>
                                </div>
                                <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors text-xs shadow-sm">
                                    <i className="fas fa-chevron-right"></i>
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default GoldBoxBanner;
