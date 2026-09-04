import { useState, useMemo, useEffect, useRef } from 'react';
import { MiniAppLayout, MiniAppCommunity } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@faithportal/mini-app-sdk/src/components/MiniAppCommunity.css';
import { 
    Cake, CalendarDays, CheckCircle2, XCircle, Star, Bell, Gift, 
    HelpCircle, MessageSquare, ArrowLeft, Copy, Check, Sparkles, RefreshCw
} from 'lucide-react';

// 1. 물리 키보드 릴레이용 전역 타입 선언
declare global {
    interface Document {
        parentKeyboardCallback?: ((key: string) => void) | null;
    }
}

// 2. SEO 메타데이터 동적 주입 컴포넌트 (AEO 최적화)
function PageSEO({ title, description, path }: { title: string; description: string; path: string }) {
    useEffect(() => {
        document.title = title;

        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', description);

        let linkCanonical = document.querySelector('link[rel="canonical"]');
        if (!linkCanonical) {
            linkCanonical = document.createElement('link');
            linkCanonical.setAttribute('rel', 'canonical');
            document.head.appendChild(linkCanonical);
        }
        linkCanonical.setAttribute('href', `https://faithlink.site${path}`);
    }, [title, description, path]);

    return null;
}

// ── 띠 데이터 ──
const ZODIACS = [
    { name: '쥐띠', emoji: '🐭', desc: '애정적이고 리더십이 강함' },
    { name: '소띠', emoji: '🐮', desc: '성실하고 인내심이 강함' },
    { name: '호랑이띠', emoji: '🐯', desc: '활동적이고 자유로운' },
    { name: '토끼띠', emoji: '🐰', desc: '온순하고 예술적 감각이 뛰어남' },
    { name: '용띠', emoji: '🐲', desc: '재치있고 통찰력 있음' },
    { name: '뱀띠', emoji: '🐍', desc: '지혜롭고 유능해요' },
    { name: '말띠', emoji: '🐴', desc: '충성스럽고 정의로운' },
    { name: '양띠', emoji: '🐑', desc: '관대하고 온순함' },
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
    { name: '투표권', manReq: 18, yeonReq: null, maxAge: null, icon: '🗳️', desc: '국회의원, 대통령 선거 참여' },
    { name: '운전면허 취득', manReq: 18, yeonReq: null, maxAge: null, icon: '🚗', desc: '1, 2종 보통면허 취득 가능' },
    { name: '단독 아르바이트', manReq: 15, yeonReq: null, maxAge: null, icon: '💼', desc: '취업 인허가증 제출 필수' },
    { name: '주류/담배 구매', manReq: null, yeonReq: 19, maxAge: null, icon: '🍺', desc: '1월 1일 기준 연 19세 도래 시' },
    { name: '영화 관람(청불)', manReq: 18, yeonReq: null, maxAge: null, icon: '🎬', desc: '청소년 관람불가 영화 관람' },
    { name: '워킹홀리데이 신청', manReq: 18, yeonReq: null, maxAge: 30, icon: '✈️', desc: '해외 고용 협정 연령' },
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

interface AgeResult {
    manAge: number;
    yeonAge: number;
    koreanAge: number;
    daysUntilBirthday: number;
    isBirthdayToday: boolean;
}

type TabType = 'calculator' | 'calendar' | 'howto' | 'community';
type ViewMode = 'input' | 'result';

function App() {
    // 3초 초기 로딩 화면 (가이드라인 필수 준수)
    const [isLoadingScreen, setIsLoadingScreen] = useState(true);

    // 4탭 내비게이션 상태
    const [activeTab, setActiveTab] = useState<TabType>('calculator');

    // 입력란/결과란 화면 분리 상태
    const [viewMode, setViewMode] = useState<ViewMode>('input');

    // 입력 필드 포커스 제어용 ref
    const yearInputRef = useRef<HTMLInputElement>(null);

    const [birthYear, setBirthYear] = useState('');
    const [birthMonth, setBirthMonth] = useState('');
    const [birthDay, setBirthDay] = useState('');
    const [referenceDate, setReferenceDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });

    const [isCopied, setIsCopied] = useState(false);

    // 3초 강제 로딩 스크린 타이머
    useEffect(() => {
        const timer = setTimeout(() => setIsLoadingScreen(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    // 팝업 기동 즉시 포커스 실행 및 부모 창 알림
    useEffect(() => {
        if (isLoadingScreen) return;

        const focusInput = (e?: Event) => {
            if (e && e.target) {
                const target = e.target as HTMLElement;
                if (
                    target.tagName === 'SELECT' ||
                    target.tagName === 'INPUT' ||
                    target.tagName === 'TEXTAREA' ||
                    target.tagName === 'OPTION' ||
                    target.closest('.calc-nav-container') ||
                    target.closest('.mini-app-community') ||
                    target.closest('button')
                ) {
                    return;
                }
            }

            window.focus();
            const activeEl = document.activeElement;
            const isInputField = activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'SELECT' ||
                activeEl.tagName === 'TEXTAREA'
            );
            if (!isInputField && viewMode === 'input' && yearInputRef.current) {
                yearInputRef.current.focus();
            }
            window.parent.postMessage({ type: 'MINI_APP_READY' }, '*');
        };
        const timer = setTimeout(() => focusInput(), 150);
        window.addEventListener('click', focusInput);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('click', focusInput);
        };
    }, [isLoadingScreen, activeTab, viewMode]);

    // 물리 키보드 릴레이 핸들링
    useEffect(() => {
        if (isLoadingScreen) return;

        const handleGlobalMessage = (e: MessageEvent) => {
            if (e.data && e.data.type === 'PARENT_KEYBOARD_EVENT') {
                const key = e.data.key;
                if (typeof document.parentKeyboardCallback === 'function') {
                    document.parentKeyboardCallback(key);
                }
            }
        };

        const myCallback = (key: string) => {
            if (viewMode === 'input') {
                if (/^[0-9]$/.test(key)) {
                    setBirthYear(prev => {
                        if (prev.length < 4) return prev + key;
                        return prev;
                    });
                } else if (key === 'Backspace') {
                    setBirthYear(prev => prev.slice(0, -1));
                } else if (key === 'Enter') {
                    handleCalculate();
                }
            }
        };

        document.parentKeyboardCallback = myCallback;
        window.addEventListener('message', handleGlobalMessage);

        return () => {
            if (document.parentKeyboardCallback === myCallback) {
                document.parentKeyboardCallback = null;
            }
            window.removeEventListener('message', handleGlobalMessage);
        };
    }, [isLoadingScreen, viewMode, birthYear, birthMonth, birthDay, referenceDate]);

    // 나이 계산 로직
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
        // 한국 세는 나이
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

    // 띠 계산
    const zodiac = useMemo(() => {
        const year = parseInt(birthYear);
        if (!year) return null;
        return ZODIACS[(year - 4) % 12];
    }, [birthYear]);

    // 별자리 계산
    const starSign = useMemo(() => {
        const month = parseInt(birthMonth);
        const day = parseInt(birthDay);
        if (!month || !day) return null;
        return getStarSign(month, day);
    }, [birthMonth, birthDay]);

    // 생애 주기 알림 리스트
    const lifecycleAlerts = useMemo(() => {
        if (!ageResult) return [];
        const { manAge } = ageResult;
        const alerts: { icon: string; title: string; desc: string }[] = [];

        if (manAge === 18 || manAge === 19) {
            alerts.push({ icon: '🎓', title: '성년의 시작', desc: '법적 성인 등극! 투표 참여권, 독자적 신용거래 및 운전면허 획득' });
        }
        if (manAge >= 18 && manAge < 30) {
            alerts.push({ icon: '✈️', title: '청년 워킹홀리데이', desc: '해외 협정국 취업 및 어학연수 비자 신청 자격 해당 연령대' });
        }
        if (manAge >= 38 && manAge <= 42) {
            alerts.push({ icon: '🏥', title: '생애전환기 건강검진', desc: '만 40세 주기 국가 지정 10대 생애전환 건강 종합검진 대상' });
        }
        if (manAge >= 63 && manAge <= 67) {
            alerts.push({ icon: '🏦', title: '국민연금/기초연금 개시', desc: '기초 법정연금 및 고령 교통 할인 복지 수혜 자격 도래' });
        }

        return alerts;
    }, [ageResult]);

    // 생활 체크리스트
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
        if (!birthYear || !birthMonth || !birthDay) return;
        setViewMode('result');
    };

    const setToday = () => {
        const d = new Date();
        setReferenceDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    };

    const handleCopyResult = () => {
        if (!ageResult) return;
        const text = `[한국 나이 계산 결과]
출생일: ${birthYear}년 ${birthMonth}월 ${birthDay}일 (기준일: ${referenceDate})
• 만 나이: ${ageResult.manAge}세 (법적 표준)
• 연 나이: ${ageResult.yeonAge}세 (청소년보호법)
• 세는 나이: ${ageResult.koreanAge}세 (한국식)
• 생일 D-day: ${ageResult.isBirthdayToday ? '오늘 생일! 🎉' : `D-${ageResult.daysUntilBirthday}일`}
• 띠/별자리: ${zodiac?.name || ''} (${zodiac?.emoji || ''}) / ${starSign?.name || ''} (${starSign?.emoji || ''})`;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    // ── [로딩 스크린] 3초 초기 대칭 정렬 로더 (Clean Neumorphism) ──
    if (isLoadingScreen) {
        return (
            <div className="loading-screen" role="status" aria-label="나이 계산기 앱 로딩 중">
                <header className="loading-header">
                    <div className="loading-header-title">
                        <Cake size={20} />
                        <span>한국 나이 계산기</span>
                    </div>
                </header>

                <div className="loading-body">
                    <div className="loading-icon-wrapper">
                        <div className="loading-icon-inner">
                            🎂
                        </div>
                    </div>

                    <h1 className="loading-title">한국 나이 계산기</h1>
                    <p className="loading-subtitle">만 나이 · 연 나이 · 세는 나이를 한 번에 정확하게</p>

                    <div className="loading-spinner" aria-hidden="true">
                        <div className="spinner-dot"></div>
                        <div className="spinner-dot"></div>
                        <div className="spinner-dot"></div>
                    </div>

                    <aside className="loading-ad-banner" aria-label="보안 및 안내">
                        <div className="ad-placeholder">
                            <span className="ad-badge">안내</span>
                            <span className="ad-text">입력하신 생년월일은 브라우저 세션에서만 안전하게 연산됩니다.</span>
                        </div>
                    </aside>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col hide-scrollbar select-none bg-[#e8edf2] text-[#1e293b]">
            <PageSEO
                title="한국 나이 계산기 - 만 나이, 연 나이, 세는 나이 원클릭 판정"
                description="출생년월일 입력만으로 법적 만 나이, 청소년보호법 기준 연 나이, 사회적 세는 나이 및 생애주기 복지/생활 혜택 가이드를 총망라해 주는 프리미엄 계산 도구입니다."
                path="/app/age-calc/"
            />

            {/* ── 상단 4탭 내비게이션 바 ── */}
            <nav className="calc-nav-container" aria-label="미니앱 탭 메뉴">
                <div className="calc-nav-inner">
                    <button
                        onClick={() => setActiveTab('calculator')}
                        className={`calc-nav-tab ${activeTab === 'calculator' ? 'active' : ''}`}
                        aria-label="나이 계산 화면"
                    >
                        <Cake size={16} />
                        <span>나이 계산</span>
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('calendar');
                            if (ageResult) setViewMode('result');
                        }}
                        className={`calc-nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
                        aria-label="생애 캘린더 화면"
                    >
                        <CalendarDays size={16} />
                        <span>생애 캘린더</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('howto')}
                        className={`calc-nav-tab ${activeTab === 'howto' ? 'active' : ''}`}
                        aria-label="사용방법 FAQ 화면"
                    >
                        <HelpCircle size={16} />
                        <span>사용방법</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('community')}
                        className={`calc-nav-tab ${activeTab === 'community' ? 'active' : ''}`}
                        aria-label="자유토론 게시판"
                    >
                        <MessageSquare size={16} />
                        <span>자유토론</span>
                    </button>
                </div>
            </nav>

            {/* ── 메인 콘텐츠 컨테이너 ── */}
            <main className="flex-1 overflow-y-auto pb-8 hide-scrollbar">
                <div className="max-w-md mx-auto px-4 py-5 w-full">

                    {/* ========================================================
                        1. 나이 계산 탭: 입력란과 결과란 2단계 뷰 완벽 분리
                       ======================================================== */}
                    {activeTab === 'calculator' && (
                        <div className="space-y-4">
                            {/* ── [뷰 1단계: 입력 화면] ── */}
                            {viewMode === 'input' && (
                                <div className="nm-card p-5 space-y-4 animate-[fadeIn_0.2s_ease-out]">
                                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
                                                <CalendarDays size={18} />
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-slate-800">생년월일 입력</h2>
                                                <p className="text-[11px] text-slate-500">정확한 출생일자를 선택해 주세요</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
                                            1단계 입력
                                        </span>
                                    </div>

                                    {/* 년 / 월 / 일 3분할 인풋 */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                            출생일자 (년 / 월 / 일)
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <span className="text-[10px] text-slate-400 mb-1 block">출생년도</span>
                                                <input
                                                    ref={yearInputRef}
                                                    type="number"
                                                    value={birthYear}
                                                    onChange={e => setBirthYear(e.target.value)}
                                                    placeholder="1995"
                                                    min={1900}
                                                    max={2026}
                                                    className="nm-inset-white w-full px-2 py-3 text-lg font-black text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none stock-number"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 mb-1 block">월</span>
                                                <select
                                                    value={birthMonth}
                                                    onChange={e => setBirthMonth(e.target.value)}
                                                    className="nm-inset-white w-full px-2 py-3 text-base font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">선택</option>
                                                    {Array.from({ length: 12 }, (_, i) => (
                                                        <option key={i + 1} value={i + 1}>{i + 1}월</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 mb-1 block">일</span>
                                                <select
                                                    value={birthDay}
                                                    onChange={e => setBirthDay(e.target.value)}
                                                    className="nm-inset-white w-full px-2 py-3 text-base font-bold text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="">선택</option>
                                                    {Array.from({ length: 31 }, (_, i) => (
                                                        <option key={i + 1} value={i + 1}>{i + 1}일</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 계산 기준일 */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                                            계산 기준일 <span className="text-[10px] font-normal text-slate-400">(기본값: 오늘)</span>
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={referenceDate}
                                                onChange={e => setReferenceDate(e.target.value)}
                                                className="nm-inset-white flex-1 px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 stock-number"
                                            />
                                            <button
                                                type="button"
                                                onClick={setToday}
                                                className="nm-btn px-3.5 py-2.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 shrink-0"
                                            >
                                                오늘
                                            </button>
                                        </div>
                                    </div>

                                    {/* ⚡ 나이 계산하기 대형 버튼 */}
                                    <button
                                        type="button"
                                        onClick={handleCalculate}
                                        disabled={!birthYear || !birthMonth || !birthDay}
                                        className="nm-btn-accent w-full py-4 text-white font-black text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md mt-2"
                                    >
                                        <Cake size={18} />
                                        <span>나이 계산하기</span>
                                    </button>

                                    {/* 하단 힌트 배너 */}
                                    <div className="p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-[11px] text-slate-500 flex items-start gap-2">
                                        <Sparkles size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                        <span>
                                            계산하기를 누르면 법적 <strong>만 나이</strong>와 <strong>연 나이</strong>, <strong>세는 나이</strong> 및 생활 권리 체크리스트가 상세히 분리되어 표시됩니다.
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* ── [뷰 2단계: 결과 영수증 대시보드 화면] ── */}
                            {viewMode === 'result' && ageResult && (
                                <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                                    {/* 상단 액션 바: 조건 다시 수정하기 & 요약 */}
                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('input')}
                                            className="nm-btn px-3 py-2 text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-indigo-600 cursor-pointer"
                                        >
                                            <ArrowLeft size={14} />
                                            <span>조건 다시 수정하기</span>
                                        </button>
                                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 stock-number">
                                            {birthYear}년 {birthMonth}월 {birthDay}일생
                                        </span>
                                    </div>

                                    {/* [HERO] 대표 만 나이 모니터 */}
                                    <div className="nm-card p-6 text-center relative overflow-hidden">
                                        <div className="text-xs font-bold text-indigo-600 mb-1 flex items-center justify-center gap-1">
                                            <Sparkles size={14} />
                                            <span>공식 법적·행정 표준 나이</span>
                                        </div>
                                        <div className="my-2">
                                            <span className="text-5xl md:text-6xl font-black text-indigo-600 stock-number tracking-tight">
                                                {ageResult.manAge}
                                            </span>
                                            <span className="text-2xl font-bold text-slate-700 ml-1">세</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">
                                            2023년 6월 28일 시행된 <strong>만 나이 통일법</strong>에 따른 기준입니다.
                                        </p>
                                    </div>

                                    {/* 3대 나이 비교 카드 그리드 */}
                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div className="nm-card-sm p-3.5 text-center border-t-2 border-t-indigo-500">
                                            <div className="text-[11px] font-bold text-indigo-600 mb-1">만 나이</div>
                                            <div className="text-2xl font-black text-slate-800 stock-number">
                                                {ageResult.manAge}<span className="text-xs font-semibold text-slate-500 ml-0.5">세</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">법적·표준 행정</div>
                                        </div>
                                        <div className="nm-card-sm p-3.5 text-center border-t-2 border-t-purple-500">
                                            <div className="text-[11px] font-bold text-purple-600 mb-1">연 나이</div>
                                            <div className="text-2xl font-black text-slate-800 stock-number">
                                                {ageResult.yeonAge}<span className="text-xs font-semibold text-slate-500 ml-0.5">세</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">청소년보호법</div>
                                        </div>
                                        <div className="nm-card-sm p-3.5 text-center border-t-2 border-t-pink-500">
                                            <div className="text-[11px] font-bold text-pink-600 mb-1">세는 나이</div>
                                            <div className="text-2xl font-black text-slate-800 stock-number">
                                                {ageResult.koreanAge}<span className="text-xs font-semibold text-slate-500 ml-0.5">세</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1">한국식 관습</div>
                                        </div>
                                    </div>

                                    {/* D-Day 생일 알림 카드 */}
                                    <div className="nm-card-sm p-4 flex items-center gap-3.5">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shrink-0">
                                            <Gift size={22} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-black text-slate-800">
                                                {ageResult.isBirthdayToday ? '🎉 오늘이 기쁜 생일입니다!' : `다음 생일까지 D-${ageResult.daysUntilBirthday}일`}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 stock-number">
                                                기준일 ({referenceDate}) 대비 카운트다운
                                            </div>
                                        </div>
                                    </div>

                                    {/* 띠와 별자리 듀얼 카드 */}
                                    {(zodiac || starSign) && (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {zodiac && (
                                                <div className="nm-card-sm p-4 text-center">
                                                    <div className="text-3xl mb-1">{zodiac.emoji}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">출생 띠</span>
                                                    <span className="text-base font-black text-slate-800">{zodiac.name}</span>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{zodiac.desc}</p>
                                                </div>
                                            )}
                                            {starSign && (
                                                <div className="nm-card-sm p-4 text-center">
                                                    <div className="text-3xl mb-1">{starSign.emoji}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">수호성 자리</span>
                                                    <span className="text-base font-black text-slate-800">{starSign.name}</span>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{birthMonth}월 {birthDay}일 탄생</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 생애 권리 획득 체크리스트 */}
                                    <div className="nm-card p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800">생애 권리 획득 체크리스트</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {checklistResults.map(item => (
                                                <div
                                                    key={item.name}
                                                    className={`p-3 rounded-xl border transition-all ${
                                                        item.canDo
                                                            ? 'bg-emerald-50/70 border-emerald-200 shadow-sm'
                                                            : 'bg-slate-100/60 border-slate-200/80 opacity-70'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-lg">{item.icon}</span>
                                                        {item.canDo ? (
                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                        ) : (
                                                            <XCircle size={16} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                                                    <div className={`text-[10px] font-bold mt-2 ${item.canDo ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {item.statusText}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 주요 생애 주기 알림 */}
                                    {lifecycleAlerts.length > 0 && (
                                        <div className="nm-card p-5 space-y-3 border-l-4 border-l-amber-500">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                    <Bell size={16} />
                                                </div>
                                                <h3 className="text-sm font-black text-slate-800">주요 생애 주기 알림</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {lifecycleAlerts.map((alert, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-3 p-3 bg-white/70 border border-slate-200 rounded-xl"
                                                    >
                                                        <span className="text-2xl shrink-0">{alert.icon}</span>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800">{alert.title}</div>
                                                            <div className="text-[11px] text-slate-600 mt-0.5 leading-normal">{alert.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 하단 듀얼 버튼: 다시 계산 / 결과 복사 */}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('input')}
                                            className="nm-btn flex-1 py-3 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <RefreshCw size={14} />
                                            <span>다른 생년월일 계산</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCopyResult}
                                            className="nm-btn-accent flex-1 py-3 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                                        >
                                            {isCopied ? <Check size={14} /> : <Copy size={14} />}
                                            <span>{isCopied ? '복사 완료! ✨' : '결과 복사하기'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================
                        2. 생애 캘린더 탭
                       ======================================================== */}
                    {activeTab === 'calendar' && (
                        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                            {ageResult ? (
                                <>
                                    {/* 띠 & 별자리 */}
                                    {(zodiac || starSign) && (
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {zodiac && (
                                                <div className="nm-card p-4 text-center">
                                                    <div className="text-4xl mb-1.5">{zodiac.emoji}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">출생 띠</span>
                                                    <span className="text-base font-black text-slate-800">{zodiac.name}</span>
                                                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{zodiac.desc}</p>
                                                </div>
                                            )}
                                            {starSign && (
                                                <div className="nm-card p-4 text-center">
                                                    <div className="text-4xl mb-1.5">{starSign.emoji}</div>
                                                    <span className="text-[10px] font-bold text-slate-400 block">수호성 자리</span>
                                                    <span className="text-base font-black text-slate-800">{starSign.name}</span>
                                                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{birthMonth}월 {birthDay}일 탄생</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* 생애 권리 체크리스트 */}
                                    <div className="nm-card p-5 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <CheckCircle2 size={16} />
                                            </div>
                                            <h3 className="text-sm font-black text-slate-800">생애 권리 획득 체크리스트</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {checklistResults.map(item => (
                                                <div
                                                    key={item.name}
                                                    className={`p-3 rounded-xl border transition-all ${
                                                        item.canDo
                                                            ? 'bg-emerald-50/70 border-emerald-200 shadow-sm'
                                                            : 'bg-slate-100/60 border-slate-200/80 opacity-70'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-lg">{item.icon}</span>
                                                        {item.canDo ? (
                                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                                        ) : (
                                                            <XCircle size={16} className="text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-800">{item.name}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{item.desc}</div>
                                                    <div className={`text-[10px] font-bold mt-2 ${item.canDo ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {item.statusText}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 생애 주기 타임라인 */}
                                    {lifecycleAlerts.length > 0 && (
                                        <div className="nm-card p-5 space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                                    <Bell size={16} />
                                                </div>
                                                <h3 className="text-sm font-black text-slate-800">주요 생애 주기 알림</h3>
                                            </div>
                                            <div className="space-y-2">
                                                {lifecycleAlerts.map((alert, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-3 p-3.5 bg-white/80 border border-slate-200 rounded-xl"
                                                    >
                                                        <span className="text-2xl shrink-0">{alert.icon}</span>
                                                        <div>
                                                            <div className="text-xs font-bold text-slate-800">{alert.title}</div>
                                                            <div className="text-[11px] text-slate-600 mt-1 leading-normal">{alert.desc}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="nm-card p-8 text-center space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto flex items-center justify-center">
                                        <CalendarDays size={24} />
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-700">생년월일을 먼저 입력해 주세요</h3>
                                    <p className="text-xs text-slate-400">
                                        출생 띠, 수호성 별자리, 법적 권리 체크리스트가 이곳에 구성됩니다.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setActiveTab('calculator');
                                            setViewMode('input');
                                        }}
                                        className="nm-btn-accent px-4 py-2.5 text-xs font-bold text-white inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
                                    >
                                        <Cake size={14} />
                                        <span>생년월일 입력하러 가기</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================
                        3. 사용방법 탭 (AEO 최적화 가이드 테이블 수록)
                       ======================================================== */}
                    {activeTab === 'howto' && (
                        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                            {/* 법안 안내 FAQ */}
                            <div className="nm-card p-5 space-y-4">
                                <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                        <HelpCircle size={16} />
                                    </div>
                                    <h3 className="text-sm font-black text-slate-800">
                                        만 나이 통일법 핵심 상식 FAQ
                                    </h3>
                                </div>
                                <div className="space-y-3 text-xs">
                                    <div className="p-3 bg-white/70 border border-slate-200/80 rounded-xl">
                                        <div className="font-bold text-slate-800 mb-1">Q. 만 나이는 언제 어떻게 올라가나요?</div>
                                        <p className="text-slate-600 leading-relaxed text-[11px]">
                                            출생일(생일)이 지날 때마다 1세가 올라갑니다. 즉, 올해 생일 이전에는 <strong>[현재년도 - 출생년도 - 1]세</strong>이며, 생일 당일부터는 <strong>[현재년도 - 출생년도]세</strong>가 됩니다.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/70 border border-slate-200/80 rounded-xl">
                                        <div className="font-bold text-slate-800 mb-1">Q. 술, 담배 구매 기준은 무엇인가요?</div>
                                        <p className="text-slate-600 leading-relaxed text-[11px]">
                                            주류와 담배는 청소년보호법의 <strong>'연 나이'</strong> 기준을 적용받습니다. 생일이 지나지 않았더라도 <strong>출생한 연도의 1월 1일이 되는 날부터 만 19세에 해당</strong>하므로 구매가 허용됩니다.
                                        </p>
                                    </div>
                                    <div className="p-3 bg-white/70 border border-slate-200/80 rounded-xl">
                                        <div className="font-bold text-slate-800 mb-1">Q. 초등학교 입학 기준은 어떻게 되나요?</div>
                                        <p className="text-slate-600 leading-relaxed text-[11px]">
                                            초등학교 입학은 만 나이 기준으로 <strong>만 6세가 되는 해의 다음 해 3월 1일</strong>에 입학하게 되므로, 기존과 동일하게 학급 친구들의 출생년도는 동일하게 묶이게 됩니다.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* AEO 매핑 지식 테이블 */}
                            <div className="aeo-guide-card">
                                <div className="flex items-center gap-2">
                                    <Star size={16} className="text-amber-500" />
                                    <h3 className="text-sm font-black text-slate-800">
                                        연도생별 나이 환산 테이블 (2026년 기준)
                                    </h3>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                    만 나이 통일법 및 청소년보호법 연 나이 공식 변환 지식 테이블입니다.
                                </p>
                                <div className="aeo-table-wrapper">
                                    <table className="aeo-table">
                                        <thead>
                                            <tr>
                                                <th>출생연도</th>
                                                <th>세는 나이</th>
                                                <th>연 나이 (법안)</th>
                                                <th>만 나이 (생일 후)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="aeo-highlight">2007년생</td>
                                                <td className="stock-number">20세</td>
                                                <td className="stock-number">19세</td>
                                                <td className="stock-number">19세</td>
                                            </tr>
                                            <tr>
                                                <td className="aeo-highlight">1996년생</td>
                                                <td className="stock-number">31세</td>
                                                <td className="stock-number">30세</td>
                                                <td className="stock-number">30세</td>
                                            </tr>
                                            <tr>
                                                <td className="aeo-highlight">1985년생</td>
                                                <td className="stock-number">42세</td>
                                                <td className="stock-number">41세</td>
                                                <td className="stock-number">41세</td>
                                            </tr>
                                            <tr>
                                                <td className="aeo-highlight">1974년생</td>
                                                <td className="stock-number">53세</td>
                                                <td className="stock-number">52세</td>
                                                <td className="stock-number">52세</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================
                        4. 자유토론 탭
                       ======================================================== */}
                    {activeTab === 'community' && (
                        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
                            <MiniAppCommunity appId="age-calc" />
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default App;
