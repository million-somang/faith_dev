import { BarChart, Info } from 'lucide-react';
import type { TextStats } from '../hooks/useTextStats';

interface StatsPanelProps {
    stats: TextStats;
    platform: 'naver' | 'jobkorea';
    setPlatform: (val: 'naver' | 'jobkorea') => void;
}

export default function StatsPanel({ stats, platform, setPlatform }: StatsPanelProps) {
    return (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 shadow-lg sticky top-4">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <BarChart size={18} /> 실시간 분석
            </h3>

            <div className="space-y-4">
                <div className="flex justify-between items-end border-b-2 border-blue-300 pb-3">
                    <span className="text-gray-700 font-medium">공백 포함</span>
                    <span className="text-4xl font-bold text-blue-900">
                        {stats.charWithSpace.toLocaleString()}
                        <span className="text-sm font-normal text-gray-600 ml-1">자</span>
                    </span>
                </div>
                <div className="flex justify-between items-end pb-2">
                    <span className="text-gray-600 text-sm">공백 제외</span>
                    <span className="text-2xl font-semibold text-gray-700">
                        {stats.charWithoutSpace.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 ml-1">자</span>
                    </span>
                </div>
                <div className="flex justify-between items-end pb-2">
                    <span className="text-gray-600 text-sm">용량 (UTF-8)</span>
                    <span className="text-lg font-medium text-gray-600">
                        {stats.byteCount.toLocaleString()}
                        <span className="text-sm font-normal text-gray-500 ml-1">bytes</span>
                    </span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-gray-600 text-sm">줄 바꿈</span>
                    <span className="text-lg font-medium text-gray-600">
                        {stats.lineCount}
                        <span className="text-sm font-normal text-gray-500 ml-1">줄</span>
                    </span>
                </div>
            </div>

            {/* Platform Options */}
            <div className="mt-6 bg-white p-1 rounded-lg flex text-xs font-medium border-2 border-blue-200">
                <button
                    onClick={() => setPlatform('naver')}
                    className={`flex-1 py-2 rounded transition shadow-sm ${platform === 'naver' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    네이버/사람인
                </button>
                <button
                    onClick={() => setPlatform('jobkorea')}
                    className={`flex-1 py-2 rounded transition shadow-sm ${platform === 'jobkorea' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600'}`}
                >
                    잡코리아
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center flex justify-center items-center gap-1">
                <Info size={12} /> 플랫폼별 줄바꿈 계산 방식 적용
            </p>
        </div>
    );
}
