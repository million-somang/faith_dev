import { Link } from 'react-router-dom';
import { Card } from '@faithportal/ui';
import { BALANCE, HISTORY } from './data';

const SHORTCUTS = [
    { to: '/reward/attendance', icon: 'fa-calendar-check', title: '출석체크', desc: '오늘 출석하고 20P 받기', color: 'text-blue-600', bg: 'bg-blue-50' },
    { to: '/reward/missions', icon: 'fa-bullseye', title: '오늘의 미션', desc: '미션 완료하고 최대 100P', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { to: '/reward/exchange', icon: 'fa-store', title: '리워드 교환', desc: '포인트로 기프티콘 받기', color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function RewardHome() {
    return (
        <div className="space-y-8">
            {/* 포인트 잔액 히어로 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white px-6 sm:px-10 py-10 shadow-xl">
                <div className="absolute -top-16 -right-12 w-60 h-60 rounded-full bg-white/10 pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-indigo-400/20 pointer-events-none"></div>
                <div className="relative">
                    <p className="text-blue-100 text-sm font-bold mb-1">내 포인트</p>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-4xl sm:text-5xl font-black tracking-tight">{BALANCE.toLocaleString()}</span>
                        <span className="text-xl font-bold text-blue-100 mb-1">P</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link to="/reward/exchange" className="px-5 py-2.5 rounded-xl bg-white text-blue-700 text-sm font-bold shadow-sm hover:shadow-md transition-all">
                            <i className="fas fa-gift mr-2"></i>포인트 사용하기
                        </Link>
                        <Link to="/reward/attendance" className="px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/25 transition-colors">
                            <i className="fas fa-calendar-check mr-2"></i>출석체크
                        </Link>
                    </div>
                </div>
            </section>

            {/* 바로가기 */}
            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4">바로가기</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {SHORTCUTS.map((s) => (
                        <Link key={s.to} to={s.to}>
                            <Card className="p-5 h-full hover:shadow-md transition-all">
                                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>
                                    <i className={`fas ${s.icon} text-lg`}></i>
                                </div>
                                <p className="font-bold text-gray-900 text-sm mb-1">{s.title}</p>
                                <p className="text-xs text-gray-500">{s.desc}</p>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            {/* 최근 포인트 내역 */}
            <section>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="fas fa-clock-rotate-left text-blue-600"></i> 최근 포인트 내역
                </h2>
                <Card className="divide-y divide-gray-50">
                    {HISTORY.map((h, i) => (
                        <div key={i} className="flex items-center justify-between px-5 py-4">
                            <div>
                                <p className="text-sm font-bold text-gray-800">{h.title}</p>
                                <p className="text-xs text-gray-400">{h.date}</p>
                            </div>
                            <span className={`text-sm font-black ${h.plus ? 'text-blue-600' : 'text-gray-400'}`}>
                                {h.plus ? '+' : '-'}{h.point.toLocaleString()}P
                            </span>
                        </div>
                    ))}
                </Card>
            </section>
        </div>
    );
}
