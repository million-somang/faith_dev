import React from 'react';

export interface ProductItem {
    productId: number;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage: string;
    productUrl: string;
    categoryName?: string;
    isRocket?: boolean;
    isFreeShipping?: boolean;
    rating?: number;
    reviewCount?: number;
    tag?: string;
    curationPoint?: string;
    isViral?: boolean;
}

interface ShoppingProductCardProps {
    product: ProductItem;
}

export const ShoppingProductCard: React.FC<ShoppingProductCardProps> = ({ product }) => {
    const formatPrice = (price: number) => price.toLocaleString('ko-KR');

    return (
        <div className={`group bg-white rounded-2xl border ${product.isViral ? 'border-purple-200 shadow-purple-500/5' : 'border-slate-200/80'} overflow-hidden hover:border-blue-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between`}>
            {/* 상단 이미지 영역 */}
            <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                <img 
                    src={product.productImage} 
                    alt={product.productName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                />
                
                {/* 뱃지들 */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
                    {product.tag && (
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${product.isViral ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-rose-500'} text-white shadow-sm`}>
                            {product.tag}
                        </span>
                    )}
                    {product.isRocket && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-sky-500 text-white shadow-sm flex items-center gap-1">
                            <i className="fas fa-bolt text-[10px]"></i> 로켓배송
                        </span>
                    )}
                </div>

                {/* 할인율 뱃지 (우측 상단) */}
                {product.discountRate && product.discountRate > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-red-600/90 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-xs font-black shadow-sm">
                        {product.discountRate}% OFF
                    </div>
                )}
            </div>

            {/* 본문 정보 영역 */}
            <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                    {/* 신박 포인트 말풍선 */}
                    {product.curationPoint && (
                        <div className="bg-purple-50 border border-purple-200/70 rounded-xl p-2 mb-2.5 text-[11px] font-bold text-purple-950 flex items-start gap-1.5 leading-snug">
                            <span className="text-purple-600 flex-shrink-0 mt-0.5">💡</span>
                            <span className="line-clamp-2">{product.curationPoint}</span>
                        </div>
                    )}

                    {/* 카테고리 태그 */}
                    {product.categoryName && (
                        <span className="text-[11px] font-semibold text-slate-400 mb-1 inline-block">
                            {product.categoryName}
                        </span>
                    )}
                    
                    {/* 상품명 */}
                    <h3 className="font-semibold text-sm text-slate-800 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors mb-2">
                        {product.productName}
                    </h3>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-2">
                    {/* 평점 및 리뷰 */}
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                        <div className="flex text-amber-400 text-[11px]">
                            <i className="fas fa-star"></i>
                        </div>
                        <span className="font-bold text-slate-700">{product.rating ? product.rating.toFixed(1) : '4.8'}</span>
                        <span className="text-slate-400">({(product.reviewCount || 99).toLocaleString()})</span>
                        {product.isFreeShipping && (
                            <span className="ml-auto text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                                무료배송
                            </span>
                        )}
                    </div>

                    {/* 가격 정보 */}
                    <div className="space-y-0.5 mb-3">
                        {product.originalPrice && product.originalPrice > product.productPrice && (
                            <div className="text-xs text-slate-400 line-through">
                                {formatPrice(product.originalPrice)}원
                            </div>
                        )}
                        <div className="flex items-baseline gap-1.5">
                            {product.discountRate && product.discountRate > 0 && (
                                <span className="text-lg font-black text-red-600">
                                    {product.discountRate}%
                                </span>
                            )}
                            <span className="text-xl font-extrabold text-slate-900">
                                {formatPrice(product.productPrice)}
                            </span>
                            <span className="text-xs font-bold text-slate-600">원</span>
                        </div>
                    </div>

                    {/* 구매 CTA 버튼 */}
                    <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10 active:scale-[0.98] transition-all"
                    >
                        <span>쿠팡에서 최저가 확인</span>
                        <i className="fas fa-external-link-alt text-[10px]"></i>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ShoppingProductCard;
