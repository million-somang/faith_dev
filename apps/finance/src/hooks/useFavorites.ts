import { useState, useEffect, useCallback } from 'react';

// 관심종목은 이 기기(localStorage)에 저장한다. 서버 DB는 건드리지 않는다.
const STORAGE_KEY = 'finance:favorites';

const normalize = (ticker: string) => ticker.trim().toUpperCase();

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

/**
 * 관심종목(내가 지정한 주식) 목록을 localStorage에 영구 저장하고 관리하는 훅.
 * 지정한 종목은 종목 페이지 최상단에 최우선으로 노출된다.
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

    const add = useCallback((ticker: string) => {
        const t = normalize(ticker);
        if (!t) return;
        setFavorites((prev) => (prev.includes(t) ? prev : [...prev, t]));
    }, []);

    const remove = useCallback((ticker: string) => {
        const t = normalize(ticker);
        setFavorites((prev) => prev.filter((x) => x !== t));
    }, []);

    const toggle = useCallback((ticker: string) => {
        const t = normalize(ticker);
        if (!t) return;
        setFavorites((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    }, []);

    return { favorites, isFavorite, add, remove, toggle };
}
