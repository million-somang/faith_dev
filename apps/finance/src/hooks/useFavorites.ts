import { useState, useEffect, useCallback } from 'react';

// 관심종목은 이 기기(localStorage)에 저장한다. 서버 DB는 건드리지 않는다.
const STORAGE_KEY = 'finance:favorites';

// 로그인한 사용자의 경우, 마이페이지(주식 관심종목)에도 보이도록 서버 DB에 동기화한다.
const API_BASE = import.meta.env.DEV ? 'http://localhost:4200' : '';

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

// 서버 관심종목에 추가
async function syncAddToServer(ticker: string, meta?: StockMeta): Promise<void> {
    const symbol = normalize(ticker);
    if (!symbol) return;
    const name = meta?.name?.trim() || symbol;
    const market = meta?.market || inferMarket(symbol);
    try {
        await fetch(`${API_BASE}/api/user/watchlist`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                symbol,
                name,
                market,
                stock_symbol: symbol,
                stock_name: name,
                market_type: market,
            }),
        });
    } catch (e) {
        console.error('Failed to sync watchlist to server:', e);
    }
}

// 서버 관심종목에서 제거
async function syncRemoveFromServer(ticker: string): Promise<void> {
    const symbol = normalize(ticker);
    if (!symbol) return;
    try {
        const res = await fetch(`${API_BASE}/api/user/watchlist`, {
            credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        const stocks: Array<{ id: number; stock_symbol: string }> = data.stocks || [];
        const match = stocks.find((s) => normalize(s.stock_symbol) === symbol);
        if (!match) return;
        await fetch(`${API_BASE}/api/user/watchlist/${match.id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    } catch (e) {
        console.error('Failed to remove watchlist from server:', e);
    }
}

/**
 * 관심종목(내가 지정한 주식) 목록을 localStorage 및 백엔드 DB 서버와 동기화하는 훅.
 */
export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>(readFavorites);

    // 마운트 시 서버 DB 관심종목 불러와 로컬 상태와 병합 및 동기화
    useEffect(() => {
        let cancelled = false;
        fetch(`${API_BASE}/api/user/watchlist`, { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled || !data || !Array.isArray(data.stocks)) return;
                const serverSymbols = data.stocks.map((s: { stock_symbol: string }) => normalize(s.stock_symbol));
                if (serverSymbols.length > 0) {
                    setFavorites((prev) => {
                        const merged = Array.from(new Set([...prev, ...serverSymbols]));
                        return merged;
                    });
                }
            })
            .catch(() => {});

        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch {
            /* 저장 실패 무시 */
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
