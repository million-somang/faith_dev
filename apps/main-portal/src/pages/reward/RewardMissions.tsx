import { Card } from '@faithportal/ui';
import { MISSIONS } from './data';

export default function RewardMissions() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">오늘의 미션</h1>
                <p className="text-sm text-gray-500 mt-1">미션을 완료하고 포인트를 받으세요. 매일 0시에 초기화됩니다.</p>
            </div>

            <div className="space-y-3">
                {MISSIONS.map((m) => {
                    const cleared = m.progress >= m.total;
                    return (
                        <Card key={m.title} className="p-4 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                                <i className={`fas ${m.icon} text-lg`}></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm">{m.title}</p>
                                <p className="text-xs text-gray-500 mb-1.5">{m.desc}</p>
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(m.progress / m.total) * 100}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">{m.progress}/{m.total} 완료</p>
                            </div>
                            <button
                                disabled={!cleared}
                                className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-colors
                                    ${cleared ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                {cleared ? `+${m.point}P 받기` : `+${m.point}P`}
                            </button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
