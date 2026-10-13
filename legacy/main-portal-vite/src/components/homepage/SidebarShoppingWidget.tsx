import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@faithportal/ui';

interface ShoppingItem {
    productId: number;
    productName: string;
    productPrice: number;
    originalPrice?: number;
    discountRate?: number;
    productImage: string;
    productUrl: string;
    categoryName?: string;
    isRocket?: boolean;
    tag?: string;
    curationPoint?: string;
    isViral?: boolean;
}

// Fallback용 기본 인기 추천 상품
const DEFAULT_SHOPPING_ITEMS: ShoppingItem[] = [
    {
        productId: 20001,
        productName: '공중부양 3D 달 무드등 16색 리모컨 터치 조명',
        productPrice: 49800,
        originalPrice: 79000,
        discountRate: 37,
        productImage: 'https://images.unsplash.com/photo-1532767153582-b1a0e5145009?w=600&auto=format&fit=crop&q=80',
        productUrl: '/shopping',
        curationPoint: '자석으로 공중에 둥둥 떠서 회전하는 무드등',
        tag: '화제의신박템'
    },
    {
        productId: 20002,
        productName: '스마트 3in1 머그컵 워머 & 고속 무선충전기 세트',
        productPrice: 28900,
        originalPrice: 42000,
        discountRate: 31,
        productImage: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        productUrl: '/shopping',
        curationPoint: '음료 보온과 스마트폰 충전을 동시에',
        tag: '인기꿀템'
    },
    {
        productId: 20004,
        productName: '디지털 스마트 줄자 LED 디스플레이 곡면 측정기',
        productPrice: 19800,
        originalPrice: 32000,
        discountRate: 38,
        productImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
        productUrl: '/shopping',
        curationPoint: '굴곡진 옷이나 가구 둘레도 1초 만에 측정',
        tag: '아이디어'
    }
];

export const SidebarShoppingWidget: React.FC = () => {
    const [items, setItems] = useState<ShoppingItem[]>(DEFAULT_SHOPPING_ITEMS);

    useEffect(() => {
        let isMounted = true;
        fetch('/api/shopping/viral')
            .then(res => res.json())
            .then(json => {
                if (isMounted && json.data && Array.isArray(json.data) && json.data.length > 0) {
                    setItems(json.data.slice(0, 3));
                }
            })
            .catch(() => {
                // 실패 시 기본 DEFAULT_SHOPPING_ITEMS 유지
            });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <Card className="p-5 bg-white border border-slate-200/90 shadow-sm hover:shadow-md transition-all rounded-3xl flex flex-col justify-between">
            <div>
                {/* 상단 헤더 타이틀 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-purple-200">
                            <i className="fas fa-shopping-bag"></i>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
                                오늘의 핫딜 & 신박템
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-pink-100 text-pink-700">
                                    HOT
                                </span>
                            </h3>
                        </div>
                    </div>
                    <Link
                        to="/shopping"
                        className="text-[11px] font-extrabold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
                    >
                        <span>더보기</span>
                        <i className="fas fa-chevron-right text-[8px]"></i>
                    </Link>
                </div>

                {/* 상품 리스트 (3개) */}
                <div className="space-y-2.5">
                    {items.map((item) => (
                        <a
                            key={item.productId}
                            href={item.productUrl}
                            target={item.productUrl.startsWith('http') ? '_blank' : '_self'}
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 hover:bg-purple-50/70 border border-slate-100 hover:border-purple-200 transition-all group cursor-pointer"
                        >
                            {/* 썸네일 이미지 & 할인율 뱃지 */}
                            <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-slate-200 border border-slate-200">
                                <img
                                    src={item.productImage}
                                    alt={item.productName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                />
                                {item.discountRate && item.discountRate > 0 && (
                                    <span className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-black px-1 rounded-bl">
                                        {item.discountRate}%
                                    </span>
                                )}
                            </div>

                            {/* 상품 상세 정보 */}
                            <div className="flex-1 min-w-0">
                                {item.curationPoint && (
                                    <div className="text-[10px] font-extrabold text-purple-700 truncate flex items-center gap-1 mb-0.5">
                                        <span>💡</span>
                                        <span className="truncate">{item.curationPoint}</span>
                                    </div>
                                )}
                                <h4 className="text-xs font-bold text-slate-800 truncate group-hover:text-purple-600 transition-colors leading-tight">
                                    {item.productName}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-xs font-black text-slate-900 font-mono">
                                        {item.productPrice?.toLocaleString()}
                                        <span className="text-[10px] font-normal text-slate-500">원</span>
                                    </span>
                                    {item.originalPrice && item.originalPrice > item.productPrice && (
                                        <span className="text-[10px] text-slate-400 line-through font-mono">
                                            {item.originalPrice.toLocaleString()}원
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 화살표 아이콘 */}
                            <div className="text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all text-xs pr-1 shrink-0">
                                <i className="fas fa-chevron-right text-[10px]"></i>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* 하단 전체보기 버튼 */}
            <Link
                to="/shopping"
                className="mt-3.5 w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-extrabold text-center text-xs rounded-xl shadow-xs block transition-all active:scale-98"
            >
                스마트 쇼핑 & 핫딜 센터 바로가기
            </Link>
        </Card>
    );
};
