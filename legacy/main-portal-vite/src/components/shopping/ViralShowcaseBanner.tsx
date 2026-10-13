import React from 'react';
import type { ProductItem } from './ShoppingProductCard.js';

interface ViralShowcaseBannerProps {
    products: ProductItem[];
    onSelectCuration?: () => void;
}

export const ViralShowcaseBanner: React.FC<ViralShowcaseBannerProps> = ({ products, onSelectCuration }) => {
    if (!products || products.length === 0) return null;

    return (
        <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl mb-8 relative overflow-hidden border border-purple-500/30">
            {/* 배경 네온 글로우 효과 */}
            <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10">
                {/* 상단 헤더 타이틀 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 border border-purple-400/40 backdrop-blur-md rounded-full text-xs font-black tracking-wider text-pink-300 uppercase">
                            <i className="fas fa-wand-magic-sparkles text-amber-300"></i>
                            TRENDING & VIRAL PICKS
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-100 to-pink-200">
                            이런 게 있었어? SNS 화제의 신박템
                        </h2>
                        <p className="text-purple-200/80 text-xs sm:text-sm font-medium">
                            삶의 질 수직상승! 기발한 아이디어와 실용성을 모두 갖춘 화제의 갓성비 꿀템 4선
                        </p>
                    </div>

                    {onSelectCuration && (
                        <button
                            onClick={onSelectCuration}
                            className="self-start sm:self-auto px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-xs font-bold text-white transition-all flex items-center gap-2 hover:scale-105 active:scale-95 shadow-sm"
                        >
                            <span>신박템 더보기</span>
                            <i className="fas fa-arrow-right text-[10px] text-pink-300"></i>
                        </button>
                    )}
                </div>

                {/* 신박템 4선 그리드 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                    {products.slice(0, 4).map((item) => (
                        <a
                            key={item.productId}
                            href={item.productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 text-slate-900 shadow-lg hover:shadow-2xl hover:bg-white transition-all duration-300 transform hover:-translate-y-1.5 flex flex-col justify-between group border border-white/20"
                        >
                            <div>
                                {/* 상품 이미지 & 태그 */}
                                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 bg-slate-100">
                                    <img 
                                        src={item.productImage} 
                                        alt={item.productName} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    {item.tag && (
                                        <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-md">
                                            {item.tag}
                                        </div>
                                    )}
                                    {item.discountRate && item.discountRate > 0 && (
                                        <div className="absolute top-2 right-2 bg-rose-600 text-white px-2 py-0.5 rounded-md text-[10px] font-black shadow-sm">
                                            {item.discountRate}% OFF
                                        </div>
                                    )}
                                </div>

                                {/* 신박 포인트 말풍선 (호기심 유발 핵심) */}
                                {item.curationPoint && (
                                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 mb-2 text-[11px] font-bold text-amber-900 flex items-start gap-1.5 leading-snug">
                                        <span className="text-amber-500 flex-shrink-0 mt-0.5">💡</span>
                                        <span className="line-clamp-2">{item.curationPoint}</span>
                                    </div>
                                )}

                                {/* 상품명 */}
                                <h4 className="font-bold text-xs text-slate-800 line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors mb-2">
                                    {item.productName}
                                </h4>
                            </div>

                            {/* 가격 & CTA */}
                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <div>
                                    {item.originalPrice && (
                                        <div className="text-[10px] text-slate-400 line-through">
                                            {item.originalPrice.toLocaleString()}원
                                        </div>
                                    )}
                                    <div className="text-base font-black text-slate-900">
                                        {item.productPrice.toLocaleString()}<span className="text-xs font-bold text-slate-600">원</span>
                                    </div>
                                </div>
                                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white transition-all text-xs shadow-sm">
                                    <i className="fas fa-external-link-alt text-[10px]"></i>
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ViralShowcaseBanner;
