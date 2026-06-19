import { useState, useEffect, useCallback } from 'react';

// 관심종목은 이 기기(localStorage)에 저장한다. 서버 DB는 건드리지 않는다.
const STORAGE_KEY = 'finance:favorites';

// 로그인한 사용자의 경우, 마이페이지(주식 관심종목)에도 보이도록 서버에 동기화한다.
// 메인 포털과 동일 출처의 사용자 API를 사용한다.
const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';

const normalize = (ticker: string) => ticker.trim().toUpperCase();

// 숫자 코드(예: 005930)는 한국 종목, 그 외(AAPL 등)는 미국 종목으로 본다.
const inferMarket = (ticker: string): 'KR' | 'US' => (/^\d/.test(ticker.trim()) ? 'KR' : 'US');

export interface StockMeta {
    name?: string;
    market?: 'KR' | 'US';
}

function readFavorites(): string[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

// 서버 관심종목에 추가 (로그인 안 됐으면 401 → 조용히 무시)
async function syncAddToServer(ticker: string, meta?: StockMeta): Promise<void> {
    const stock_symbol = normalize(ticker);
    if (!stock_symbol) return;
    try {
        await fetch(`${MAIN_PORTAL_URL}/api/user/watchlist`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                stock_symbol,
                stock_name: meta?.name?.trim() || stock_symbol,
                market_type: meta?.market || inferMarket(stock_symbol),
            }),
        });
    } catch {
        /* 동기화 실패는 조용히 무시 (관심종목은 이미 로컬에 저장됨) */
    }
}

// 서버 관심종목에서 제거 (symbol → id 매핑 후 삭제, 실패 시 조용히 무시)
async function syncRemoveFromServer(ticker: string): Promise<void> {
    const symbol = normalize(ticker);
    if (!symbol) return;
    try {
        const res = await fetch(`${MAIN_PORTAL_URL}/api/user/watchlist`, {
            credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        const stocks: Array<{ id: number; stock_symbol: string }> = data.stocks || [];
        const match = stocks.find((s) => normalize(s.stock_symbol) === symbol);
        if (!match) return;
        await fetch(`${MAIN_PORTAL_URL}/api/user/watchlist/${match.id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    } catch {
        /* 동기화 실패는 조용히 무시 */
    }
}

/**
 * 관심종목(내가 지정한 주식) 목록을 localStorage에 영구 저장하고 관리하는 훅.
 * 지정한 종목은 종목 페이지 최상단에 최우선으로 노출된다.
 * 로그인 상태라면 마이페이지(주식)에도 보이도록 서버 관심종목과 동기화한다.
 */
export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>(readFavorites);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch {
            /* 저장 실패는 조용히 무시 */
        }
    }, [favorites]);

    const isFavorite = useCallback(
        (ticker: string) => favorites.includes(normalize(ticker)),
        [favorites]
    );

    const add = useCallback((ticker: string, meta?: StockMeta) => {
        const t = normalize(ticker);
        if (!t) return;
        setFavorites((prev) => (prev.includes(t) ? prev : [...prev, t]));
        void syncAddToServer(t, meta);
    }, []);

    const remove = useCallback((ticker: string) => {
        const t = normalize(ticker);
        setFavorites((prev) => prev.filter((x) => x !== t));
        void syncRemoveFromServer(t);
    }, []);

    const toggle = useCallback((ticker: string, meta?: StockMeta) => {
        const t = normalize(ticker);
        if (!t) return;
        setFavorites((prev) => {
            if (prev.includes(t)) {
                void syncRemoveFromServer(t);
                return prev.filter((x) => x !== t);
            }
            void syncAddToServer(t, meta);
            return [...prev, t];
        });
    }, []);

    return { favorites, isFavorite, add, remove, toggle };
}
