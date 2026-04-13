import { useEffect } from 'react';

export default function FinancePage() {
    useEffect(() => {
        const isDev = window.location.hostname === 'localhost';
        window.location.replace(isDev ? 'http://localhost:5010' : '/finance/');
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <i className="fas fa-chart-line text-4xl text-green-600 mb-4"></i>
                <p className="text-gray-600 font-medium">금융 포털로 이동 중입니다...</p>
            </div>
        </div>
    );
}
