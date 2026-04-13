import { useState, useMemo } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import { Cake, CalendarDays, CheckCircle2, XCircle, Star, Bell, Gift } from 'lucide-react';

// ── 띠 데이터 ──
const ZODIACS = [
    { name: '쥐띠', emoji: '🐭', desc: '애정적이고 리더십이 강함' },
    { name: '소띠', emoji: '🐮', desc: '성실하고 인내심이 강함' },
    { name: '호랑이띠', emoji: '🐯', desc: '활동적이고 자유로운' },
    { name: '토끼띠', emoji: '🐰', desc: '온순하고 예술적 감각이 뛰어남' },
    { name: '용띠', emoji: '🐲', desc: '재치있고 통찰력 있음' },
    { name: '뱀띠', emoji: '🐍', desc: '지혜롭고 유능해요' },
    { name: '말띠', emoji: '🐴', desc: '충성스럽고 정의로운' },
    { name: '양띠', emoji: '🐑', desc: '관대하고 온수함' },
    { name: '원숭이띠', emoji: '🐵', desc: '영리하고 사교성이 넘쳐요' },
    { name: '닭띠', emoji: '🐔', desc: '정직하고 부지런함' },
    { name: '개띠', emoji: '🐶', desc: '충직하고 다정해요' },
    { name: '돼지띠', emoji: '🐷', desc: '온화하고 자상해요' },
] as const;

// ── 별자리 데이터 ──
const STAR_SIGNS = [
    { name: '물병자리', start: [1, 20], end: [2, 18], emoji: '♒' },
    { name: '물고기자리', start: [2, 19], end: [3, 20], emoji: '♓' },
    { name: '양자리', start: [3, 21], end: [4, 19], emoji: '♈' },
    { name: '황소자리', start: [4, 20], end: [5, 20], emoji: '♉' },
    { name: '쌍둥이자리', start: [5, 21], end: [6, 21], emoji: '♊' },
    { name: '게자리', start: [6, 22], end: [7, 22], emoji: '♋' },
    { name: '사자자리', start: [7, 23], end: [8, 22], emoji: '♌' },
    { name: '처녀자리', start: [8, 23], end: [9, 23], emoji: '♍' },
    { name: '천칭자리', start: [9, 24], end: [10, 22], emoji: '♎' },
    { name: '전갈자리', start: [10, 23], end: [11, 22], emoji: '♏' },
    { name: '사수자리', start: [11, 23], end: [12, 24], emoji: '♐' },
    { name: '염소자리', start: [12, 25], end: [1, 19], emoji: '♑' },
] as const;

// ── 생활 체크리스트 데이터 ──
const CHECKLIST_ITEMS = [
    { name: '투표권', manReq: 18, yeonReq: null, maxAge: null, icon: '🗳️', desc: '국회의원, 대통령 선거' },
    { name: '운전면허', manReq: 18, yeonReq: null, maxAge: null, icon: '🚗', desc: '2종 보통면허 취득 가능' },
    { name: '아르바이트', manReq: 15, yeonReq: null, maxAge: null, icon: '💼', desc: '취업 인증서 필요' },
    { name: '주류 구매', manReq: null, yeonReq: 19, maxAge: null, icon: '🍺', desc: '1월 1일 기준 연 나이' },
    { name: '상화 관람(청불)', manReq: 18, yeonReq: null, maxAge: null, icon: '🎬', desc: '청소년 관람불가' },
    { name: '워킹홀리데이', manReq: 18, yeonReq: null, maxAge: 30, icon: '✈️', desc: '국가별 상이' },
] as const;

// ── 별자리 찾기 헬퍼 ──
function getStarSign(month: number, day: number) {
    for (const sign of STAR_SIGNS) {
        const [startMonth, startDay] = sign.start;
        const [endMonth, endDay] = sign.end;
        if (startMonth === endMonth) {
            if (month === startMonth && day >= startDay && day <= endDay) return sign;
        } else {
            if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) return sign;
        }
    }
    return STAR_SIGNS[0];
}

// ── 인터페이스 ──
interface AgeResult {
    manAge: number;
    yeonAge: number;
    koreanAge: number;
    daysUntilBirthday: number;
    isBirthdayToday: boolean;
}

function App() {
    const { isLoading } = useAuth();

    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [referenceDate, setReferenceDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [showResults, setShowResults] = useState(false);

    // ── 나이 계산 ──
    const ageResult = useMemo<AgeResult | null>(() => {
        const year = parseInt(birthYear);
        const month = parseInt(birthMonth);
        const day = parseInt(birthDay);
        if (!year || !month || !day || !referenceDate) return null;

        const birthDate = new Date(year, month - 1, day);
        const ref = new Date(referenceDate);
        const currentYear = ref.getFullYear();

        // 연 나이
        const yeonAge = currentYear - year;
        // 한국(세는) 나이
        const koreanAge = yeonAge + 1;
        // 만 나이
        let manAge = yeonAge;
        const isBirthdayPassed =
            ref.getMonth() > birthDate.getMonth() ||
            (ref.getMonth() === birthDate.getMonth() && ref.getDate() >= birthDate.getDate());
        if (!isBirthdayPassed) manAge -= 1;

        // D-Day
        const nextBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
        if (isBirthdayPassed) nextBirthday.setFullYear(currentYear + 1);
        const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - ref.getTime()) / (1000 * 60 * 60 * 24));

        return {
            manAge,
            yeonAge,
            koreanAge,
            daysUntilBirthday,
            isBirthdayToday: daysUntilBirthday === 0 || (isBirthdayPassed && ref.getMonth() === birthDate.getMonth() && ref.getDate() === birthDate.getDate()),
        };
    }, [birthYear, birthMonth, birthDay, referenceDate]);

    // ── 띠 ──
    const zodiac = useMemo(() => {
        const year = parseInt(birthYear);
        if (!year) return null;
        return ZODIACS[(year - 4) % 12];
    }, [birthYear]);

    // ── 별자리 ──
    const starSign = useMemo(() => {
        const month = parseInt(birthMonth);
        const day = parseInt(birthDay);
        if (!month || !day) return null;
        return getStarSign(month, day);
    }, [birthMonth, birthDay]);

    // ── 생애 주기 알림 ──
    const lifecycleAlerts = useMemo(() => {
        if (!ageResult) return [];
        const { manAge } = ageResult;
        const alerts: { icon: string; title: string; desc: string }[] = [];

        if (manAge === 18 || manAge === 19) {
            alerts.push({ icon: '🎓', title: '성년의 시작', desc: '법적으로 성인이 되었습니다! 투표권, 운전면허 취득 가능' });
        }
        if (manAge >= 18 && manAge < 30) {
            alerts.push({ icon: '✈️', title: '워킹홀리데이', desc: '해외에서 일하며 여행할 수 있는 절호의 기회입니다' });
        }
        if (manAge >= 38 && manAge <= 42) {
            alerts.push({ icon: '🏥', title: '생애전환기 건강검진', desc: '만 40세에는 생애전환기 건강검진 대상입니다' });
        }
        if (manAge >= 63 && manAge <= 67) {
            alerts.push({ icon: '🏦', title: '국민연금 수령', desc: '만 65세에는 기초연금 수령 여부 확인해보세요' });
        }

        return alerts;
    }, [ageResult]);

    // ── 체크리스트 검사 ──
    const checklistResults = useMemo(() => {
        if (!ageResult) return [];
        const { manAge, yeonAge } = ageResult;
        return CHECKLIST_ITEMS.map(item => {
            let canDo = false;
            let statusText = '';

            if (item.yeonReq !== null) {
                canDo = yeonAge >= item.yeonReq;
                statusText = canDo ? '가능' : `연 ${item.yeonReq}세부터`;
            } else if (item.manReq !== null) {
                if (item.maxAge) {
                    canDo = manAge >= item.manReq && manAge <= item.maxAge;
                    statusText = canDo ? '가능' : (manAge < item.manReq ? `만 ${item.manReq}세부터` : '연령 초과');
                } else {
                    canDo = manAge >= item.manReq;
                    statusText = canDo ? '가능' : `만 ${item.manReq}세부터`;
                }
            }

            return { ...item, canDo, statusText };
        });
    }, [ageResult]);

    const handleCalculate = () => {
        if (!birthYear || !birthMonth || !birthDay || !referenceDate) {
            return;
        }
        setShowResults(true);
        setTimeout(() => {
            document.getElementById('age-results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 100);
    };

    const setToday = () => {
        const d = new Date();
        setReferenceDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500 min-h-screen flex items-center justify-center">Loading...</div>;

    return (
        <MiniAppLayout title="한국 나이 계산기">
            <div className="min-h-[calc(100vh-56px)] bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 overflow-y-auto flex flex-col">
                <div className="max-w-lg mx-auto px-4 py-6 flex flex-col items-center w-full">

                    {/* ── 헤더 ── */}
                    <div className="w-full text-center mb-5">
                        <div className="text-4xl mb-2">🎂</div>
                        <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 tracking-tight">
                            한국 나이 계산기
                        </h1>
                        <p className="text-slate-500 text-xs mt-1">만 나이 · 연 나이 · 세는 나이 한번에</p>
                    </div>

                    {/* ── 생년월일 입력 ── */}
                    <div className="w-full bg-slate-800/60 rounded-2xl p-5 mb-4 border border-slate-700/50">
                        <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                            <CalendarDays size={16} className="text-blue-400" />
                            생년월일 입력
                        </h3>

                        <div className="grid grid-cols-3 gap-2 mb-4">
                            {/* 년 */}
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">출생년도</label>
                                <input
                                    type="number"
                                    value={birthYear}
                                    onChange={e => setBirthYear(e.target.value)}
                                    placeholder="1995"
                                    min={1900}
                                    max={2025}
                                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-3 py-3 text-lg font-bold text-white text-center placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                            </div>
                            {/* 월 */}
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">월</label>
                                <select
                                    value={birthMonth}
                                    onChange={e => setBirthMonth(e.target.value)}
                                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-2 py-3 text-lg font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="">월</option>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}월</option>
                                    ))}
                                </select>
                            </div>
                            {/* 일 */}
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">일</label>
                                <select
                                    value={birthDay}
                                    onChange={e => setBirthDay(e.target.value)}
                                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-2 py-3 text-lg font-bold text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none"
                                >
                                    <option value="">일</option>
                                    {Array.from({ length: 31 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}일</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* 기준일 */}
                        <div className="mb-4">
                            <label className="text-[10px] text-slate-500 mb-1 block">계산 기준일 (선택사항)</label>
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    value={referenceDate}
                                    onChange={e => setReferenceDate(e.target.value)}
                                    className="flex-1 bg-slate-900/80 border border-slate-600 rounded-xl px-3 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                                <button
                                    onClick={setToday}
                                    className="px-4 py-2.5 bg-slate-700/80 hover:bg-slate-600 text-slate-300 font-medium rounded-xl transition text-sm"
                                >
                                    오늘
                                </button>
                            </div>
                        </div>

                        {/* 계산 버튼 */}
                        <button
                            onClick={handleCalculate}
                            disabled={!birthYear || !birthMonth || !birthDay}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-base rounded-xl hover:from-blue-600 hover:to-indigo-700 transition shadow-lg shadow-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Cake size={18} />
                            나이 계산하기
                        </button>
                    </div>

                    {/* ── 결과 영역 ── */}
                    {showResults && ageResult && (
                        <div id="age-results" className="w-full space-y-4">
                            {/* 나이 카드 3종 */}
                            <div className="grid grid-cols-3 gap-2">
                                {/* 만 나이 */}
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg shadow-blue-600/20">
                                    <div className="text-[10px] font-semibold text-blue-200 mb-1 flex items-center gap-1">
                                        <span>📋</span> 만 나이
                                    </div>
                                    <div className="text-3xl font-black mb-1">{ageResult.manAge}<span className="text-lg">세</span></div>
                                    <div className="text-[9px] text-blue-200 leading-tight">법적 기준</div>
                                </div>
                                {/* 연 나이 */}
                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-lg shadow-purple-600/20">
                                    <div className="text-[10px] font-semibold text-purple-200 mb-1 flex items-center gap-1">
                                        <span>📅</span> 연 나이
                                    </div>
                                    <div className="text-3xl font-black mb-1">{ageResult.yeonAge}<span className="text-lg">세</span></div>
                                    <div className="text-[9px] text-purple-200 leading-tight">청소년보호법</div>
                                </div>
                                {/* 세는 나이 */}
                                <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-4 text-white shadow-lg shadow-pink-600/20">
                                    <div className="text-[10px] font-semibold text-pink-200 mb-1 flex items-center gap-1">
                                        <span>🇰🇷</span> 세는 나이
                                    </div>
                                    <div className="text-3xl font-black mb-1">{ageResult.koreanAge}<span className="text-lg">세</span></div>
                                    <div className="text-[9px] text-pink-200 leading-tight">사회적 통용</div>
                                </div>
                            </div>

                            {/* D-Day */}
                            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shrink-0">
                                    <Gift size={20} className="text-white" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">
                                        {ageResult.isBirthdayToday
                                            ? '🎉 오늘이 생일입니다!'
                                            : `다음 생일까지 D-${ageResult.daysUntilBirthday}`
                                        }
                                    </div>
                                    <div className="text-[10px] text-slate-500">
                                        {birthYear}년 {birthMonth}월 {birthDay}일생
                                    </div>
                                </div>
                            </div>

                            {/* 띠 & 별자리 */}
                            {(zodiac || starSign) && (
                                <div className="grid grid-cols-2 gap-2">
                                    {zodiac && (
                                        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                            <div className="text-2xl mb-1">{zodiac.emoji}</div>
                                            <div className="text-base font-bold text-white">{zodiac.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{zodiac.desc}</div>
                                        </div>
                                    )}
                                    {starSign && (
                                        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                                            <div className="text-2xl mb-1">{starSign.emoji}</div>
                                            <div className="text-base font-bold text-white">{starSign.name}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{birthMonth}월 {birthDay}일</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 생활 체크리스트 */}
                            <div className="bg-slate-800/40 rounded-2xl p-5 border border-slate-700/30">
                                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-400" />
                                    할 수 있는 것 / 없는 것
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {checklistResults.map(item => (
                                        <div
                                            key={item.name}
                                            className={`p-3 rounded-xl border transition-all ${item.canDo
                                                    ? 'bg-emerald-500/10 border-emerald-500/30'
                                                    : 'bg-slate-800/50 border-slate-700/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-lg">{item.icon}</span>
                                                {item.canDo
                                                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                                                    : <XCircle size={16} className="text-slate-600" />
                                                }
                                            </div>
                                            <div className="text-xs font-bold text-white">{item.name}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                                            <div className={`text-[10px] font-semibold mt-1 ${item.canDo ? 'text-emerald-400' : 'text-slate-500'}`}>
                                                {item.statusText}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 생애 주기 알림 */}
                            {lifecycleAlerts.length > 0 && (
                                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-5 border border-amber-500/30">
                                    <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
                                        <Bell size={16} />
                                        생애 주기 알림
                                    </h3>
                                    <div className="space-y-2">
                                        {lifecycleAlerts.map((alert, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl"
                                            >
                                                <span className="text-2xl shrink-0">{alert.icon}</span>
                                                <div>
                                                    <div className="text-xs font-bold text-white">{alert.title}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{alert.desc}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 참고 안내 */}
                            <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/20">
                                <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                                    <Star size={12} /> 나이 계산 기준 안내
                                </h3>
                                <ul className="space-y-1.5 text-[10px] text-slate-500 leading-relaxed">
                                    <li>
                                        <span className="text-blue-400 font-bold">만 나이:</span> 2023년부터 법적 기준. 생일 기점으로 +1세
                                    </li>
                                    <li>
                                        <span className="text-purple-400 font-bold">연 나이:</span> 현재년도 - 출생년도 (청소년보호법 기준)
                                    </li>
                                    <li>
                                        <span className="text-pink-400 font-bold">세는 나이:</span> 연 나이 + 1 (전통 한국식)
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </MiniAppLayout>
    );
}

export default App;
