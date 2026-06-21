import { Card } from '@faithportal/ui';
import { BALANCE, REWARDS } from './data';

export default function RewardExchange() {
    return (
        <div className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">리워드 교환</h1>
                    <p className="text-sm text-gray-500 mt-1">모은 포인트로 다양한 리워드를 교환하세요.</p>
                </div>
                <div className="text-right shrink-0">
                    <p className="text-[11px] text-gray-400 font-bold">보유 포인트</p>
                    <p className="text-lg font-black text-blue-600">{BALANCE.toLocaleString()}P</p>
                </div>
            </div>

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
