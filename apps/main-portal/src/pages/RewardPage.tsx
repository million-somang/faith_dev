import { Header, Footer, Card } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';

// 목업 데이터 (실제 API 연동 전 임시)
const ATTENDANCE = [
    { day: '월', done: true, point: 10 },
    { day: '화', done: true, point: 10 },
    { day: '수', done: true, point: 10 },
    { day: '목', done: false, point: 20, today: true },
    { day: '금', done: false, point: 10 },
    { day: '토', done: false, point: 10 },
    { day: '일', done: false, point: 50 },
];

const MISSIONS = [
    { icon: 'fa-newspaper', title: '오늘의 뉴스 3개 읽기', desc: '관심 카테고리 뉴스를 읽어보세요', point: 30, progress: 2, total: 3 },
    { icon: 'fa-gamepad', title: '미니게임 1판 플레이', desc: '테트리스, 2048 등 아무거나', point: 20, progress: 0, total: 1 },
    { icon: 'fa-chart-line', title: '관심 종목 등록하기', desc: '마이페이지에서 종목을 추가하세요', point: 50, progress: 1, total: 1 },
];

const REWARDS = [
    { icon: 'fa-coffee', name: '아메리카노 기프티콘', point: 4500, tag: 'HOT' },
    { icon: 'fa-hamburger', name: '햄버거 세트', point: 8000, tag: '' },
    { icon: 'fa-ticket', name: '영화 예매권', point: 12000, tag: '' },
    { icon: 'fa-gift', name: '편의점 5천원권', point: 5000, tag: 'NEW' },
    { icon: 'fa-mug-hot', name: '카페 디저트 세트', point: 9500, tag: '' },
    { icon: 'fa-store', name: '온라인몰 1만원 쿠폰', point: 10000, tag: '' },
];

const HISTORY = [
    { title: '출석 체크 보상', date: '2026.06.20', point: 10, plus: true },
    { title: '뉴스 읽기 미션 완료', date: '2026.06.19', point: 30, plus: true },
    { title: '아메리카노 교환', date: '2026.06.17', point: 4500, plus: false },
    { title: '미니게임 미션 완료', date: '2026.06.17', point: 20, plus: true },
];

export default function RewardPage() {
    const { user, logout } = useAuth();
    const balance = 12450;

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <PageSEO
                title="리워드 - 포인트 적립하고 혜택 받기"
                description="출석 체크, 미션 완료로 포인트를 모으고 다양한 리워드로 교환하세요."
                path="/reward"
            />
            <Header user={user} onLogout={logout} />

            <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-8">
                {/* 목업 안내 배지 */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                    <i className="fas fa-flask"></i> 목업 화면 — 디자인 미리보기용 (실제 데이터 아님)
                </div>

                {/* 포인트 잔액 히어로 */}
                <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 text-white px-6 sm:px-10 py-10 shadow-xl">
                    <div className="absolute -top-16 -right-12 w-60 h-60 rounded-full bg-white/10 pointer-events-none"></div>
                    <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-indigo-400/20 pointer-events-none"></div>
                    <div className="relative">
                        <p className="text-blue-100 text-sm font-bold mb-1">내 포인트</p>
                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-4xl sm:text-5xl font-black tracking-tight">{balance.toLocaleString()}</span>
                            <span className="text-xl font-bold text-blue-100 mb-1">P</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button className="px-5 py-2.5 rounded-xl bg-white text-blue-700 text-sm font-bold shadow-sm hover:shadow-md transition-all">
                                <i className="fas fa-gift mr-2"></i>포인트 사용하기
                            </button>
                            <button className="px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur-sm text-white text-sm font-bold hover:bg-white/25 transition-colors">
                                <i className="fas fa-clock-rotate-left mr-2"></i>적립 내역
                            </button>
                        </div>
                    </div>
                </section>

                {/* 출석 체크 */}
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <i className="fas fa-calendar-check text-blue-600"></i> 출석 체크
                        </h2>
                        <span className="text-xs font-bold text-gray-400">이번 주 3일 연속 출석 중 🔥</span>
                    </div>
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

                {/* 오늘의 미션 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="fas fa-bullseye text-blue-600"></i> 오늘의 미션
                    </h2>
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
                </section>

                {/* 리워드 교환 */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <i className="fas fa-store text-blue-600"></i> 리워드 교환
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {REWARDS.map((r) => (
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
                                <button className="w-full py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors">
                                    교환하기
                                </button>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* 포인트 내역 */}
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
            </main>

            <Footer />
        </div>
    );
}
