'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'finance:favorites';

const normalize = (ticker: string) => ticker.trim().toUpperCase();

const inferMarket = (ticker: string): 'KR' | 'US' => (/^\d/.test(ticker.trim()) ? 'KR' : 'US');

export interface StockMeta {
    name?: string;
    market?: 'KR' | 'US';
}

function readFavorites(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

async function syncAddToServer(ticker: string, meta?: StockMeta): Promise<void> {
    const symbol = normalize(ticker);
    if (!symbol) return;
    const name = meta?.name?.trim() || symbol;
    const market = meta?.market || inferMarket(symbol);
    try {
        await fetch('/api/user/watchlist', {
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
    } catch {
        // 비로그인 또는 네트워크 오류 무시
    }
}

async function syncRemoveFromServer(ticker: string): Promise<void> {
    const symbol = normalize(ticker);
    if (!symbol) return;
    try {
        const res = await fetch('/api/user/watchlist', {
            credentials: 'include',
        });
        if (!res.ok) return;
        const data = await res.json();
        const stocks: Array<{ id: number; stock_symbol: string }> = data.stocks || [];
        const match = stocks.find((s) => normalize(s.stock_symbol) === symbol);
        if (!match) return;
        await fetch(`/api/user/watchlist/${match.id}`, {
            method: 'DELETE',
            credentials: 'include',
        });
    } catch {
        // 비로그인 또는 네트워크 오류 무시
    }
}

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    useEffect(() => {
        setFavorites(readFavorites());
        let cancelled = false;
        fetch('/api/user/watchlist', { credentials: 'include' })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (cancelled || !data || !Array.isArray(data.stocks)) return;
                const serverSymbols = data.stocks.map((s: { stock_symbol: string }) =>
                    normalize(s.stock_symbol)
                );
                if (serverSymbols.length > 0) {
                    setFavorites((prev) => Array.from(new Set([...prev, ...serverSymbols])));
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch {
            // 저장 실패 무시
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
