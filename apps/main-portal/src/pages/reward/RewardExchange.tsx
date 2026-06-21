import { Card } from '@faithportal/ui';
import { BALANCE, REWARDS } from './data';

export default function RewardExchange() {
    return (
        <div className="space-y-6">
            {/* 교환 테마 히어로 배너 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white px-6 sm:px-10 py-8 shadow-xl">
                <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-8 w-64 h-64 rounded-full bg-teal-200/20 pointer-events-none"></div>
                <i className="fas fa-gift absolute right-6 bottom-1 text-7xl sm:text-8xl text-white/10 pointer-events-none"></i>
                <div className="relative flex items-center justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3">
                            <i className="fas fa-right-left"></i> 리워드 교환
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                            쌓은 포인트, 원하는 리워드로 바꿀 시간
                        </h1>
                        <p className="text-emerald-50 text-sm font-medium">
                            보유 <b>{BALANCE.toLocaleString()}P</b> · 기프티콘·쿠폰 등 6종 교환 가능
                        </p>
                    </div>
                    {/* 교환 모티프: 포인트 ⇄ 선물 */}
                    <div className="relative hidden sm:flex items-center gap-2 shrink-0">
                        <span className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
                            <i className="fas fa-coins"></i>
                        </span>
                        <i className="fas fa-right-left text-xl text-white/80"></i>
                        <span className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl shadow-inner">
                            <i className="fas fa-gift"></i>
                        </span>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {REWARDS.map((r) => {
                    const affordable = BALANCE >= r.point;
                    return (
                        <Card key={r.name} className="p-5 text-center relative hover:shadow-md transition-all">
                            {r.tag && (
                                <span className={`absolute top-3 right-3 text-[9px] font-black px-1.5 py-0.5 rounded
                                    ${r.tag === 'HOT' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {r.tag}
                                </span>
                            )}
                            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600">
                                <i className={`fas ${r.icon} text-xl`}></i>
                            </div>
                            <p className="text-sm font-bold text-gray-900 leading-snug mb-2 min-h-[2.5rem]">{r.name}</p>
                            <p className="text-blue-600 font-black text-sm mb-3">{r.point.toLocaleString()}P</p>
                            <button
                                disabled={!affordable}
                                className={`w-full py-2 rounded-lg text-xs font-bold transition-colors
                                    ${affordable ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                {affordable ? '교환하기' : '포인트 부족'}
                            </button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
