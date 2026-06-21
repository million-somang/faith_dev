import { Card } from '@faithportal/ui';
import { ATTENDANCE } from './data';

export default function RewardAttendance() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">출석체크</h1>
                <p className="text-sm text-gray-500 mt-1">매일 출석하고 포인트를 받으세요. 연속 출석 시 보너스!</p>
            </div>

            {/* 연속 출석 요약 */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: '이번 주 출석', value: '3일' },
                    { label: '연속 출석', value: '3일 🔥' },
                    { label: '이번 달 적립', value: '180P' },
                ].map((s) => (
                    <Card key={s.label} className="p-4 text-center">
                        <p className="text-xs text-gray-400 font-bold mb-1">{s.label}</p>
                        <p className="text-lg font-black text-blue-600">{s.value}</p>
                    </Card>
                ))}
            </div>

            {/* 주간 출석판 */}
            <Card className="p-6">
                <h2 className="text-base font-bold text-gray-900 mb-5">이번 주 출석 현황</h2>
                <div className="grid grid-cols-7 gap-2">
                    {ATTENDANCE.map((a) => (
                        <div
                            key={a.day}
                            className={`flex flex-col items-center justify-center gap-1 py-3 rounded-2xl border text-center transition-all
                                ${a.done ? 'bg-blue-50 border-blue-200' : a.today ? 'bg-white border-blue-500 border-2 shadow-sm' : 'bg-gray-50 border-gray-100'}`}
                        >
                            <span className="text-[11px] font-bold text-gray-500">{a.day}</span>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                ${a.done ? 'bg-blue-600 text-white' : a.today ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'}`}>
                                {a.done ? <i className="fas fa-check"></i> : <i className="fas fa-star text-[11px]"></i>}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">+{a.point}P</span>
                        </div>
                    ))}
                </div>
                <button className="mt-5 w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors">
                    오늘 출석하고 20P 받기
                </button>
            </Card>
        </div>
    );
}
