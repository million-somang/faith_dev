import { Card } from '@faithportal/ui';
import { ATTENDANCE } from './data';

export default function RewardAttendance() {
    return (
        <div className="space-y-6">
            {/* 돈/포인트 테마 히어로 배너 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white px-6 sm:px-10 py-8 shadow-xl">
                <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-8 w-64 h-64 rounded-full bg-amber-300/20 pointer-events-none"></div>
                <i className="fas fa-coins absolute right-6 bottom-2 text-7xl sm:text-8xl text-white/15 pointer-events-none"></i>
                <div className="relative">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold mb-3">
                        <i className="fas fa-won-sign"></i> 출석 리워드
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                        출석만 해도 현금처럼 쓰는 포인트가 쌓여요
                    </h1>
                    <p className="text-amber-50 text-sm font-medium">
                        이번 달 <b>180P</b> 적립 중 · 7일 개근 시 <b>+50P</b> 보너스 · <span className="font-bold">1P = 1원</span> 상당
                    </p>
                </div>
            </section>

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
