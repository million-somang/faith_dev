import React from 'react';

export interface ShoppingCategoryItem {
    id: number;
    code: string;
    name: string;
    icon: string;
    bannerColor: string;
}

interface ShoppingSearchFilterProps {
    categories: ShoppingCategoryItem[];
    selectedCategory: number;
    onSelectCategory: (id: number) => void;
    searchKeyword: string;
    onSearchChange: (keyword: string) => void;
    onSearchSubmit: (e: React.FormEvent) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    totalCount: number;
    isLiveApi?: boolean;
}

export const ShoppingSearchFilter: React.FC<ShoppingSearchFilterProps> = ({
    categories,
    selectedCategory,
    onSelectCategory,
    searchKeyword,
    onSearchChange,
    onSearchSubmit,
    sortBy,
    onSortChange,
    totalCount,
    isLiveApi = false,
}) => {
    return (
        <div className="space-y-4 mb-6">
            {/* 검색창 & 정렬 필터 헤더 */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* 검색 입력 폼 */}
                <form onSubmit={onSearchSubmit} className="relative flex-1 max-w-xl">
                    <input 
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="찾으시는 상품명이나 브랜드를 검색해보세요..."
                        className="w-full pl-11 pr-24 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm placeholder:text-slate-400"
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-search"></i>
                    </div>
                    {searchKeyword && (
                        <button 
                            type="button"
                            onClick={() => onSearchChange('')}
                            className="absolute right-16 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 p-1"
                        >
                            <i className="fas fa-times-circle"></i>
                        </button>
                    )}
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                    >
                        검색
                    </button>
                </form>

                {/* 정렬 드롭다운 & 실시간 상태 */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5">
                    <div className="text-xs font-semibold text-slate-500">
                        총 <span className="text-blue-600 font-extrabold">{totalCount}</span>개 상품
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => onSortChange(e.target.value)}
                        aria-label="상품 정렬 순서 선택"
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                    >
                        <option value="ranking">쿠팡 랭킹순</option>
                        <option value="discount">할인율 높은순</option>
                        <option value="price_asc">낮은 가격순</option>
                        <option value="price_desc">높은 가격순</option>
                        <option value="rating">평점 · 리뷰 많은순</option>
                    </select>

                    {/* API 연동 인디케이터 */}
                    {isLiveApi ? (
                        <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live API
                        </span>
                    ) : (
                        <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                            <i className="fas fa-bolt text-[9px]"></i>
                            스마트 피드
                        </span>
                    )}
                </div>
            </div>

            {/* 카테고리 알약 탭 (수평 스크롤) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {categories.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onSelectCategory(cat.id)}
                            className={`flex-shrink-0 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-sm ${
                                isSelected
                                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02]'
                                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                            }`}
                        >
                            <i className={`${cat.icon} ${isSelected ? 'text-yellow-400' : 'text-slate-400'}`}></i>
                            <span>{cat.name}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default ShoppingSearchFilter;
