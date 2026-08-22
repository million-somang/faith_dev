import { useState, useEffect } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { calculateSaju, ELEMENT_CONFIG } from './utils/sajuCalculator';
import type { SajuResult } from './utils/sajuCalculator';
import SajuRadarChart from './components/SajuRadarChart';
import CoupleMatchModal from './components/CoupleMatchModal';
import SajuShareModal from './components/SajuShareModal';

type Step = 'init-loading' | 'input' | 'processing' | 'result';
type TabKey = 'natal' | 'business' | 'love' | 'micro';

const FINANCE_URL = import.meta.env.DEV ? 'http://localhost:5010' : '/finance';

export default function App() {
    const { user } = useAuth();
    const [step, setStep] = useState<Step>('init-loading');

    // 1. 입력 폼 상태 (로컬 스토리지 및 기본값으로 초기화)
    const [name, setName] = useState(() => {
        return localStorage.getItem('faith_saju_name') || localStorage.getItem('user_name') || '';
    });
    const [gender, setGender] = useState<'M' | 'F'>(() => {
        const saved = localStorage.getItem('faith_saju_gender');
        return saved === 'F' ? 'F' : 'M';
    });
    const [birthDate, setBirthDate] = useState(() => {
        return localStorage.getItem('faith_saju_birth_date') || localStorage.getItem('user_birth_date') || '1995-08-21';
    });
    const [birthTime, setBirthTime] = useState(() => {
        return localStorage.getItem('faith_saju_birth_time') || '12'; // 기본 오시(午時) 또는 기입값
    });
    const [isSolar, setIsSolar] = useState(() => {
        const saved = localStorage.getItem('faith_saju_is_solar');
        return saved === 'false' ? false : true;
    });

    // 2. 결과 및 UI 상태
    const [result, setResult] = useState<SajuResult | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('natal');
    const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // 3. 인터랙티브 기능 상태 (점심 메뉴, 로또)
    const [pickedMenu, setPickedMenu] = useState<string | null>(null);
    const [isMenuRolling, setIsMenuRolling] = useState(false);
    const [revealedLotto, setRevealedLotto] = useState<number[] | null>(null);
    const [isLottoDrawing, setIsLottoDrawing] = useState(false);

    // 회원 정보(user)가 로드되었을 때, 가입 시 등록했던 생년월일, 태어난시, 이름, 성별을 폼에 자동 입력
    useEffect(() => {
        if (user) {
            if (user.name && !name) {
                setName(user.name);
                localStorage.setItem('faith_saju_name', user.name);
            }
            if (user.birth_date && birthDate === '1995-08-21') {
                setBirthDate(user.birth_date);
                localStorage.setItem('faith_saju_birth_date', user.birth_date);
                localStorage.setItem('user_birth_date', user.birth_date);
            }
            if (user.birth_time && user.birth_time !== 'unknown') {
                setBirthTime(user.birth_time);
                localStorage.setItem('faith_saju_birth_time', user.birth_time);
            }
            if (user.gender) {
                const g = user.gender === 'F' ? 'F' : 'M';
                setGender(g);
                localStorage.setItem('faith_saju_gender', g);
            }
            if (user.is_solar !== undefined && user.is_solar !== null) {
                const s = Boolean(user.is_solar);
                setIsSolar(s);
                localStorage.setItem('faith_saju_is_solar', String(s));
            }
        }
    }, [user]);

    // 최초 진입 연출
    useEffect(() => {
        if (step === 'init-loading') {
            const timer = setTimeout(() => {
                setStep('input');
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // 생년월일/태어난시/성별/이름 영구 보관 헬퍼 함수
    const persistSajuProfile = async (targetName: string, targetBirthDate: string, targetBirthTime: string, targetGender: string, targetIsSolar: boolean) => {
        // 1. 브라우저 로컬 스토리지에 즉시 저장
        try {
            localStorage.setItem('faith_saju_name', targetName);
            localStorage.setItem('faith_saju_birth_date', targetBirthDate);
            localStorage.setItem('user_birth_date', targetBirthDate);
            localStorage.setItem('faith_saju_birth_time', targetBirthTime);
            localStorage.setItem('faith_saju_gender', targetGender);
            localStorage.setItem('faith_saju_is_solar', String(targetIsSolar));
        } catch (e) {
            console.warn('LocalStorage save failed:', e);
        }

        // 2. 로그인된 상태라면 서버 DB에도 자동 영구 저장
        if (user) {
            try {
                await axios.post('/api/user/saju-profile', {
                    name: targetName,
                    birthDate: targetBirthDate,
                    birthTime: targetBirthTime,
                    gender: targetGender,
                    isSolar: targetIsSolar
                }, { withCredentials: true });
            } catch (err) {
                // 비로그인 또는 네트워크 오류 시 조용히 스킵
            }
        }
    };

    // 태어난 시간 변경 시 즉시 자동 저장
    const handleBirthTimeChange = (newTime: string) => {
        setBirthTime(newTime);
        localStorage.setItem('faith_saju_birth_time', newTime);
        if (user) {
            persistSajuProfile(name || user.name || '이용자', birthDate, newTime, gender, isSolar);
        }
    };

    // 사주 연산 실행
    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        const targetName = name.trim() || (user && user.name) || '이용자';

        // 분석 실행 시 입력된 모든 프로필 정보를 자동 저장 (다음번 재방문 시 자동 반영)
        persistSajuProfile(targetName, birthDate, birthTime, gender, isSolar);

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
                const fallback = calculateSaju('이용자', 'M', '1995-08-21', '12', true);
                setResult(fallback);
                setStep('result');
            }
        }, 500);
    };

    // 메뉴 룰렛
    const rollMenu = () => {
        if (!result) return;
        setIsMenuRolling(true);
        const menuPool = [
            result.microDaily.luckyMenu,
            '맑은 나물 비빔밥 & 된장국',
            '담백한 소고기 전골 & 솥밥',
            '신선한 생선구이 정식',
            '버섯 들깨 칼국수',
            '정갈한 안심 돈카츠',
            '따뜻한 삼계탕'
        ];
        setTimeout(() => {
            const random = menuPool[Math.floor(Math.random() * menuPool.length)];
            setPickedMenu(random);
            setIsMenuRolling(false);
        }, 600);
    };

    // 로또 번호 추출
    const drawLotto = () => {
        if (!result) return;
        setIsLottoDrawing(true);
        setTimeout(() => {
            setRevealedLotto(result.microDaily.lottoNumbers);
            setIsLottoDrawing(false);
        }, 700);
    };

    return (
        <MiniAppLayout>
            <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 pb-20 text-slate-800 font-sans antialiased bg-[#FAF9F6] min-h-screen">
                
                {/* 1. 단아한 화이트 인트로 로딩 */}
                {step === 'init-loading' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-3 border-stone-200 border-t-indigo-600 animate-spin"></div>
                        <h2 className="text-xl font-serif font-bold text-slate-900">베라 정통 만세력</h2>
                        <p className="text-xs text-slate-500 font-normal">회원 사주 데이터와 천문역법을 불러오고 있습니다...</p>
                    </div>
                )}

                {/* 2. 사주 입력 폼 (정갈하고 화사한 화이트 에디토리얼 스타일) */}
                {step === 'input' && (
                    <div className="max-w-lg mx-auto">
                        <div className="text-center mb-8 space-y-2">
                            <span className="inline-block px-3.5 py-1 bg-white text-indigo-700 rounded-full text-xs font-bold tracking-wide border border-indigo-100 shadow-2xs">
                                四柱八字 · 萬歲曆
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
                                생년월일시 사주 분석
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                {user ? `${user.name || '회원'}님의 회원정보가 자동으로 적용되었습니다.` : '태어난 날의 천간과 지지를 짚어 오행의 균형과 기질을 풀이합니다.'}
                            </p>
                        </div>

                        <form onSubmit={handleAnalyze} className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
                            
                            {/* 안내 뱃지 */}
                            <div className="bg-indigo-50/60 border border-indigo-100 p-3 rounded-2xl flex items-center justify-between text-xs text-indigo-900 font-medium">
                                <span className="flex items-center gap-1.5">
                                    <i className="fas fa-magic text-indigo-600"></i> 정보 자동 저장 연동 중
                                </span>
                                <span className="text-[11px] text-indigo-500">한번 입력 시 다음 방문 시 자동 유지</span>
                            </div>

                            {/* 이름 */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">이름 (또는 닉네임)</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="이름을 입력해 주세요"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm transition-all"
                                    required
                                />
                            </div>

                            {/* 성별 & 양력/음력 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">성별</label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setGender('M')}
                                            className={`py-2 text-xs font-bold rounded-lg transition-all ${gender === 'M' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            남성
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setGender('F')}
                                            className={`py-2 text-xs font-bold rounded-lg transition-all ${gender === 'F' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            여성
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">달력 구분</label>
                                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setIsSolar(true)}
                                            className={`py-2 text-xs font-bold rounded-lg transition-all ${isSolar ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            양력
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsSolar(false)}
                                            className={`py-2 text-xs font-bold rounded-lg transition-all ${!isSolar ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            음력
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
                                    onChange={(e) => {
                                        setBirthDate(e.target.value);
                                        localStorage.setItem('faith_saju_birth_date', e.target.value);
                                        localStorage.setItem('user_birth_date', e.target.value);
                                    }}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm transition-all"
                                    required
                                />
                            </div>

                            {/* 태어난 시간 (선택 및 자동 저장) */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-xs font-bold text-slate-700">태어난 시간 (12시진)</label>
                                    <button
                                        type="button"
                                        onClick={() => handleBirthTimeChange(birthTime === 'unknown' ? '12' : 'unknown')}
                                        className="text-xs text-indigo-600 hover:underline font-semibold"
                                    >
                                        {birthTime === 'unknown' ? '시간 직접 선택' : '시간 모름 (기본)'}
                                    </button>
                                </div>
                                <select
                                    value={birthTime}
                                    onChange={(e) => handleBirthTimeChange(e.target.value)}
                                    disabled={birthTime === 'unknown'}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 font-medium text-sm transition-all disabled:bg-slate-100 disabled:text-slate-400"
                                >
                                    <option value="0">자시 (子時 · 23:30 ~ 01:30)</option>
                                    <option value="2">축시 (丑時 · 01:30 ~ 03:30)</option>
                                    <option value="4">인시 (寅時 · 03:30 ~ 05:30)</option>
                                    <option value="6">묘시 (卯時 · 05:30 ~ 07:30)</option>
                                    <option value="8">진시 (辰時 · 07:30 ~ 09:30)</option>
                                    <option value="10">사시 (巳時 · 09:30 ~ 11:30)</option>
                                    <option value="12">오시 (午時 · 11:30 ~ 13:30)</option>
                                    <option value="14">미시 (未時 · 13:30 ~ 15:30)</option>
                                    <option value="16">신시 (申時 · 15:30 ~ 17:30)</option>
                                    <option value="18">유시 (酉時 · 17:30 ~ 19:30)</option>
                                    <option value="20">술시 (戌時 · 19:30 ~ 21:30)</option>
                                    <option value="22">해시 (亥時 · 21:30 ~ 23:30)</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md transition-all active:scale-[0.99] mt-2 cursor-pointer"
                            >
                                사주 및 오행 분석하기
                            </button>
                        </form>
                    </div>
                )}

                {/* 3. 처리 중 애니메이션 (화이트 테마) */}
                {step === 'processing' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                        <div className="w-12 h-12 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin"></div>
                        <div>
                            <h3 className="text-lg font-serif font-bold text-slate-900 mb-1">천간지지 및 오행 조화 분석 중</h3>
                            <p className="text-xs text-slate-500">사주 8글자의 원국과 대운 흐름을 차분히 짚어내고 있습니다.</p>
                        </div>
                    </div>
                )}

                {/* 4. 사주 대시보드 결과 뷰 (화이트 & 모던 에디토리얼 테마) */}
                {step === 'result' && result && (
                    <div className="space-y-6">
                        {/* 상단 프로필 헤더 카드 (고급스러운 화이트 카드 테마) */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
                                            {result.basic.zodiac}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                                            {result.pillars.day.gan}{result.pillars.day.ji} 일주 (나 자신)
                                        </span>
                                    </div>
                                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                                        {result.basic.name} 님의 사주 원국표
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                                        {result.businessWealth.typeTitle}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 self-stretch sm:self-auto">
                                    <button
                                        onClick={() => setIsShareModalOpen(true)}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                                    >
                                        <i className="fas fa-share-nodes mr-1.5"></i> 결과 공유
                                    </button>
                                    <button
                                        onClick={() => setStep('input')}
                                        className="flex-1 sm:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm"
                                    >
                                        <i className="fas fa-redo-alt mr-1.5"></i> 다시 입력
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* 4대 탭 바 (화이트 모던 세그먼트) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                            <button
                                onClick={() => setActiveTab('natal')}
                                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    activeTab === 'natal'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                종합 만세력
                            </button>
                            <button
                                onClick={() => setActiveTab('business')}
                                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    activeTab === 'business'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                진로 · 재물운
                            </button>
                            <button
                                onClick={() => setActiveTab('love')}
                                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    activeTab === 'love'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                인연 · 2인 궁합
                            </button>
                            <button
                                onClick={() => setActiveTab('micro')}
                                className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                                    activeTab === 'micro'
                                        ? 'bg-white text-indigo-700 shadow-sm'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                오늘의 12시진
                            </button>
                        </div>

                        {/* ================= 탭 1: 종합 만세력 ================= */}
                        {activeTab === 'natal' && (
                            <div className="space-y-6">
                                {/* 사주 8글자 표 (화이트 격자 카드) */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                        <h3 className="text-base font-serif font-bold text-slate-900">
                                            사주팔자 원국 (四柱八字)
                                        </h3>
                                        <span className="text-xs text-slate-500 font-normal">
                                            생시(時) ← 생일(日) ← 생월(月) ← 생년(年)
                                        </span>
                                    </div>

                                    {/* 4주 8자 격자 */}
                                    <div className="grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
                                        {/* 시주 */}
                                        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-between min-h-[220px]">
                                            <span className="text-xs font-bold text-slate-500">시주 (時柱)</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{result.pillars.time.ganTenGod}</span>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1" style={{ backgroundColor: result.pillars.time.ganColor }}>
                                                {result.pillars.time.gan}
                                            </div>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1" style={{ backgroundColor: result.pillars.time.jiColor }}>
                                                {result.pillars.time.ji}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">{result.pillars.time.jiTenGod}</span>
                                            <span className="text-[10px] text-slate-400 truncate max-w-full">{result.pillars.time.jijanggan}</span>
                                        </div>

                                        {/* 일주 (주인공) */}
                                        <div className="p-3 sm:p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300 flex flex-col items-center justify-between min-h-[220px] relative shadow-2xs">
                                            <span className="text-xs font-bold text-amber-900">일주 (日柱 ⭐)</span>
                                            <span className="text-[11px] font-bold text-amber-800">{result.pillars.day.ganTenGod}</span>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1 ring-2 ring-white" style={{ backgroundColor: result.pillars.day.ganColor }}>
                                                {result.pillars.day.gan}
                                            </div>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1 ring-2 ring-white" style={{ backgroundColor: result.pillars.day.jiColor }}>
                                                {result.pillars.day.ji}
                                            </div>
                                            <span className="text-[11px] font-bold text-amber-800">{result.pillars.day.jiTenGod}</span>
                                            <span className="text-[10px] text-amber-700 truncate max-w-full font-medium">{result.pillars.day.jijanggan}</span>
                                        </div>

                                        {/* 월주 */}
                                        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-between min-h-[220px]">
                                            <span className="text-xs font-bold text-slate-500">월주 (月柱)</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{result.pillars.month.ganTenGod}</span>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1" style={{ backgroundColor: result.pillars.month.ganColor }}>
                                                {result.pillars.month.gan}
                                            </div>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1" style={{ backgroundColor: result.pillars.month.jiColor }}>
                                                {result.pillars.month.ji}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">{result.pillars.month.jiTenGod}</span>
                                            <span className="text-[10px] text-slate-400 truncate max-w-full">{result.pillars.month.jijanggan}</span>
                                        </div>

                                        {/* 년주 */}
                                        <div className="p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-between min-h-[220px]">
                                            <span className="text-xs font-bold text-slate-500">년주 (年柱)</span>
                                            <span className="text-[11px] text-slate-400 font-medium">{result.pillars.year.ganTenGod}</span>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1" style={{ backgroundColor: result.pillars.year.ganColor }}>
                                                {result.pillars.year.gan}
                                            </div>
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-serif font-bold text-white shadow-sm my-1" style={{ backgroundColor: result.pillars.year.jiColor }}>
                                                {result.pillars.year.ji}
                                            </div>
                                            <span className="text-[11px] text-slate-400 font-medium">{result.pillars.year.jiTenGod}</span>
                                            <span className="text-[10px] text-slate-400 truncate max-w-full">{result.pillars.year.jijanggan}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 오행 밸런스 레이더 차트 & 분포율 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col items-center justify-center">
                                        <h3 className="text-base font-serif font-bold text-slate-900 mb-2 self-start">
                                            오행 균형 레이더 (五行)
                                        </h3>
                                        <SajuRadarChart elements={result.elements} />
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                                        <div>
                                            <h3 className="text-base font-serif font-bold text-slate-900 mb-3">
                                                오행 분포 및 용신(用神) 진단
                                            </h3>
                                            <div className="space-y-2.5 text-xs">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-slate-600">가장 강한 기운 (주도)</span>
                                                    <strong className="text-slate-900 font-bold">{result.elementsSummary.dominant}</strong>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                                    <span className="text-slate-600">부족한 기운 (보완 필요)</span>
                                                    <strong className="text-slate-900 font-bold">{result.elementsSummary.deficient}</strong>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                    <span className="text-amber-900 font-bold">나를 돕는 귀한 기운 (용신)</span>
                                                    <strong className="text-amber-900 font-bold">{result.elementsSummary.yongshin}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                                            부족한 기운인 <strong>{result.elementsSummary.deficient}</strong>을 채우기 위해 해당 오행의 색상이나 활동을 가까이하시면 삶의 균형을 맞추는 데 큰 도움이 됩니다.
                                        </p>
                                    </div>
                                </div>

                                {/* 10년 대운 타임라인 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                                    <h3 className="text-base font-serif font-bold text-slate-900">
                                        인생의 10년 대운(大運) 흐름
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {result.daeunTimeline.map((item, idx) => (
                                            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-700">{item.age}</span>
                                                    <span className="text-xs font-bold text-indigo-700">{item.score}점</span>
                                                </div>
                                                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                                                <p className="text-[11px] text-slate-500 leading-relaxed font-normal">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= 탭 2: 진로 · 재물운 ================= */}
                        {activeTab === 'business' && (
                            <div className="space-y-6">
                                {/* 사업가형 vs 전문직형 게이지 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                                    <h3 className="text-base font-serif font-bold text-slate-900">
                                        직업 기질 및 비즈니스 적합도
                                    </h3>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1.5">
                                                <span className="text-slate-700">사업가 · 창업가형 (식상생재)</span>
                                                <span className="text-slate-900 font-mono">{result.businessWealth.entrepreneurScore}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                                                    style={{ width: `${result.businessWealth.entrepreneurScore}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-xs font-bold mb-1.5">
                                                <span className="text-slate-700">전문직 · 조직 관리자형 (관인상생)</span>
                                                <span className="text-slate-900 font-mono">{result.businessWealth.careerScore}%</span>
                                            </div>
                                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                                    style={{ width: `${result.businessWealth.careerScore}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                                        <h4 className="text-xs font-bold text-slate-900">추천 직무 및 산업 분야</h4>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {result.businessWealth.recommendedIndustries.map((ind, i) => (
                                                <span key={i} className="px-3 py-1 bg-white text-slate-800 rounded-lg text-xs font-medium border border-slate-200 shadow-2xs">
                                                    {ind}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* 투자 성향 및 금융 섹터 연동 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                                        <h3 className="text-base font-serif font-bold text-slate-900">
                                            투자 성향 및 자산 관리 조언
                                        </h3>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                                            <strong className="text-xs font-bold text-slate-900 block">{result.businessWealth.investmentStyle}</strong>
                                            <p className="text-xs text-slate-600 leading-relaxed">{result.businessWealth.investmentDesc}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-base font-serif font-bold text-slate-900">
                                                    오행 맞춤 주식 테마
                                                </h3>
                                                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                                                    {result.businessWealth.financeSector.element}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-slate-800 mb-1">
                                                {result.businessWealth.financeSector.theme}
                                            </p>
                                            <p className="text-xs text-slate-500 leading-relaxed">
                                                {result.businessWealth.financeSector.reason}
                                            </p>
                                        </div>

                                        <a
                                            href={FINANCE_URL}
                                            target="_top"
                                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl text-center transition-colors shadow-sm cursor-pointer"
                                        >
                                            베라 금융 주식 시세 확인하기 →
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= 탭 3: 인연 · 2인 궁합 ================= */}
                        {activeTab === 'love' && (
                            <div className="space-y-6">
                                {/* 종합 매력 지수 & 3대 신살 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                        <div>
                                            <h3 className="text-base font-serif font-bold text-slate-900">
                                                나의 매력 신살(神煞) 지수
                                            </h3>
                                            <p className="text-xs text-slate-500">사주 속 타고난 이성 매력과 친화력 아우라</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-500 font-medium">종합 매력 점수:</span>
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full font-mono font-bold text-xs border border-indigo-100">
                                                {result.loveCharm?.charmScore || 85}점
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-rose-800">도화살 (桃花)</span>
                                                <span className="text-xs font-bold text-slate-900 font-mono">{result.loveCharm?.dohwa?.level || 75}점</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {result.loveCharm?.dohwa?.desc || '사람의 이목을 끄는 대중적 매력과 친화력입니다.'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-amber-800">홍염살 (紅艶)</span>
                                                <span className="text-xs font-bold text-slate-900 font-mono">{result.loveCharm?.hongyeom?.level || 70}점</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {result.loveCharm?.hongyeom?.desc || '은근하게 상대를 사로잡는 깊은 유대감과 매혹입니다.'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-bold text-indigo-800">화개살 (華蓋)</span>
                                                <span className="text-xs font-bold text-slate-900 font-mono">{result.loveCharm?.hwagae?.level || 80}점</span>
                                            </div>
                                            <p className="text-[11px] text-slate-600 leading-relaxed">
                                                {result.loveCharm?.hwagae?.desc || '예술적 감수성과 지적인 아우라를 나타냅니다.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* 애정운 최적 타이밍 & 조언 */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">최고의 인연 흐름 시기</h4>
                                        <p className="text-sm font-serif font-bold text-slate-900">
                                            {result.loveCharm?.loveTiming?.peakMonths || '올해 하반기 & 내년 봄'}
                                        </p>
                                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                                            <strong>나와 잘 맞는 파트너 유형:</strong>
                                            <p className="mt-1 text-slate-800 font-medium">{result.loveCharm?.loveTiming?.idealType || '안정적인 미래 비전을 공유할 수 있는 파트너'}</p>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">인연을 위한 명리 조언</h4>
                                        <p className="text-xs text-slate-700 leading-relaxed bg-amber-50/60 p-4 rounded-xl border border-amber-100 font-medium">
                                            💡 {result.loveCharm?.loveTiming?.advice || '상대방의 사소한 단점에 집중하기보다 큰 가치관과 인생의 방향성에 초점을 맞추세요.'}
                                        </p>
                                    </div>
                                </div>

                                {/* 2인 정밀 궁합 모달 열기 카드 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-serif font-bold text-slate-900">
                                            상대방과의 2인 정밀 궁합 확인
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            연인, 친구, 동업자의 생년월일을 입력하여 오행 상호 보완도(%)와 궁합 티어를 확인하세요.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsCoupleModalOpen(true)}
                                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                                    >
                                        2인 궁합 분석 창 열기
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ================= 탭 4: 오늘의 12시진 ================= */}
                        {activeTab === 'micro' && (
                            <div className="space-y-6">
                                {/* 오늘의 한 줄 조언 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-2">
                                    <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">오늘의 명리 조언</span>
                                    <p className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-relaxed">
                                        "{result.microDaily.quote}"
                                    </p>
                                    <span className="text-xs text-slate-500 block pt-1">
                                        오늘의 에너지 지수: <strong className="text-indigo-700 font-mono font-bold">{result.microDaily.generalScore}점</strong>
                                    </span>
                                </div>

                                {/* 12시진 바이오리듬 표 */}
                                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-base font-serif font-bold text-slate-900">
                                            12시진(24시간) 에너지 흐름
                                        </h3>
                                        <span className="text-xs text-slate-500">집중 시간대를 확인하세요</span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                        {result.microDaily.hourlyEnergy.map((hour, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                                                    hour.isBest
                                                        ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-200 shadow-2xs'
                                                        : 'bg-slate-50 border-slate-200/60'
                                                }`}
                                            >
                                                <span className={`text-xs font-bold block ${hour.isBest ? 'text-amber-900' : 'text-slate-700'}`}>
                                                    {hour.timeName}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block">{hour.hourLabel}</span>
                                                <span className={`text-xs font-bold block pt-1 font-mono ${hour.isBest ? 'text-amber-800' : 'text-slate-600'}`}>
                                                    {hour.score}점 {hour.isBest && '★'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 행운 아이템 4종 */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
                                        <span className="text-xs text-slate-500 block">행운의 색상</span>
                                        <span className="text-xs font-bold text-slate-900 block">{result.microDaily.luckyColorName}</span>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
                                        <span className="text-xs text-slate-500 block">행운의 숫자</span>
                                        <span className="text-xs font-bold text-slate-900 font-mono block">{result.microDaily.luckyNumbers.join(', ')}</span>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
                                        <span className="text-xs text-slate-500 block">행운의 방위</span>
                                        <span className="text-xs font-bold text-slate-900 block">{result.microDaily.luckyDirection}</span>
                                    </div>
                                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-1 text-center">
                                        <span className="text-xs text-slate-500 block">오늘의 주의사항</span>
                                        <span className="text-xs font-bold text-rose-600 block truncate">{result.microDaily.dailyWarning}</span>
                                    </div>
                                </div>

                                {/* 인터랙티브 도구: 점심 메뉴 룰렛 & 로또 번호 */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3 text-center">
                                        <h4 className="text-sm font-bold text-slate-900">오늘의 추천 메뉴 뽑기</h4>
                                        <div className="h-12 flex items-center justify-center bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200/60">
                                            {isMenuRolling ? '메뉴 고르는 중...' : (pickedMenu || result.microDaily.luckyMenu)}
                                        </div>
                                        <button
                                            onClick={rollMenu}
                                            disabled={isMenuRolling}
                                            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                        >
                                            새로운 메뉴 추천받기
                                        </button>
                                    </div>

                                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3 text-center">
                                        <h4 className="text-sm font-bold text-slate-900">오행 공명 번호 6자리</h4>
                                        <div className="h-12 flex items-center justify-center gap-1.5 bg-slate-50 rounded-xl font-bold text-sm text-slate-800 border border-slate-200/60">
                                            {isLottoDrawing ? (
                                                <span className="text-xs text-slate-400">번호 추첨 중...</span>
                                            ) : revealedLotto ? (
                                                revealedLotto.map((num, i) => (
                                                    <span key={i} className="w-7 h-7 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold font-mono shadow-2xs">
                                                        {num}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400">버튼을 눌러 확인하세요</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={drawLotto}
                                            disabled={isLottoDrawing}
                                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                                        >
                                            오행 번호 추출하기
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 2인 궁합 모달 */}
                {result && (
                    <CoupleMatchModal
                        isOpen={isCoupleModalOpen}
                        onClose={() => setIsCoupleModalOpen(false)}
                        person1={result}
                    />
                )}

                {/* 결과 공유 모달 */}
                {result && (
                    <SajuShareModal
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        result={result}
                    />
                )}
            </div>
        </MiniAppLayout>
    );
}
