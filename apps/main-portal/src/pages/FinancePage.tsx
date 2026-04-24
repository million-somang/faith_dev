import { useEffect } from 'react';
import { PageSEO } from '../components/PageSEO';

export default function FinancePage() {
    useEffect(() => {
        const isDev = window.location.hostname === 'localhost';
        window.location.replace(isDev ? 'http://localhost:5010' : '/finance/');
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <PageSEO
                title="금융 서비스"
                description="대출 계산기, 환율 계산기, 적금/예금 이자 계산기 등 금융 관련 도구를 이용해보세요."
                path="/finance"
            />
            <div className="text-center">
                <i className="fas fa-chart-line text-4xl text-green-600 mb-4"></i>
                <p className="text-gray-600 font-medium">금융 포털로 이동 중입니다...</p>
            </div>
        </div>
    );
}

