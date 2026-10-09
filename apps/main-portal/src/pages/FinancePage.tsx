import { useEffect } from 'react';

export default function FinancePage() {
    useEffect(() => {
        const isDev = window.location.hostname === 'localhost';
        window.location.replace(isDev ? 'http://localhost:5010' : '/finance');
    }, []);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
            <div className="text-center p-8">
                <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-lg font-bold text-slate-800 mb-1">금융 포털로 연결 중입니다</h2>
                <p className="text-xs text-slate-500">실시간 글로벌 증시 및 환율 데이터를 불러옵니다...</p>
            </div>
        </div>
    );
}
