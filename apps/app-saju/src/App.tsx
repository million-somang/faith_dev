import { useState, useEffect } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import { calculateSaju, ELEMENT_CONFIG } from './utils/sajuCalculator';
import type { SajuResult } from './utils/sajuCalculator';
import SajuRadarChart from './components/SajuRadarChart';
import CoupleMatchModal from './components/CoupleMatchModal';
import SajuShareModal from './components/SajuShareModal';

type Step = 'init-loading' | 'input' | 'processing' | 'result';
type TabKey = 'natal' | 'business' | 'love' | 'micro';

const MAIN_PORTAL_URL = import.meta.env.DEV ? 'http://localhost:5000' : '';
const FINANCE_URL = import.meta.env.DEV ? 'http://localhost:5010' : '/finance';

export default function App() {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>('init-loading');

    // 1. 입력 폼 상태
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [birthDate, setBirthDate] = useState('1995-08-21');
    const [birthTime, setBirthTime] = useState('14'); // 미시 (13:30~15:30)
    const [isSolar, setIsSolar] = useState(true);

    // 2. 결과 및 UI 상태
    const [result, setResult] = useState<SajuResult | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('natal');
    const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // 3. 인터랙티브 기능 상태 (점심 룰렛, 로또)
    const [pickedMenu, setPickedMenu] = useState<string | null>(null);
    const [isMenuRolling, setIsMenuRolling] = useState(false);
    const [revealedLotto, setRevealedLotto] = useState<number[] | null>(null);
    const [isLottoDrawing, setIsLottoDrawing] = useState(false);

    // 최초 진입 로딩 연출 (1.5초)
    useEffect(() => {
        if (step === 'init-loading') {
            const timer = setTimeout(() => {
                setStep('input');
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // 로그인된 유저 이름 자동 바인딩
    useEffect(() => {
        if (user && user.name && !name) {
            setName(user.name);
        }
    }, [user]);

    // 사주 분석 실행 핸들러
    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        const targetName = name.trim() || (user && user.name) || '이용자';

        setStep('processing');
        setTimeout(() => {
            try {
                const calculated = calculateSaju(targetName, gender, birthDate, birthTime, isSolar);
                setResult(calculated);
                setStep('result');
                setPickedMenu(null);
                setRevealedLotto(null);
            } catch (err) {
                console.error('Saju Calculation Error:', err);
                // Fallback to safe default
                const fallback = calculateSaju('이용자', 'M', '1995-08-21', '12', true);
                setResult(fallback);
                setStep('result');
            }
        }, 600);
    };

    // 점심 메뉴 룰렛 뽑기
    const rollMenu = () => {
        if (!result) return;
        setIsMenuRolling(true);
        const menuPool = [
            result.microDaily.luckyMenu,
            '소고기 전골 & 칼국수',
            '신선한 연어 아보카도 포케',
            '바삭한 수제 돈카츠 & 우동',
            '매콤달콤 비빔밥 & 된장찌개',
            '화덕 마르게리따 피자 & 파스타',
            '담백한 삼계탕 & 깍두기',
            '얼큰한 육개장 & 솥밥'
        ];
        setTimeout(() => {
            const random = menuPool[Math.floor(Math.random() * menuPool.length)];
            setPickedMenu(random);
            setIsMenuRolling(false);
        }, 800);
    };

    // 로또 번호 추출 애니메이션
    const drawLotto = () => {
        if (!result) return;
        setIsLottoDrawing(true);
        setTimeout(() => {
            setRevealedLotto(result.microDaily.lottoNumbers);
            setIsLottoDrawing(false);
        }, 1000);
    };

    return (
        <MiniAppLayout>
            <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 pb-24 text-slate-800 font-sans">
                {/* 1. 인트로 로딩 */}
                {step === 'init-loading' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 animate-spin blur-md opacity-70"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🔮</div>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Veranex Saju Pro</h2>
                        <p className="text-xs text-slate-500">정통 만세력 & 모던 명리 데이터 엔진 준비 중...</p>
                    </div>
                )}

                {/* 2. 입력 폼 (위자드) */}
                {step === 'input' && (
                    <div className="max-w-xl mx-auto animate-fadeIn">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-3 border border-indigo-100">
                                <span>✨</span> Veranex Saju Intelligence
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
                                내 사주 & 오행 밸런스 분석
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                비즈니스 성공운, 2인 궁합, 12시진 마이크로 운세와 주식 투자 성향까지 1초 만에 확인하세요.
                            </p>
                        </div>

                        <form onSubmit={handleAnalyze} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
                            {/* 이름 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">이름 (또는 닉네임)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all"
                                    required
                                />
                            </div>

                            {/* 성별 & 양력/음력 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">성별</label>
                                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setGender('M')}
                                            className={`py-2 text-xs font-bold rounded-xl transition-all ${gender === 'M' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            남성 👦
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender('F')}
                                            className={`py-2 text-xs font-bold rounded-xl transition-all ${gender === 'F' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            여성 👧
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">달력 구분</label>
                                    <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
                                        <button
                                            type="button"
                                            onClick={() => setIsSolar(true)}
                                            className={`py-2 text-xs font-bold rounded-xl transition-all ${isSolar ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            양력 ☀️
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsSolar(false)}
                                            className={`py-2 text-xs font-bold rounded-xl transition-all ${!isSolar ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            음력 🌙
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* 생년월일 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">생년월일</label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all"
                                    required
                                />
                            </div>

                            {/* 태어난 시간 */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">태어난 시간 (12시진)</label>
                                    <button
                                        type="button"
                                        onClick={() => setBirthTime(birthTime === 'unknown' ? '12' : 'unknown')}
                                        className="text-xs text-indigo-600 font-semibold hover:underline"
                                    >
                                        {birthTime === 'unknown' ? '시간 직접 선택' : '시간 모름 (선택)'}
                                    </button>
                                </div>
                                <select
                                    value={birthTime}
                                    onChange={(e) => setBirthTime(e.target.value)}
                                    disabled={birthTime === 'unknown'}
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    <option value="0">자시 (23:30 ~ 01:30)</option>
                                    <option value="2">축시 (01:30 ~ 03:30)</option>
                                    <option value="4">인시 (03:30 ~ 05:30)</option>
                                    <option value="6">묘시 (05:30 ~ 07:30)</option>
                                    <option value="8">진시 (07:30 ~ 09:30)</option>
                                    <option value="10">사시 (09:30 ~ 11:30)</option>
                                    <option value="12">오시 (11:30 ~ 13:30)</option>
                                    <option value="14">미시 (13:30 ~ 15:30)</option>
                                    <option value="16">신시 (15:30 ~ 17:30)</option>
                                    <option value="18">유시 (17:30 ~ 19:30)</option>
                                    <option value="20">술시 (19:30 ~ 21:30)</option>
                                    <option value="22">해시 (21:30 ~ 23:30)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-rose-500 hover:from-indigo-700 hover:to-rose-600 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-xl transition-all transform active:scale-98 flex items-center justify-center gap-2 mt-2"
                            >
                                <span>✨ 내 사주 정밀 분석하기 (1초 완성)</span>
                            </button>
                        </form>
                    </div>
                )}

                {/* 3. 처리 중 애니메이션 */}
                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-5 animate-fadeIn">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center text-3xl">🔮</div>
                        </div>
                        <div>
                            <h3 className="text-xl font-extrabold text-slate-900 mb-1">천문역법 8글자 및 오행 연산 중</h3>
                            <p className="text-xs text-slate-500">24절기 보정치 및 비즈니스/재물/궁합 데이터를 조합하고 있습니다...</p>
                        </div>
                    </div>
                )}

                {/* 4. 사주 대시보드 결과 뷰 */}
                {step === 'result' && result && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* 상단 프로필 헤더 */}
                        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl">{result.basic.zodiacEmoji}</span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-indigo-200 text-xs font-bold border border-white/10">
                                            {result.basic.zodiac}
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
                                            {result.pillars.day.gan}{result.pillars.day.ji} 일주
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-black">
                                        {result.basic.name} 님의 사주 프로필
                                    </h2>
                                    <p className="text-xs sm:text-sm text-indigo-200 mt-1 font-medium">
                                        {result.businessWealth.typeTitle}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                                    <button
                                        onClick={() => setIsShareModalOpen(true)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>📤</span> 결과 공유
                                    </button>
                                    <button
                                        onClick={() => setStep('input')}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <span>🔄</span> 다시 분석
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4대 메인 탭 네비게이션 */}
                        <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                            <button
                                onClick={() => setActiveTab('natal')}
                                className={`py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'natal'
                                        ? 'bg-white text-indigo-600 shadow-md'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>📊</span> <span className="hidden sm:inline">종합</span> 만세력
                            </button>
                            <button
                                onClick={() => setActiveTab('business')}
                                className={`py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'business'
                                        ? 'bg-white text-indigo-600 shadow-md'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>💼</span> 비즈니스/재물
                            </button>
                            <button
                                onClick={() => setActiveTab('love')}
                                className={`py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'love'
                                        ? 'bg-white text-indigo-600 shadow-md'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>❤️</span> 연애/궁합
                            </button>
                            <button
                                onClick={() => setActiveTab('micro')}
                                className={`py-3 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                                    activeTab === 'micro'
                                        ? 'bg-white text-indigo-600 shadow-md'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <span>⚡</span> 마이크로 운세
                            </button>
                        </div>

                        {/* TAB 1: 종합 만세력 */}
                        {activeTab === 'natal' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* 좌측: 8글자 만세력 테이블 */}
                                <div className="lg:col-span-7 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                            <span>📜</span> 정통 사주팔자 (四柱八字)
                                        </h3>
                                        <span className="text-xs text-slate-400 font-medium">연주 · 월주 · 일주 · 시주</span>
                                    </div>

                                    {/* 4주 8글자 그리드 */}
                                    <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                                        {['시주 (時柱)', '일주 (日柱 - 나)', '월주 (月柱)', '연주 (年柱)'].map((label, idx) => (
                                            <div key={idx} className="text-[11px] font-bold text-slate-400">
                                                {label}
                                            </div>
                                        ))}

                                        {/* 천간 (Gan) */}
                                        {[result.pillars.time, result.pillars.day, result.pillars.month, result.pillars.year].map((p, idx) => (
                                            <div key={idx} className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col items-center">
                                                <span className="text-[10px] text-slate-400 mb-1">{p.ganTenGod}</span>
                                                <span
                                                    className="text-2xl sm:text-3xl font-black"
                                                    style={{ color: p.ganColor }}
                                                >
                                                    {p.gan}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 mt-1">
                                                    {ELEMENT_CONFIG[p.ganElem].name}
                                                </span>
                                            </div>
                                        ))}

                                        {/* 지지 (Ji) */}
                                        {[result.pillars.time, result.pillars.day, result.pillars.month, result.pillars.year].map((p, idx) => (
                                            <div key={idx} className="p-3 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col items-center">
                                                <span
                                                    className="text-2xl sm:text-3xl font-black"
                                                    style={{ color: p.jiColor }}
                                                >
                                                    {p.ji}
                                                </span>
                                                <span className="text-[10px] text-slate-400 mt-1">{p.jiTenGod}</span>
                                                <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">{p.jijanggan}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* 오행 범례 */}
                                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs font-bold">
                                        <span className="text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">木 (목: 초록)</span>
                                        <span className="text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">火 (화: 빨강)</span>
                                        <span className="text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg">土 (토: 황색)</span>
                                        <span className="text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">金 (금: 백색)</span>
                                        <span className="text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">水 (수: 청색)</span>
                                    </div>

                                    {/* 10년 대운 흐름 타임라인 */}
                                    <div className="pt-4 border-t border-slate-100 space-y-3">
                                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                            <span>📈</span> 10년 주기 대운(大運) 타임라인
                                        </h4>
                                        <div className="space-y-2.5">
                                            {result.daeunTimeline.map((item, i) => (
                                                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                                                    <div>
                                                        <strong className="text-indigo-600 font-extrabold mr-2">{item.age}</strong>
                                                        <span className="font-bold text-slate-800">{item.title}</span>
                                                        <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <span className="text-sm font-black text-indigo-600">{item.score}점</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 우측: 오행 레이더 차트 & 밸런스 */}
                                <div className="lg:col-span-5 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-5 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                                            <span>🕸️</span> 오행(五行) 밸런스 레이더
                                        </h3>
                                        <p className="text-xs text-slate-500">목·화·토·금·수 5대 에너지 분포도</p>

                                        <SajuRadarChart elements={result.elements} size={250} />

                                        <div className="grid grid-cols-3 gap-2 text-center mt-2">
                                            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                                                <span className="text-[10px] text-emerald-700 font-bold block">가장 강한 기운</span>
                                                <strong className="text-xs text-emerald-900">{result.elementsSummary.dominant}</strong>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                                                <span className="text-[10px] text-rose-700 font-bold block">부족한 기운</span>
                                                <strong className="text-xs text-rose-900">{result.elementsSummary.deficient}</strong>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                                                <span className="text-[10px] text-amber-700 font-bold block">나의 핵심 용신</span>
                                                <strong className="text-xs text-amber-900">{result.elementsSummary.yongshin}</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 leading-relaxed">
                                        💡 <strong>오행 처방전</strong>: {result.basic.name}님은 <strong>{result.elementsSummary.dominant}</strong>이 강하여 추진력과 에너지가 풍부합니다. 부족한 <strong>{result.elementsSummary.deficient}</strong>을 보충하기 위해 평소 {result.microDaily.luckyColorName.split(' ')[0]} 계열의 아이템을 가까이 하시면 밸런스가 완벽해집니다.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: 비즈니스 & 재물운 */}
                        {activeTab === 'business' && (
                            <div className="space-y-6">
                                {/* 상단 기질 게이지 카드 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100">
                                    <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                                        <span>💼</span> 창업/사업가형 vs 전문직/조직관리자형 성향
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-6">내 사주의 식상(추진력)/재성(수익화) vs 관성(조직운)/인성(전문지식) 비율 분석</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                                            <div className="flex justify-between items-center text-xs font-bold text-indigo-900 mb-1.5">
                                                <span>🚀 사업가 & 창업 기질</span>
                                                <span className="text-base font-black text-indigo-600">{result.businessWealth.entrepreneurScore}점</span>
                                            </div>
                                            <div className="w-full bg-indigo-200 h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full"
                                                    style={{ width: `${result.businessWealth.entrepreneurScore}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                                            <div className="flex justify-between items-center text-xs font-bold text-emerald-900 mb-1.5">
                                                <span>👔 전문직 & 조직관리 기질</span>
                                                <span className="text-base font-black text-emerald-600">{result.businessWealth.careerScore}점</span>
                                            </div>
                                            <div className="w-full bg-emerald-200 h-2.5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-emerald-600 rounded-full"
                                                    style={{ width: `${result.businessWealth.careerScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <span className="text-xs font-extrabold text-slate-700 block mb-1">🎯 추천 창업 및 비즈니스 업종</span>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {result.businessWealth.recommendedIndustries.map((ind, i) => (
                                                <span key={i} className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-xl border border-slate-200 shadow-sm">
                                                    #{ind}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Veranex Finance 주식 교차 연계 배너 (킬러 기능 ⭐) */}
                                <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="space-y-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-bold text-emerald-200">
                                                <span>📈</span> Veranex Finance 주식 연계
                                            </div>
                                            <h4 className="text-xl sm:text-2xl font-black">
                                                내 사주({result.businessWealth.financeSector.element}) 맞춤 추천 섹터: {result.businessWealth.financeSector.theme}
                                            </h4>
                                            <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                                                {result.businessWealth.financeSector.reason}
                                            </p>
                                        </div>
                                        <a
                                            href={FINANCE_URL}
                                            className="px-5 py-3.5 bg-white hover:bg-emerald-50 text-slate-900 font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 flex-shrink-0"
                                        >
                                            <span>실시간 주식 시세 보러가기</span>
                                            <span>➔</span>
                                        </a>
                                    </div>
                                </div>

                                {/* 투자 성향 및 계약 길일 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
                                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                                            <span>💰</span> 재물 그릇 & 투자 스타일
                                        </h4>
                                        <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100">
                                            <span className="text-xs font-bold text-amber-900 block">{result.businessWealth.investmentStyle}</span>
                                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{result.businessWealth.investmentDesc}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3">
                                        <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                                            <span>📅</span> 이달의 비즈니스 계약 & 협상 길일
                                        </h4>
                                        <div className="space-y-2">
                                            {result.businessWealth.luckyDealDays.map((deal, i) => (
                                                <div key={i} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                                                    <strong className="text-indigo-600 mr-2">{deal.date}</strong>
                                                    <span className="font-bold text-slate-800">{deal.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: 연애 & 2인 정밀 궁합 */}
                        {activeTab === 'love' && (
                            <div className="space-y-6">
                                {/* 2인 궁합 배너 */}
                                <div className="bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="space-y-2 text-center sm:text-left">
                                        <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wider">
                                            2-Person Chemistry
                                        </span>
                                        <h3 className="text-2xl font-black">연인 · 썸 · 친구와 2인 정밀 사주 궁합 보기</h3>
                                        <p className="text-xs text-pink-100">
                                            오행 상호 보완도(%)와 일간 합충 분석, S/A/B/C/D 궁합 티어표를 확인하세요.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsCoupleModalOpen(true)}
                                        className="px-6 py-4 bg-white text-rose-600 hover:bg-pink-50 font-black text-sm rounded-2xl shadow-lg transition-all transform active:scale-95 flex-shrink-0"
                                    >
                                        ❤️ 2인 궁합 시작하기
                                    </button>
                                </div>

                                {/* 신살 매력도 3종 (도화살, 홍염살, 화개살) */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-5">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                                <span>✨</span> 도화살 · 홍염살 · 화개살 매력 지수
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">내 사주 속 사람을 끌어당기는 핵심 아우라</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-rose-600">{result.loveCharm.charmScore}점</span>
                                            <span className="text-[10px] text-slate-400 block">종합 매력 지수</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* 도화살 */}
                                        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-rose-900">{result.loveCharm.dohwa.title}</span>
                                                <span className="text-xs font-extrabold text-rose-600">{result.loveCharm.dohwa.level}%</span>
                                            </div>
                                            <p className="text-xs text-rose-800 leading-relaxed">{result.loveCharm.dohwa.desc}</p>
                                        </div>

                                        {/* 홍염살 */}
                                        <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-pink-900">{result.loveCharm.hongyeom.title}</span>
                                                <span className="text-xs font-extrabold text-pink-600">{result.loveCharm.hongyeom.level}%</span>
                                            </div>
                                            <p className="text-xs text-pink-800 leading-relaxed">{result.loveCharm.hongyeom.desc}</p>
                                        </div>

                                        {/* 화개살 */}
                                        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-purple-900">{result.loveCharm.hwagae.title}</span>
                                                <span className="text-xs font-extrabold text-purple-600">{result.loveCharm.hwagae.level}%</span>
                                            </div>
                                            <p className="text-xs text-purple-800 leading-relaxed">{result.loveCharm.hwagae.desc}</p>
                                        </div>
                                    </div>

                                    {/* 연애 인연 타이밍 */}
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                                        <span className="font-extrabold text-slate-800 block">💍 인연이 들어오는 골든 타임</span>
                                        <p className="text-slate-600"><strong>강력한 인연 시기:</strong> {result.loveCharm.loveTiming.peakMonths}</p>
                                        <p className="text-slate-600"><strong>어울리는 이성 상:</strong> {result.loveCharm.loveTiming.idealType}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: 초밀착 마이크로 운세 (DAU 킬러 ⭐) */}
                        {activeTab === 'micro' && (
                            <div className="space-y-6">
                                {/* 12시진(24시간) 바이오리듬 그래프 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-100 space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                        <div>
                                            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                                <span>⏰</span> 12시진(24시간) 에너지 바이오리듬
                                            </h3>
                                            <p className="text-xs text-slate-500">중요한 미팅, 집중 작업, 결정을 내리기 가장 좋은 시간대</p>
                                        </div>
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                            오늘의 총운 {result.microDaily.generalScore}점
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 text-center">
                                        {result.microDaily.hourlyEnergy.map((hour, i) => (
                                            <div
                                                key={i}
                                                className={`p-2 rounded-xl border transition-all flex flex-col items-center justify-between ${
                                                    hour.isBest
                                                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                                                        : 'bg-slate-50 text-slate-700 border-slate-100'
                                                }`}
                                            >
                                                <span className="text-[10px] font-bold opacity-80">{hour.timeName.slice(0, 2)}</span>
                                                <strong className="text-xs font-black my-1">{hour.score}점</strong>
                                                <span className="text-[8px] opacity-70 leading-none">{hour.hourLabel.split('~')[0]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 오늘의 행운 아이템 6종 세트 그리드 */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                                    {/* 행운의 컬러 */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-2xl shadow-md flex-shrink-0 flex items-center justify-center text-white font-bold text-xs"
                                            style={{ backgroundColor: result.microDaily.luckyHexColor }}
                                        >
                                            🎨
                                        </div>
                                        <div className="overflow-hidden">
                                            <span className="text-[10px] text-slate-400 font-bold block">행운의 컬러</span>
                                            <strong className="text-xs text-slate-900 truncate block">{result.microDaily.luckyColorName}</strong>
                                            <span className="text-[9px] text-slate-400 font-mono">{result.microDaily.luckyHexColor}</span>
                                        </div>
                                    </div>

                                    {/* 행운의 숫자 */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 shadow-sm flex-shrink-0 flex items-center justify-center text-lg font-black">
                                            🔢
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">행운의 숫자</span>
                                            <strong className="text-sm font-black text-slate-900">{result.microDaily.luckyNumbers.join(', ')}</strong>
                                        </div>
                                    </div>

                                    {/* 행운의 방위 */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 shadow-sm flex-shrink-0 flex items-center justify-center text-lg font-black">
                                            🧭
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">행운의 방위</span>
                                            <strong className="text-xs text-slate-900 block">{result.microDaily.luckyDirection}</strong>
                                        </div>
                                    </div>

                                    {/* 행운의 메뉴 */}
                                    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 shadow-sm flex-shrink-0 flex items-center justify-center text-lg font-black">
                                            🍽️
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">행운의 메뉴</span>
                                            <strong className="text-xs text-slate-900 block">{result.microDaily.luckyMenu}</strong>
                                        </div>
                                    </div>

                                    {/* 오늘의 주의사항 (2칸 차지) */}
                                    <div className="col-span-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 shadow-sm flex-shrink-0 flex items-center justify-center text-lg font-black">
                                            ⚠️
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold block">오늘의 주의사항</span>
                                            <strong className="text-xs text-slate-900">{result.microDaily.dailyWarning}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* 인터랙티브 도구 2종: 점심 룰렛 & 로또 번호 생성기 */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* 점심 룰렛 */}
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3 text-center">
                                        <span className="text-2xl">🍱</span>
                                        <h4 className="text-sm font-extrabold text-slate-900">오늘의 점심 메뉴 룰렛</h4>
                                        <p className="text-xs text-slate-500">부족한 오행 기운을 채워주는 맞춤 음식 추천</p>

                                        <div className="p-3 bg-slate-50 rounded-2xl min-h-[48px] flex items-center justify-center">
                                            {isMenuRolling ? (
                                                <span className="text-xs font-bold text-indigo-600 animate-pulse">맛있는 메뉴 고르는 중... 🍲</span>
                                            ) : pickedMenu ? (
                                                <span className="text-sm font-black text-rose-600">✨ {pickedMenu}</span>
                                            ) : (
                                                <span className="text-xs text-slate-400">버튼을 눌러 추천 메뉴를 뽑아보세요!</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={rollMenu}
                                            disabled={isMenuRolling}
                                            className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-extrabold rounded-xl transition-all"
                                        >
                                            🎲 메뉴 추천 뽑기
                                        </button>
                                    </div>

                                    {/* 오행 로또 6/45 번호 추첨 */}
                                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-3 text-center">
                                        <span className="text-2xl">🎰</span>
                                        <h4 className="text-sm font-extrabold text-slate-900">오행 맞춤 행운의 로또 번호</h4>
                                        <p className="text-xs text-slate-500">사주 천간지지 기운과 공명하는 6자리 번호</p>

                                        <div className="p-2 bg-slate-50 rounded-2xl min-h-[48px] flex items-center justify-center gap-1.5">
                                            {isLottoDrawing ? (
                                                <span className="text-xs font-bold text-amber-600 animate-pulse">행운의 번호 조합 중... 🎱</span>
                                            ) : revealedLotto ? (
                                                revealedLotto.map((num, i) => (
                                                    <span
                                                        key={i}
                                                        className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 text-white font-black text-xs flex items-center justify-center shadow-sm"
                                                    >
                                                        {num}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400">행운의 로또 번호 6개를 추첨하세요</span>
                                            )}
                                        </div>

                                        <button
                                            onClick={drawLotto}
                                            disabled={isLottoDrawing}
                                            className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-extrabold rounded-xl transition-all"
                                        >
                                            🎱 행운의 6자리 추첨하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 모달 팝업들 */}
                {result && (
                    <>
                        <CoupleMatchModal
                            userSaju={result}
                            isOpen={isCoupleModalOpen}
                            onClose={() => setIsCoupleModalOpen(false)}
                        />
                        <SajuShareModal
                            saju={result}
                            isOpen={isShareModalOpen}
                            onClose={() => setIsShareModalOpen(false)}
                        />
                    </>
                )}
            </div>
        </MiniAppLayout>
    );
}
