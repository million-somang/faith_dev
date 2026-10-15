import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

import FinancePage from './pages/FinancePage';
import StocksPage from './pages/StocksPage';
import ExchangePage from './pages/ExchangePage';
import BankingPage from './pages/BankingPage';
import StockDetailPage from './pages/StockDetailPage';
import FinanceUtilPage from './pages/FinanceUtilPage';
import { MobileTabBar } from './components/MobileTabBar';

function getFinanceSessionId(): string {
    try {
        const now = new Date();
        const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const today = kst.toISOString().slice(0, 10);
        let sessionId = sessionStorage.getItem('fl_session_id');
        const savedDate = localStorage.getItem('fl_session_date');
        const savedLocalId = localStorage.getItem('fl_session_id');

        if (!sessionId) {
            if (savedDate === today && savedLocalId) {
                sessionId = savedLocalId;
            } else {
                sessionId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                    ? crypto.randomUUID()
                    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                        const r = (Math.random() * 16) | 0;
                        const v = c === 'x' ? r : (r & 0x3) | 0x8;
                        return v.toString(16);
                    });
            }
            sessionStorage.setItem('fl_session_id', sessionId);
        }
        localStorage.setItem('fl_session_id', sessionId);
        localStorage.setItem('fl_session_date', today);
        return sessionId;
    } catch {
        return 'finance-session';
    }
}

function sendBeaconOrFetch(endpoint: string, payload: Record<string, unknown>): void {
    try {
        const body = JSON.stringify(payload);
        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
            const sent = navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
            if (sent) return;
        }
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            keepalive: true,
        }).catch(() => {});
    } catch {
        // 무시
    }
}

function App() {
    const location = useLocation();
    const currentPathRef = useRef<string>('');
    const enteredAtRef = useRef<number>(Date.now());

    const sendDuration = () => {
        const trackedPath = currentPathRef.current;
        const enteredAt = enteredAtRef.current;
        if (!trackedPath || !enteredAt) return;
        const durationMs = Date.now() - enteredAt;
        if (durationMs < 1000) return;
        sendBeaconOrFetch('/api/analytics/duration', {
            sessionId: getFinanceSessionId(),
            path: trackedPath,
            durationMs: Math.min(durationMs, 30 * 60 * 1000),
        });
    };

    useEffect(() => {
        const fullPath = typeof window !== 'undefined' ? window.location.pathname : `/finance${location.pathname}`;
        if (currentPathRef.current === fullPath) return;

        if (currentPathRef.current) {
            sendDuration();
        }

        currentPathRef.current = fullPath;
        enteredAtRef.current = Date.now();

        sendBeaconOrFetch('/api/analytics/pageview', {
            sessionId: getFinanceSessionId(),
            path: fullPath,
            referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
            screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
            userId: typeof localStorage !== 'undefined' ? localStorage.getItem('user_id') || undefined : undefined,
        });
    }, [location.pathname]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') sendDuration();
            else if (document.visibilityState === 'visible') enteredAtRef.current = Date.now();
        };
        window.addEventListener('beforeunload', sendDuration);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            window.removeEventListener('beforeunload', sendDuration);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    return (
        <>
            <Routes>
                <Route path="/" element={<FinancePage />} />
                <Route path="/stocks" element={<StocksPage />} />
                <Route path="/exchange" element={<ExchangePage />} />
                <Route path="/banking" element={<BankingPage />} />
                <Route path="/insurance" element={<Navigate to="/" replace />} />
                <Route path="/util" element={<FinanceUtilPage />} />
                <Route path="/finance/util" element={<FinanceUtilPage />} />
                <Route path="/finance-util" element={<FinanceUtilPage />} />
                <Route path="/stock/:ticker" element={<StockDetailPage />} />
            </Routes>
            <MobileTabBar />
        </>
    );
}

export default App;

