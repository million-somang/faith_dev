import { useEffect, useState, useCallback } from 'react';
import { Header, Footer, Card, t } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { MiniAppButton } from '../components/MiniAppButton';
import { PageSEO } from '../components/PageSEO';
import { SoftLockModal } from '../components/common/SoftLockModal';
import axios from 'axios';

interface MiniApp {
    id: number;
    name: string;
    slug: string;
    icon_url: string;
    description: string;
    app_url: string;
    require_auth: number;
    category: string;
}

interface CategoryInfo {
    key: string;
    label: string;
    icon: string;
}

const CATEGORIES: CategoryInfo[] = [
    { key: 'all', label: '전체', icon: 'fas fa-th-large' },
    { key: 'calc', label: '계산기', icon: 'fas fa-calculator' },
    { key: 'finance', label: '금융', icon: 'fas fa-coins' },
    { key: 'text', label: '텍스트', icon: 'fas fa-font' },
    { key: 'dev', label: '개발 도구', icon: 'fas fa-code' },
];

/** 이용 가이드 전용 카테고리 (전체 제외, 계산기 기본) */
const GUIDE_CATEGORIES: CategoryInfo[] = [
    { key: 'calc', label: '계산기', icon: 'fas fa-calculator' },
    { key: 'finance', label: '금융', icon: 'fas fa-coins' },
    { key: 'text', label: '텍스트', icon: 'fas fa-font' },
    { key: 'dev', label: '개발 도구', icon: 'fas fa-code' },
];

/** 모달로 열어야 하는 앱의 slug 목록 */
const MODAL_APP_SLUGS = ['text-checker', 'pyeong-calc', 'age-calc', 'dday-calc'];

export default function UtilityPage() {
    const { user, logout } = useAuth();
    const [apps, setApps] = useState<MiniApp[]>([]);
    const [frequentApps, setFrequentApps] = useState<MiniApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedGuideCategory, setSelectedGuideCategory] = useState('calc');
    const [showSoftLock, setShowSoftLock] = useState(false);

    // 모달 상태
    const [modalOpen, setModalOpen] = useState(false);
    const [modalUrl, setModalUrl] = useState('');
    const [modalTitle, setModalTitle] = useState('');

    const loadFrequentApps = () => {
        axios.get('/api/mini-apps/frequent')
            .then(res => {
                if (res.data && res.data.success && res.data.apps) {
                    setFrequentApps(res.data.apps.filter((app: MiniApp) => app.category !== 'game'));
                }
            })
            .catch(err => console.error('Failed to load frequent apps:', err));
    };

    useEffect(() => {
        axios.get('/api/mini-apps')
            .then(res => {
                if (res.data && res.data.success && res.data.apps) {
                    setApps(res.data.apps.filter((a: any) => a.status === 'active'));
                }
            })
            .catch(err => console.error('Failed to load apps:', err))
            .finally(() => setLoading(false));

        loadFrequentApps();
    }, []);

    // 페이지에 포커스가 돌아올 때 자주 쓰는 앱 목록 갱신
    useEffect(() => {
        const handleFocus = () => loadFrequentApps();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    // 모달 오픈 시 body 스크롤 방지
    useEffect(() => {
        document.body.classList.toggle('miniapp-modal-open', modalOpen);
        return () => {
            document.body.classList.remove('miniapp-modal-open');
        };
    }, [modalOpen]);

    // ESC로 모달 닫기
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modalOpen) setModalOpen(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalOpen]);

    // 모달이 오픈될 때 자동으로 iframe 엘리먼트와 그 내부 Window에 포커스를 집행하여 물리 키보드/키패드가 즉시 동작하도록 보장
    useEffect(() => {
        if (modalOpen) {
            const timer = setTimeout(() => {
                const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
                if (iframe) {
                    iframe.focus();
                    iframe.contentWindow?.focus();
                }
            }, 150); // DOM 페인팅 대기 후 완벽 집행
            return () => clearTimeout(timer);
        }
    }, [modalOpen]);

    // 자식 계산기로부터 로딩 완료/상태 변경 신호를 받아 포커스를 확실히 iframe에 집행
    useEffect(() => {
        const handleMessage = (e: MessageEvent) => {
            if (e.data && (e.data.type === 'CALCULATOR_READY' || e.data.type === 'MINI_APP_READY')) {
                const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
                if (iframe) {
                    iframe.focus();
                    iframe.contentWindow?.focus();
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    // 모달이 열려 있을 때 부모 창에서 발생하는 모든 keydown 이벤트를 가로채어 자식 iframe으로 릴레이 전송
    useEffect(() => {
        if (!modalOpen) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === 'INPUT' ||
                activeEl.tagName === 'SELECT' ||
                activeEl.tagName === 'TEXTAREA'
            )) {
                return;
            }

            const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage({
                    type: 'PARENT_KEYBOARD_EVENT',
                    key: e.key,
                    code: e.code,
                    shiftKey: e.shiftKey,
                    ctrlKey: e.ctrlKey,
                    altKey: e.altKey,
                    metaKey: e.metaKey
                }, '*');
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [modalOpen]);

    const getDevUrl = (app: MiniApp): string => {
        const lang = t('홈') === 'Home' ? 'en' : 'ko';
        let baseUrl = app.app_url;
        if (import.meta.env.DEV) {
            if (app.app_url.includes('calculator')) baseUrl = 'http://localhost:5019/app/calculator/';
            else if (app.app_url.includes('text-checker')) baseUrl = 'http://localhost:5011/app/text-checker/';
            else if (app.app_url.includes('pyeong-calc')) baseUrl = 'http://localhost:5014/app/pyeong-calc/';
            else if (app.app_url.includes('age-calc')) baseUrl = 'http://localhost:5017/app/age-calc/';
            else if (app.app_url.includes('dday-calc')) baseUrl = 'http://localhost:5018/app/dday-calc/';
            else if (app.app_url.includes('severance-calc')) baseUrl = 'http://localhost:5028/app/severance-calc/';
            else if (app.app_url.includes('interest-calc')) baseUrl = 'http://localhost:5029/app/interest-calc/';
        }
        const separator = baseUrl.includes('?') ? '&' : '?';
        return baseUrl.includes('lang=') ? baseUrl : `${baseUrl}${separator}lang=${lang}`;
    };

    /** 이 앱이 모달로 열어야 하는 앱인지 판별 */
    const isModalApp = (app: MiniApp): boolean => {
        return MODAL_APP_SLUGS.some(slug => app.app_url.includes(slug) || app.slug === slug);
    };

    /** 모달 열기 콜백 */
    const handleModalOpen = useCallback((url: string, title: string) => {
        const lang = t('홈') === 'Home' ? 'en' : 'ko';
        const separator = url.includes('?') ? '&' : '?';
        const finalUrl = url.includes('lang=') ? url : `${url}${separator}lang=${lang}`;
        setModalUrl(finalUrl);
        setModalTitle(t(title));
        setModalOpen(true);
    }, []);

    const filteredApps = selectedCategory === 'all'
        ? apps.filter(app => app.category !== 'game')
        : apps.filter(app => app.category === selectedCategory);

    // 이용 가이드 데이터 정의 (카테고리별 분류)
    const GUIDE_CARDS = [
        {
            category: 'finance',
            icon: 'fas fa-piggy-bank',
            iconColor: 'text-cyan-500',
            title: '2026 예·적금 이자 & 비과세 비교 활용법',
            desc: '정기예금(거치식)과 정기적금(적립식)의 단리/월복리 이자를 정밀 산출합니다. 일반과세(15.4%), 세금우대(9.5%), 비과세(0%) 적용에 따른 최종 실수령액과 비과세 절세 차액을 원클릭 비교 차트로 확인하세요.'
        },
        {
            category: 'finance',
            icon: 'fas fa-file-invoice-dollar',
            iconColor: 'text-blue-600',
            title: '2026 퇴직금 & 실업급여 계산기 활용법',
            desc: '고용노동부 최신 법정 산식에 맞춰 입사/퇴사일 및 최근 3개월 급여(상여금·연차수당 3/12 가산)로 1일 평균임금과 통상임금을 비교 산출합니다. 2026년 개정 소득세법 근속연수 공제가 반영된 세후 실수령 퇴직금과 함께, 연령·가입기간별 실업급여 소정급여일수(120~270일)와 2026년 상한액(66,000원)/하한액(64,192원)을 즉시 계산합니다.'
        },
        {
            category: 'calc',
            icon: 'fas fa-birthday-cake',
            iconColor: 'text-pink-500',
            title: '만 나이 계산 공식 및 규정',
            desc: '대한민국 행정·사법 기준인 \'만 나이\'는 태어난 날을 0세로 시작하여 매 생일마다 1살씩 더해집니다. 현재 연도에서 출생 연도를 뺀 후, 올해 생일이 지났다면 그 수치가 만 나이가 되며, 생일이 지나지 않았다면 1살을 더 차감하여 정확한 법적 나이를 산출합니다.'
        },
        {
            category: 'calc',
            icon: 'fas fa-vector-square',
            iconColor: 'text-emerald-500',
            title: '부동산 평수 - 제곱미터(㎡) 환산법',
            desc: '1평은 약 3.305785㎡입니다. 제곱미터(㎡) 값을 평수로 변환할 때는 ㎡ ÷ 3.3058을 적용하며, 평수를 제곱미터로 바꿀 때는 평수 × 3.3058을 곱합니다. 아파트 분양 시 전용면적과 공급면적을 구분하여 계산하시면 더욱 정확합니다.'
        },
        {
            category: 'calc',
            icon: 'fas fa-calendar-alt',
            iconColor: 'text-purple-500',
            title: 'D-Day 및 날짜 계산 원리',
            desc: 'D-Day 계산기는 시험, 연애 기념일, 출산 예정일, 군 전역일 등 중요한 날짜까지 남은 일수(D-) 또는 지난 일수(D+)를 계산합니다. 시작일 당일을 1일로 포함하는 기준과 포함하지 않는 기준을 모두 지원하여 상황에 맞게 정확한 일수를 확인할 수 있습니다.'
        },
        {
            category: 'calc',
            icon: 'fas fa-calculator',
            iconColor: 'text-indigo-500',
            title: '다기능 스마트 계산기 활용법',
            desc: '일상적인 사칙연산뿐만 아니라 할인율(세일가) 계산, 백분율(%), 부가세(VAT), 비만도(BMI)까지 원스톱으로 지원합니다. 직관적인 키패드와 계산 기록 히스토리 저장 기능을 제공하여 복잡한 영수증 정산이나 쇼핑 시 유용하게 사용할 수 있습니다.'
        },
        {
            category: 'text',
            icon: 'fas fa-spell-check',
            iconColor: 'text-blue-500',
            title: '글자수 세기 & 자소서 검사 팁',
            desc: '자기소개서 및 공문서 작성 시 공백 포함 글자수와 공백 제외 글자수, 바이트(Byte) 수가 다르게 정해집니다. 한글은 1자당 2~3Byte, 영문·숫자·공백은 1자당 1Byte로 처리되므로 자소서 제출 전 VERA 글자수 검사기로 한도를 확인하세요.'
        },
        {
            category: 'dev',
            icon: 'fas fa-code',
            iconColor: 'text-cyan-600',
            title: 'Pro JSON 스튜디오 & 문법 검증',
            desc: '들여쓰기가 깨진 복잡한 JSON 데이터를 2스페이스/4스페이스로 깔끔하게 포매팅(Prettify)하고 문법 에러 위치를 실시간 검출합니다. 또한 공백을 제거하는 압축(Minify) 기능과 YAML, XML, CSV 상호 변환을 지원하여 개발 생산성을 높입니다.'
        },
        {
            category: 'dev',
            icon: 'fas fa-exchange-alt',
            iconColor: 'text-amber-500',
            title: 'Base64 인코더 / 디코더 & JWT 분석',
            desc: '문자열 텍스트 및 이미지 파일을 안전하게 Base64 형식으로 인코딩하거나 역으로 디코딩합니다. 웹 개발 시 자주 사용되는 JWT(JSON Web Token) 페이로드 파싱 및 Base64 이미지 미리보기 기능을 100% 클라이언트 브라우저에서 안전하게 처리합니다.'
        },
        {
            category: 'dev',
            icon: 'fas fa-bezier-curve',
            iconColor: 'text-rose-500',
            title: 'Vector Studio (이미지 to SVG 변환)',
            desc: '픽셀이 깨지는 비트맵 이미지(PNG, JPG, WEBP)를 확대해도 깨지지 않는 깨끗한 SVG 벡터 그래픽으로 실시간 변환합니다. 로고, 아이콘, 서명 이미지의 배경을 투명화하고 최적화된 SVG 코드 및 Data URI를 다운로드할 수 있습니다.'
        }
    ];

    const filteredGuides = selectedGuideCategory === 'all'
        ? GUIDE_CARDS
        : GUIDE_CARDS.filter(g => g.category === selectedGuideCategory);

    /** 앱별 MiniAppButton을 렌더링하면서, 모달 앱이면 onModalOpen 콜백을 전달 */
    const renderAppButton = (app: MiniApp, keyPrefix = '') => (
        <MiniAppButton
            key={`${keyPrefix}${app.id}`}
            appId={String(app.id)}
            title={t(app.name)}
            icon={<i className={`${app.icon_url || 'fas fa-cube'} text-3xl ${keyPrefix ? 'text-indigo-500' : 'text-blue-500'}`}></i>}
            url={getDevUrl(app)}
            requireAuth={app.require_auth === 1}
            isLoggedIn={!!user}
            onModalOpen={isModalApp(app) ? handleModalOpen : undefined}
        />
    );

    return (
        <div className="flex flex-col min-h-screen">
            <PageSEO
                title={t('생활도구 - 계산기, 금융 도구, 변환기, 텍스트 도구')}
                description={t('예적금 이자 계산기, 퇴직금 계산기, 만나이 계산기, 평수 변환기, D-Day 계산기, JSON 포맷터 등 유용한 생활 금융 도구 모음.')}
                path="/lifestyle"
            />
            <Header user={user} onLogout={logout} />
            <main className="flex-1 max-w-6xl mx-auto px-1 sm:px-4 py-12 w-full">
                <Card className="p-8">
                    <div className="flex items-center gap-4 mb-8 border-b pb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <i className="fas fa-tools text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{t('유틸리티')}</h1>
                            <p className="text-gray-500 text-sm mt-1">{t('일상에 유용한 도구들을 모았습니다.')}</p>
                        </div>
                    </div>

                    {/* 자주 쓰는 앱 섹션 */}
                    {!loading && frequentApps.length > 0 && (
                        <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <i className="fas fa-star text-amber-400 text-sm"></i>
                                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">{t('자주 쓰는 앱')}</h2>
                            </div>
                            <div className="relative rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100/60 p-5">
                                <div className="absolute inset-0 rounded-2xl bg-white/30 backdrop-blur-sm pointer-events-none"></div>
                                <div className="relative grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 justify-items-center">
                                    {frequentApps.map(app => renderAppButton(app, 'freq-'))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 카테고리 필터 버튼 */}
                    {!loading && apps.length > 0 && (
                        <div className="flex items-center gap-2 mb-6 flex-wrap">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.key}
                                    onClick={() => setSelectedCategory(cat.key)}
                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                                        selectedCategory === cat.key
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                                >
                                    <i className={cat.icon}></i>
                                    {t(cat.label)}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* 앱 그리드 */}
                    {loading ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100"></div>
                                    <div className="w-12 h-3 bg-gray-100 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : filteredApps.length > 0 ? (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-6 justify-items-center">
                            {filteredApps.map(app => renderAppButton(app))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-400">
                            <i className="fas fa-inbox text-3xl mb-2"></i>
                            <p>{t('해당 카테고리에 앱이 없습니다.')}</p>
                        </div>
                    )}
                </Card>

                {/* 구글 애드센스 및 검색 엔진(SEO)용 고밀도 유틸리티 도구 가이드 & FAQ (300~500자 이상) */}
                <section className="mt-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-slate-700 space-y-8">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                                <i className="fas fa-info-circle text-blue-600"></i>
                                VERA 무료 생활 도구 & 계산기 이용 가이드
                            </h2>
                            {/* 이용 가이드 카테고리 필터 탭 (전체 제외, 계산기 기본) */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {GUIDE_CATEGORIES.map(cat => (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => setSelectedGuideCategory(cat.key)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                            selectedGuideCategory === cat.key
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                    >
                                        <i className={`${cat.icon} text-[10px]`}></i>
                                        <span>{t(cat.label)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            VERA 라이프 유틸리티는 일상생활과 재테크에서 매일 사용하는 다양한 계산기, 금융 도구, 단위 변환기, 텍스트 검사 도구를 별도의 회원가입이나 앱 설치 없이 브라우저에서 바로 사용할 수 있도록 제공합니다.
                        </p>
                    </div>

                    {/* 카테고리 필터가 적용된 가이드 카드 그리드 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredGuides.map((guide, idx) => (
                            <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2 animate-fade-in">
                                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    <i className={`${guide.icon} ${guide.iconColor}`}></i> {guide.title}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {guide.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="font-bold text-slate-900 text-lg mb-3">자주 묻는 질문 (FAQ)</h3>
                        <dl className="space-y-3 text-xs text-slate-600">
                            <div>
                                <dt className="font-bold text-slate-800">Q. 예·적금 단리/복리 및 비과세 혜택 비교는 어떻게 되나요?</dt>
                                <dd className="mt-1">A. 정기예금(거치식)과 정기적금(적립식)의 단리/월복리 이자 산식을 지원하며, 일반과세(15.4%), 세금우대(9.5%), 비과세(0%) 적용에 따른 최종 실수령액과 비과세 절세 차액을 원클릭으로 비교해 드립니다.</dd>
                            </div>
                            <div>
                                <dt className="font-bold text-slate-800">Q. 퇴직금 및 실업급여 계산은 최신 법령 기준인가요?</dt>
                                <dd className="mt-1">A. 네, 고용노동부 최신 근로기준법 및 고용보험법, 2026년 개정 소득세법 근속연수 공제율과 2026년 실업급여 1일 상한액(66,000원)·하한액(64,192원) 기준을 100% 실시간 적용하여 산출합니다.</dd>
                            </div>
                            <div>
                                <dt className="font-bold text-slate-800">Q. 모든 생활 유틸리티 도구 이용료는 무료인가요?</dt>
                                <dd className="mt-1">A. 네, VERA에서 제공하는 계산기, 변환기, 글자수 세기 등 모든 유틸리티는 100% 무료이며 회원가입 없이 이용 가능합니다.</dd>
                            </div>
                            <div>
                                <dt className="font-bold text-slate-800">Q. 모바일 스마트폰이나 태블릿에서도 사용 가능한가요?</dt>
                                <dd className="mt-1">A. VERA의 모든 도구는 반응형 웹(Responsive Web)으로 디자인되어 PC, 스마트폰, 태블릿 모든 기기 화면에 맞춤 지원됩니다.</dd>
                            </div>
                        </dl>
                    </div>
                </section>

                {/* 🌟 소프트 락인 넛지 배너 */}
                <section className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-emerald-700/40">
                    <div className="space-y-1.5 text-center sm:text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                            <i className="fas fa-magic"></i> 빠른 즐겨찾기
                        </span>
                        <h3 className="text-lg sm:text-xl font-bold">
                            자주 쓰는 계산식과 도구를 마이페이지에 저장하세요
                        </h3>
                        <p className="text-xs text-emerald-100/80 max-w-xl leading-relaxed">
                            {user ? '즐겨찾기한 도구와 최근 계산 기록은 마이페이지에서 언제든 빠르게 불러올 수 있습니다.' : '회원가입하시면 자주 쓰는 계산기와 최근 연산 히스토리가 영구 보관되며, 홈 화면에 퀵 위젯으로 배치할 수 있습니다.'}
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            if (!user) {
                                setShowSoftLock(true);
                            } else {
                                window.location.href = '/mypage';
                            }
                        }}
                        className="px-6 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-2"
                    >
                        <i className="fas fa-bookmark"></i>
                        <span>{user ? '마이페이지 도구함 가기' : '1초 만에 도구함 저장하기'}</span>
                    </button>
                </section>
            </main>
            <Footer />

            {/* 🌟 소프트 락인 모달 */}
            <SoftLockModal
                isOpen={showSoftLock}
                onClose={() => setShowSoftLock(false)}
                type="calc"
            />

            {/* ======== 미니앱 모달 ======== */}
            {modalOpen && (
                <div
                    className="mini-app-modal-overlay"
                    onClick={() => setModalOpen(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={modalTitle}
                >
                    <div
                        className="mini-app-modal-container"
                        onClick={(e) => {
                            e.stopPropagation();
                            const iframe = document.querySelector('.mini-app-modal-iframe') as HTMLIFrameElement;
                            if (iframe) {
                                iframe.focus();
                                iframe.contentWindow?.focus();
                            }
                        }}
                    >
                        {/* 모달 헤더 */}
                        <div className="mini-app-modal-header">
                            <span className="mini-app-modal-title">
                                <i className="fas fa-calculator" aria-hidden="true"></i>
                                {modalTitle}
                            </span>
                            <button
                                className="mini-app-modal-close"
                                onClick={() => setModalOpen(false)}
                                aria-label="닫기"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        {/* iframe 콘텐츠 */}
                        <iframe
                            key={modalUrl}
                            src={modalUrl}
                            className="mini-app-modal-iframe"
                            title={modalTitle}
                            allow="clipboard-write"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
