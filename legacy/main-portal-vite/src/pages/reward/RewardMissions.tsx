import { Card } from '@faithportal/ui';
import { MISSIONS } from './data';

export default function RewardMissions() {
    return (
        <div className="space-y-6">
            {/* 미션 테마 히어로 배너 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white px-6 sm:px-10 py-8 shadow-xl">
                <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-8 w-64 h-64 rounded-full bg-violet-300/20 pointer-events-none"></div>
                <i className="fas fa-bullseye absolute right-6 bottom-2 text-7xl sm:text-8xl text-white/15 pointer-events-none"></i>
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3">
                        <i className="fas fa-bolt"></i> 오늘의 미션
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                        미션 깨고 오늘 최대 <span className="text-yellow-300">100P</span> 받아가세요
                    </h1>
                    <p className="text-indigo-100 text-sm font-medium">
                        오늘 <b>1/3</b> 완료 · 모두 클리어 시 <b>+10P</b> 추가 보너스 · 매일 0시 초기화
                    </p>
                </div>
            </section>

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
