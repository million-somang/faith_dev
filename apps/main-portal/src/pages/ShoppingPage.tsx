import React, { useState, useEffect, useCallback } from 'react';
import { PageSEO } from '../components/PageSEO.js';
import { GoldBoxBanner } from '../components/shopping/GoldBoxBanner.js';
import { ShoppingSearchFilter, type ShoppingCategoryItem } from '../components/shopping/ShoppingSearchFilter.js';
import { ShoppingProductCard, type ProductItem } from '../components/shopping/ShoppingProductCard.js';
import { CoupangDisclaimer } from '../components/shopping/CoupangDisclaimer.js';

export const ShoppingPage: React.FC = () => {
    const [categories, setCategories] = useState<ShoppingCategoryItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const [searchKeyword, setSearchKeyword] = useState<string>('');
    const [submittedKeyword, setSubmittedKeyword] = useState<string>('');
    const [sortBy, setSortBy] = useState<string>('ranking');
    
    const [goldBoxProducts, setGoldBoxProducts] = useState<ProductItem[]>([]);
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isLiveApi, setIsLiveApi] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 1. 카테고리 & 골드박스 데이터 로드
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [catRes, goldRes] = await Promise.all([
                    fetch('/api/shopping/categories'),
                    fetch('/api/shopping/goldbox')
                ]);

                if (catRes.ok) {
                    const catJson = await catRes.json();
                    if (catJson.data) setCategories(catJson.data);
                }

                if (goldRes.ok) {
                    const goldJson = await goldRes.json();
                    if (goldJson.data) setGoldBoxProducts(goldJson.data);
                }
            } catch (err) {
                console.error('[ShoppingPage] Initial data fetch error:', err);
            }
        };

        fetchInitialData();
    }, []);

    // 2. 상품 목록 조회
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (submittedKeyword) params.set('keyword', submittedKeyword);
            if (selectedCategory !== 0) params.set('category', String(selectedCategory));
            if (sortBy) params.set('sort', sortBy);
            params.set('limit', '40');

            const res = await fetch(`/api/shopping/products?${params.toString()}`);
            if (!res.ok) throw new Error('상품 데이터를 불러오는데 실패했습니다.');
            
            const json = await res.json();
            if (json.data) {
                setProducts(json.data.products || []);
                setTotalCount(json.data.total || 0);
                setIsLiveApi(Boolean(json.meta?.isLiveApi));
            }
        } catch (err: any) {
            setError(err.message || '오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    }, [submittedKeyword, selectedCategory, sortBy]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittedKeyword(searchKeyword.trim());
    };

    const handleCategoryChange = (id: number) => {
        setSelectedCategory(id);
        // 카테고리 변경 시 검색어 초기화하지 않고 카테고리 내 검색 유지 가능
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
            <PageSEO 
                title="스마트 쇼핑 & 핫딜 | VERA 쇼핑"
                description="쿠팡 파트너스 실시간 골드박스 타임세일, 로켓배송 베스트셀러, 가전/디지털, 식품, 패션 최저가 상품을 한눈에 비교하고 쇼핑하세요."
                path="/shopping"
            />

            <main className="max-w-6xl w-full mx-auto px-4 py-8 flex-1">
                {/* 상단 브레드크럼 & 헤더 */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
                        <a href="/" className="hover:text-blue-600 transition-colors">홈</a>
                        <span>/</span>
                        <span className="text-slate-700">스마트 쇼핑</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white text-base shadow-md shadow-rose-500/20">
                                    <i className="fas fa-shopping-bag"></i>
                                </span>
                                스마트 쇼핑 & 핫딜
                            </h1>
                            <p className="text-slate-500 text-xs sm:text-sm mt-1">
                                매일 업데이트되는 쿠팡 실시간 타임세일과 검증된 카테고리 베스트 아이템
                            </p>
                        </div>
                    </div>
                </div>

                {/* 골드박스 타임세일 배너 */}
                <GoldBoxBanner products={goldBoxProducts} />

                {/* 검색 & 카테고리 & 정렬 필터 */}
                <ShoppingSearchFilter 
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={handleCategoryChange}
                    searchKeyword={searchKeyword}
                    onSearchChange={setSearchKeyword}
                    onSearchSubmit={handleSearchSubmit}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    totalCount={totalCount}
                    isLiveApi={isLiveApi}
                />

                {/* 상품 목록 그리드 */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                                <div className="aspect-square bg-slate-200 rounded-xl"></div>
                                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                                <div className="h-6 bg-slate-200 rounded w-2/3 mt-2"></div>
                                <div className="h-9 bg-slate-200 rounded-xl mt-3"></div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm my-8">
                        <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">
                            <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-2">상품 정보를 불러오지 못했습니다</h3>
                        <p className="text-xs text-slate-500 mb-6">{error}</p>
                        <button
                            onClick={fetchProducts}
                            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            다시 시도하기
                        </button>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm my-8">
                        <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">
                            <i className="fas fa-search"></i>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 mb-1">검색 결과가 없습니다</h3>
                        <p className="text-xs text-slate-500 mb-6">
                            다른 검색어를 입력하시거나 카테고리 필터를 '전체'로 변경해보세요.
                        </p>
                        <button
                            onClick={() => {
                                setSearchKeyword('');
                                setSubmittedKeyword('');
                                setSelectedCategory(0);
                            }}
                            className="px-5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            전체 상품 보기
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-10">
                        {products.map((product) => (
                            <ShoppingProductCard key={product.productId} product={product} />
                        ))}
                    </div>
                )}

                {/* 하단 공정위 필수 고지 문구 */}
                <CoupangDisclaimer className="mt-8 mb-4" />
            </main>
        </div>
    );
};

export default ShoppingPage;
