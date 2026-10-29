'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@faithportal/ui';
import { useAuth } from '@/context/AuthContext';
import { SoftLockModal } from '@/components/common/SoftLockModal';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import { recordAppUsage } from '@/hooks/useFrequentApps';
import { getUtilityVisualMeta, UTILITY_HERO_BANNER } from '@/utils/utilityAssets';
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
    { key: 'finance', label: '금융 · 재테크', icon: 'fas fa-coins' },
    { key: 'text', label: 'AI · 텍스트', icon: 'fas fa-font' },
    { key: 'dev', label: '개발 · 변환', icon: 'fas fa-code' },
];

const GUIDE_CATEGORIES: CategoryInfo[] = [
    { key: 'calc', label: '계산기', icon: 'fas fa-calculator' },
    { key: 'finance', label: '금융', icon: 'fas fa-coins' },
    { key: 'text', label: '텍스트', icon: 'fas fa-font' },
    { key: 'dev', label: '개발 도구', icon: 'fas fa-code' },
];

const ESSENTIAL_APPS: MiniApp[] = [
    {
        id: 991,
        name: '이미지 크기 조정 & 변환',
        slug: 'image-resizer',
        icon_url: '/images/utility/icon_image_resizer.png',
        description: 'SNS 규격 및 픽셀, 비율, 용량(KB) 단위 최대 50장 다중 이미지 일괄 리사이즈 & WebP/JPG/PNG 변환기',
        app_url: '/app/image-resizer/',
        require_auth: 0,
        category: 'calc'
    },
    {
        id: 992,
        name: '예·적금 이자 & 비과세 계산기',
        slug: 'interest-calc',
        icon_url: '/images/utility/icon_finance_wealth.png',
        description: '정기예금·적금 단리/월복리 이자 산출 및 일반과세(15.4%)·세금우대·비과세 만기 실수령액 원클릭 비교',
        app_url: '/app/interest-calc/',
        require_auth: 0,
        category: 'finance'
    },
    {
        id: 993,
        name: '2026 퇴직금 & 실업급여 계산기',
        slug: 'severance-calc',
        icon_url: '/images/utility/icon_finance_wealth.png',
        description: '고용노동부 최신 법정 산식 기반 1일 평균임금·통상임금 비교, 세후 실수령 퇴직금 및 실업급여 모의계산',
        app_url: '/app/severance-calc/',
        require_auth: 0,
        category: 'finance'
    },
    {
        id: 994,
        name: '주택담보대출 DSR / LTV 계산기',
        slug: 'finance-dsr',
        icon_url: '/images/utility/icon_finance_wealth.png',
        description: '연소득 대비 DSR 40% 규제 및 스트레스 금리 가산을 반영한 최대 주택담보·신용대출 가능 한도 시뮬레이션',
        app_url: '/finance/util?tab=dsr',
        require_auth: 0,
        category: 'finance'
    }
];

export default function UtilityPage() {
    const { user } = useAuth();
    const { launchApp } = useAppLauncher();
    const [apps, setApps] = useState<MiniApp[]>([]);
    const [frequentApps, setFrequentApps] = useState<MiniApp[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedGuideCategory, setSelectedGuideCategory] = useState('calc');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSoftLock, setShowSoftLock] = useState(false);

    const handleLaunchUtility = async (app: MiniApp) => {
        if (app.require_auth === 1 && !user) {
            alert(`${app.name} 앱을 사용하려면 로그인이 필요합니다.`);
            window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
            return;
        }

        const appIdStr = String(app.id);
        recordAppUsage(appIdStr);

        try {
            await axios.post(`/api/mini-apps/${appIdStr}/log`, { action_type: 'LAUNCH' });
        } catch {
            // ignore logging error
        }

        launchApp(app.app_url, appIdStr);
    };

    const loadFrequentApps = () => {
        axios.get('/api/mini-apps/frequent')
            .then(res => {
                if (res.data && res.data.success && Array.isArray(res.data.apps) && res.data.apps.length > 0) {
                    const filtered = res.data.apps.filter((app: MiniApp) => app.category !== 'game');
                    if (!filtered.some((a: MiniApp) => a.slug === 'image-resizer')) {
                        filtered.unshift(ESSENTIAL_APPS[0]);
                    }
                    setFrequentApps(filtered.slice(0, 5));
                } else {
                    setFrequentApps(ESSENTIAL_APPS.slice(0, 5));
                }
            })
            .catch(() => {
                setFrequentApps(ESSENTIAL_APPS.slice(0, 5));
            });
    };

    useEffect(() => {
        axios.get('/api/mini-apps')
            .then(res => {
                let list: MiniApp[] = [];
                if (res.data && res.data.success && Array.isArray(res.data.apps)) {
                    list = res.data.apps.filter((a: any) => a.status === 'active');
                }
                ESSENTIAL_APPS.forEach(essential => {
                    if (!list.some(a => a.slug === essential.slug)) {
                        if (essential.slug === 'image-resizer') {
                            list.unshift(essential);
                        } else {
                            list.push(essential);
                        }
                    }
                });
                setApps(list);
            })
            .catch(() => {
                setApps(ESSENTIAL_APPS);
            })
            .finally(() => setLoading(false));

        loadFrequentApps();
    }, []);

    useEffect(() => {
        const handleFocus = () => loadFrequentApps();
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    const nonGameApps = apps.filter(app => app.category !== 'game');

    const getCategoryCount = (catKey: string) => {
        if (catKey === 'all') return nonGameApps.length;
        return nonGameApps.filter(app => app.category === catKey).length;
    };

    const filteredApps = nonGameApps.filter(app => {
        const matchesCategory = selectedCategory === 'all' || app.category === selectedCategory;
        if (!matchesCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        const meta = getUtilityVisualMeta(app.slug, app.description);
        return (
            app.name.toLowerCase().includes(q) ||
            (app.description || '').toLowerCase().includes(q) ||
            meta.shortDesc.toLowerCase().includes(q) ||
            meta.categoryLabel.toLowerCase().includes(q) ||
            app.slug.toLowerCase().includes(q)
        );
    });

    // 이용 가이드 데이터 정의 (카테고리별 분류)
    const GUIDE_CARDS = [
        {
            slug: 'interest-calc',
            category: 'finance',
            icon: 'fas fa-piggy-bank',
            iconColor: 'text-cyan-500',
            title: '2026 예·적금 이자 & 비과세 비교 활용법',
            desc: '정기예금(거치식)과 정기적금(적립식)의 단리/월복리 이자를 정밀 산출합니다. 일반과세(15.4%), 세금우대(9.5%), 비과세(0%) 적용에 따른 최종 실수령액과 비과세 절세 차액을 원클릭 비교 차트로 확인하세요.'
        },
        {
            slug: 'severance-calc',
            category: 'finance',
            icon: 'fas fa-file-invoice-dollar',
            iconColor: 'text-blue-600',
            title: '2026 퇴직금 & 실업급여 계산기 활용법',
            desc: '고용노동부 최신 법정 산식에 맞춰 입사/퇴사일 및 최근 3개월 급여(상여금·연차수당 3/12 가산)로 1일 평균임금과 통상임금을 비교 산출합니다. 2026년 개정 소득세법 근속연수 공제가 반영된 세후 실수령 퇴직금과 함께, 연령·가입기간별 실업급여 소정급여일수(120~270일)와 2026년 상한액(66,000원)/하한액(64,192원)을 즉시 계산합니다.'
        },
        {
            slug: 'finance-dsr',
            category: 'finance',
            icon: 'fas fa-landmark',
            iconColor: 'text-indigo-600',
            title: '스트레스 DSR 대출 한도 & 원리금 계산기 활용법',
            desc: '연소득 대비 총부채원리금상환비율(DSR 40% 규제) 및 스트레스 금리 가산을 반영하여 최대 주택담보대출·신용대출 가능 한도와 월별 상환액을 정밀 시뮬레이션합니다.'
        },
        {
            slug: 'age-calc',
            category: 'calc',
            icon: 'fas fa-birthday-cake',
            iconColor: 'text-pink-500',
            title: '만 나이 계산 공식 및 규정',
            desc: '대한민국 행정·사법 기준인 \'만 나이\'는 태어난 날을 0세로 시작하여 매 생일마다 1살씩 더해집니다. 현재 연도에서 출생 연도를 뺀 후, 올해 생일이 지났다면 그 수치가 만 나이가 되며, 생일이 지나지 않았다면 1살을 더 차감하여 정확한 법적 나이를 산출합니다.'
        },
        {
            slug: 'pyeong-calc',
            category: 'calc',
            icon: 'fas fa-vector-square',
            iconColor: 'text-emerald-500',
            title: '부동산 평수 - 제곱미터(㎡) 환산법',
            desc: '1평은 약 3.305785㎡입니다. 제곱미터(㎡) 값을 평수로 변환할 때는 ㎡ ÷ 3.3058을 적용하며, 평수를 제곱미터로 바꿀 때는 평수 × 3.3058을 곱합니다. 아파트 분양 시 전용면적과 공급면적을 구분하여 계산하시면 더욱 정확합니다.'
        },
        {
            slug: 'dday-calc',
            category: 'calc',
            icon: 'fas fa-calendar-alt',
            iconColor: 'text-purple-500',
            title: 'D-Day 및 날짜 계산 원리',
            desc: 'D-Day 계산기는 시험, 연애 기념일, 출산 예정일, 군 전역일 등 중요한 날짜까지 남은 일수(D-) 또는 지난 일수(D+)를 계산합니다. 시작일 당일을 1일로 포함하는 기준과 포함하지 않는 기준을 모두 지원하여 상황에 맞게 정확한 일수를 확인할 수 있습니다.'
        },
        {
            slug: 'customs-calc',
            category: 'calc',
            icon: 'fas fa-plane-arrival',
            iconColor: 'text-indigo-600',
            title: '해외직구 관·부가세 면세 판별 및 세액 계산 가이드',
            desc: '미국 직구 목록통관 $200 이하, 일반국가(일본·유럽·중국) $150 이하 면세 기준을 실시간 외환 환율과 연계하여 즉시 판별합니다. 전자기기(0%), 의류(13%), 영양제(8%·일반통관 $150 강제) 등 11대 카테고리별 예상 관세와 부가세 10%를 원스톱 계산하세요.'
        },
        {
            slug: 'image-resizer',
            category: 'calc',
            icon: 'fas fa-crop-simple',
            iconColor: 'text-blue-500',
            title: '무손실 이미지 사이즈 및 포맷 변환기',
            desc: '고화질 사진과 캡처 이미지를 원하는 해상도(px, %)로 빠르고 손실 없이 리사이징하고, WebP, PNG, JPEG 형식으로 즉시 압축 변환합니다. 모든 처리가 브라우저 로컬에서 안전하게 수행되어 개인정보 유출 걱정 없이 이용할 수 있습니다.'
        },
        {
            slug: 'calculator',
            category: 'calc',
            icon: 'fas fa-calculator',
            iconColor: 'text-indigo-500',
            title: '다기능 스마트 계산기 활용법',
            desc: '일상적인 사칙연산뿐만 아니라 할인율(세일가) 계산, 백분율(%), 부가세(VAT), 비만도(BMI)까지 원스톱으로 지원합니다. 직관적인 키패드와 계산 기록 히스토리 저장 기능을 제공하여 복잡한 영수증 정산이나 쇼핑 시 유용하게 사용할 수 있습니다.'
        },
        {
            slug: 'text-checker',
            category: 'text',
            icon: 'fas fa-spell-check',
            iconColor: 'text-blue-500',
            title: '글자수 세기 & 자소서 검사 팁',
            desc: '자기소개서 및 공문서 작성 시 공백 포함 글자수와 공백 제외 글자수, 바이트(Byte) 수가 다르게 정해집니다. 한글은 1자당 2~3Byte, 영문·숫자·공백은 1자당 1Byte로 처리되므로 자소서 제출 전 VERA 글자수 검사기로 한도를 확인하세요.'
        },
        {
            slug: 'ocr',
            category: 'text',
            icon: 'fas fa-file-alt',
            iconColor: 'text-indigo-600',
            title: '브라우저 OCR 이미지 글자 추출기 활용법',
            desc: 'Tesseract.js WebAssembly를 통해 서버 전송 없이 100% 브라우저 로컬에서 사진·캡처 이미지 속 한글과 영어를 즉시 인식하여 텍스트 복사 및 .txt 다운로드를 지원합니다. 캡처 즉시 Ctrl+V로 붙여넣어 신속하게 변환하세요.'
        },
        {
            slug: 'json-formatter',
            category: 'dev',
            icon: 'fas fa-code',
            iconColor: 'text-cyan-600',
            title: 'Pro JSON 스튜디오 & 문법 검증',
            desc: '들여쓰기가 깨진 복잡한 JSON 데이터를 2스페이스/4스페이스로 깔끔하게 포매팅(Prettify)하고 문법 에러 위치를 실시간 검출합니다. 또한 공백을 제거하는 압축(Minify) 기능과 YAML, XML, CSV 상호 변환을 지원하여 개발 생산성을 높입니다.'
        },
        {
            slug: 'base64-converter',
            category: 'dev',
            icon: 'fas fa-exchange-alt',
            iconColor: 'text-amber-500',
            title: 'Base64 인코더 / 디코더 & JWT 분석',
            desc: '문자열 텍스트 및 이미지 파일을 안전하게 Base64 형식으로 인코딩하거나 역으로 디코딩합니다. 웹 개발 시 자주 사용되는 JWT(JSON Web Token) 페이로드 파싱 및 Base64 이미지 미리보기 기능을 100% 클라이언트 브라우저에서 안전하게 처리합니다.'
        },
        {
            slug: 'svg-converter',
            category: 'dev',
            icon: 'fas fa-bezier-curve',
            iconColor: 'text-rose-500',
            title: 'Vector Studio (이미지 to SVG 변환)',
            desc: '픽셀이 깨지는 비트맵 이미지(PNG, JPG, WEBP)를 확대해도 깨지지 않는 깨끗한 SVG 벡터 그래픽으로 실시간 변환합니다. 로고, 아이콘, 서명 이미지의 배경을 투명화하고 최적화된 SVG 코드 및 Data URI를 다운로드할 수 있습니다.'
        }
    ];

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: '예·적금 단리/복리 및 비과세 혜택 비교는 어떻게 되나요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: '정기예금(거치식)과 정기적금(적립식)의 단리/월복리 이자 산식을 지원하며, 일반과세(15.4%), 세금우대(9.5%), 비과세(0%) 적용에 따른 최종 실수령액과 비과세 절세 차액을 원클릭으로 비교해 드립니다.'
                }
            },
            {
                '@type': 'Question',
                name: '퇴직금 및 실업급여 계산은 최신 법령 기준인가요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: '네, 고용노동부 최신 근로기준법 및 고용보험법, 2026년 개정 소득세법 근속연수 공제율과 2026년 실업급여 1일 상한액(66,000원)·하한액(64,192원) 기준을 100% 실시간 적용하여 산출합니다.'
                }
            },
            {
                '@type': 'Question',
                name: '모든 생활 유틸리티 도구 이용료는 무료인가요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: '네, VERA에서 제공하는 계산기, 변환기, 글자수 세기 등 모든 유틸리티는 100% 무료이며 회원가입 없이 이용 가능합니다.'
                }
            },
            {
                '@type': 'Question',
                name: '모바일 스마트폰이나 태블릿에서도 사용 가능한가요?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'VERA의 모든 도구는 반응형 웹(Responsive Web)으로 디자인되어 PC, 스마트폰, 태블릿 모든 기기 화면에 맞춤 지원됩니다.'
                }
            }
        ]
    };

    const topSpotApp = frequentApps[0];
    const subSpotApps = frequentApps.slice(1, 5);

    return (
        <main className="flex-1 max-w-6xl mx-auto px-2 sm:px-4 py-6 sm:py-8 w-full space-y-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />

            {/* 1. 나노바나나 3D 히어로 배너 & 실시간 검색바 */}
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 text-white p-6 sm:p-8 shadow-xl border border-white/10">
                <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="w-full lg:max-w-xl space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                                <i className="fas fa-wand-magic-sparkles"></i> SMART LIFE HUB
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-slate-200 border border-white/10">
                                <i className="fas fa-shield-halved text-cyan-300"></i> 100% 무료 · 무설치
                            </span>
                        </div>

                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                                스마트 생활 유틸리티 허브
                            </h1>
                            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed">
                                일상 계산기, 2026 금융·세금 시뮬레이터, 로컬 AI 이미지·문서 변환 도구를 한곳에서 즉시 실행하세요.
                            </p>
                        </div>

                        {/* 실시간 검색창 */}
                        <div className="relative max-w-lg">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="도구 검색 (예: 평수, 퇴직금, 이미지 변환, 글자수, 관세...)"
                                className="w-full pl-10 pr-9 py-3 rounded-2xl bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder-slate-400 text-xs sm:text-sm font-medium border border-white/15 focus:border-emerald-400 outline-none transition-all shadow-inner"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="검색어 지우기"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-500/30 hover:bg-slate-500/50 text-xs flex items-center justify-center cursor-pointer"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 우측 나노바나나 3D 히어로 일러스트 */}
                    <div className="hidden sm:flex items-center justify-center shrink-0">
                        <div className="relative w-44 h-44 lg:w-52 lg:h-52 rounded-3xl bg-white/5 border border-white/15 backdrop-blur-md p-3 flex items-center justify-center shadow-2xl group">
                            <img
                                src={UTILITY_HERO_BANNER}
                                alt="스마트 생활 유틸리티 3D 일러스트"
                                className="w-full h-full object-contain drop-shadow-[0_12px_24px_rgba(16,185,129,0.35)] transition-transform duration-500 group-hover:scale-105"
                            />
                        </div>
                    </div>
                </div>
            </section>

            <Card className="p-4 sm:p-7 bg-white border border-slate-200/80 rounded-3xl shadow-sm space-y-8">
                {/* 2. 자주 쓰는 인기 도구 (Bento Spotlight Dock — 검색 중이 아닐 때 노출) */}
                {!loading && !searchQuery.trim() && topSpotApp && (
                    <div className="space-y-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xs shadow-2xs">
                                    <i className="fas fa-crown"></i>
                                </span>
                                <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                                    자주 쓰는 인기 도구 TOP 5
                                </h2>
                            </div>
                            <span className="text-[11px] font-semibold text-slate-400">
                                실시간 실행 빈도 기준
                            </span>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
                            {/* 좌측: BEST 1 대형 스포트라이트 카드 */}
                            {(() => {
                                const topMeta = getUtilityVisualMeta(topSpotApp.slug, topSpotApp.description);
                                return (
                                    <div
                                        onClick={() => handleLaunchUtility(topSpotApp)}
                                        className={`lg:col-span-5 relative overflow-hidden rounded-2xl bg-gradient-to-br ${topMeta.visualBg} border border-indigo-200/80 p-5 flex flex-col justify-between cursor-pointer group hover:shadow-lg transition-all duration-300`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1.5 z-10">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black shadow-2xs">
                                                    <i className="fas fa-trophy"></i> BEST 1 인기 도구
                                                </div>
                                                <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-700 transition-colors leading-snug">
                                                    {topSpotApp.name}
                                                </h3>
                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                    {topMeta.shortDesc}
                                                </p>
                                            </div>

                                            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                                                <img
                                                    src={topMeta.image}
                                                    alt={topSpotApp.name}
                                                    className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-slate-900/5 flex items-center justify-between gap-2">
                                            <div className="flex flex-wrap gap-1">
                                                {topMeta.highlights.slice(0, 2).map((h, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/80 text-slate-700 border border-slate-200/60"
                                                    >
                                                        #{h}
                                                    </span>
                                                ))}
                                            </div>
                                            <span className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black shadow-sm transition-all ${topMeta.buttonStyle}`}>
                                                <i className="fas fa-bolt text-[10px]"></i> 즉시 실행
                                            </span>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* 우측: TOP 2 ~ 5 가로형 글래스 독 카드 (2x2 그리드) */}
                            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {subSpotApps.map((app, idx) => {
                                    const meta = getUtilityVisualMeta(app.slug, app.description);
                                    const rank = idx + 2;
                                    return (
                                        <button
                                            key={`freq-${app.id}`}
                                            type="button"
                                            onClick={() => handleLaunchUtility(app)}
                                            className="text-left rounded-2xl bg-slate-50/90 hover:bg-white border border-slate-200/80 hover:border-indigo-300 p-3.5 flex items-center gap-3.5 group hover:shadow-md transition-all cursor-pointer"
                                        >
                                            <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.visualBg} border border-white shadow-xs flex items-center justify-center shrink-0 p-1.5`}>
                                                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                                                    {rank}
                                                </span>
                                                <img
                                                    src={meta.image}
                                                    alt={app.name}
                                                    className="w-full h-full object-contain drop-shadow-xs transition-transform duration-300 group-hover:scale-110"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                                                        {meta.categoryLabel}
                                                    </span>
                                                </div>
                                                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 truncate transition-colors">
                                                    {app.name}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                                    {meta.shortDesc}
                                                </p>
                                            </div>

                                            <div className="w-7 h-7 rounded-full bg-white group-hover:bg-indigo-600 text-slate-400 group-hover:text-white border border-slate-200 group-hover:border-indigo-600 flex items-center justify-center text-[10px] shrink-0 transition-all">
                                                <i className="fas fa-arrow-right"></i>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. 카테고리 필터 탭 & 도구 카운트 */}
                <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            {CATEGORIES.map(cat => {
                                const count = getCategoryCount(cat.key);
                                const isActive = selectedCategory === cat.key;
                                return (
                                    <button
                                        key={cat.key}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat.key)}
                                        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-extrabold transition-all border cursor-pointer ${
                                            isActive
                                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                                        }`}
                                    >
                                        <i className={`${cat.icon} ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}></i>
                                        <span>{cat.label}</span>
                                        <span
                                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                                                isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500 border border-slate-200'
                                            }`}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-xs font-semibold text-slate-400 shrink-0">
                            총 <strong className="text-slate-800 font-black">{filteredApps.length}</strong>개의 스마트 도구
                        </div>
                    </div>

                    {/* 4. 메인 나노바나나 3D 비주얼 카드 그리드 */}
                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse p-5 flex flex-col justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-200" />
                                        <div className="space-y-2 flex-1">
                                            <div className="w-20 h-4 bg-slate-200 rounded" />
                                            <div className="w-36 h-5 bg-slate-200 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-full h-9 bg-slate-200 rounded-xl" />
                                </div>
                            ))}
                        </div>
                    ) : filteredApps.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                            {filteredApps.map(app => {
                                const meta = getUtilityVisualMeta(app.slug, app.description);
                                return (
                                    <div
                                        key={app.id}
                                        onClick={() => handleLaunchUtility(app)}
                                        className={`group relative rounded-2xl bg-white border border-slate-200/90 ${meta.borderHover} hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-0.5`}
                                    >
                                        <div>
                                            {/* 상단 3D 비주얼 헤더 */}
                                            <div className={`relative bg-gradient-to-br ${meta.visualBg} px-5 pt-4 pb-3.5 border-b border-slate-100 flex items-center justify-between gap-3`}>
                                                <div className="space-y-1.5 min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/90 text-slate-700 border border-slate-200/70 shadow-2xs">
                                                            {meta.categoryLabel}
                                                        </span>
                                                        {meta.badge && (
                                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${meta.badgeStyle}`}>
                                                                {meta.badge}
                                                            </span>
                                                        )}
                                                        {app.require_auth === 1 && (
                                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 border border-amber-200">
                                                                <i className="fas fa-lock mr-1"></i>회원전용
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                                                        {app.name}
                                                    </h3>
                                                </div>

                                                {/* 나노바나나 3D 아이콘 */}
                                                <div className="w-16 h-16 sm:w-18 sm:h-18 shrink-0 flex items-center justify-center">
                                                    <img
                                                        src={meta.image}
                                                        alt={app.name}
                                                        className="w-full h-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                                                    />
                                                </div>
                                            </div>

                                            {/* 본문 설명 & 하이라이트 칩 */}
                                            <div className="p-4 sm:p-5 pb-3 space-y-3">
                                                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 min-h-[2.5rem]">
                                                    {meta.shortDesc}
                                                </p>

                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {meta.highlights.map((tag, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-[10px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md"
                                                        >
                                                            • {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 카드 하단 액션 버튼 & 가이드 링크 */}
                                        <div className="px-4 sm:px-5 pb-4 pt-2 flex items-center justify-between gap-2 border-t border-slate-100/80">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLaunchUtility(app);
                                                }}
                                                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer ${meta.buttonStyle}`}
                                            >
                                                <i className="fas fa-play text-[9px]"></i>
                                                <span>도구 실행</span>
                                            </button>

                                            {meta.guideSlug ? (
                                                <Link
                                                    href={`/tools/${meta.guideSlug}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[11px] font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors py-1 px-2 rounded-lg hover:bg-slate-50"
                                                >
                                                    <span>공식 · 활용 가이드</span>
                                                    <i className="fas fa-chevron-right text-[9px]"></i>
                                                </Link>
                                            ) : (
                                                <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                                    <i className="fas fa-bolt text-amber-400"></i> 즉시 실행
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-14 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                            <i className="fas fa-search text-3xl text-slate-300"></i>
                            <p className="text-sm font-bold text-slate-600">조건에 맞는 생활도구를 찾지 못했습니다.</p>
                            <p className="text-xs text-slate-400">다른 검색어를 입력하거나 [전체] 카테고리를 선택해 보세요.</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setSearchQuery('');
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition-all cursor-pointer"
                            >
                                전체 도구 보기
                            </button>
                        </div>
                    )}
                </div>
            </Card>

            {/* 고밀도 유틸리티 도구 상세 가이드 & FAQ */}
            <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-slate-700 space-y-8">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <i className="fas fa-info-circle text-blue-600"></i>
                            VERA 무료 생활 도구 & 계산기 이용 가이드
                        </h2>
                        {/* 이용 가이드 카테고리 필터 탭 */}
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
                                    <span>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        VERA 라이프 유틸리티는 일상생활과 재테크에서 매일 사용하는 다양한 계산기, 금융 도구, 단위 변환기, 텍스트 검사 도구를 별도의 회원가입이나 앱 설치 없이 브라우저에서 바로 사용할 수 있도록 제공합니다.
                    </p>
                </div>

                {/* 카테고리 필터가 적용된 가이드 카드 그리드 (SSR 크롤러를 위해 전체 카드 상시 DOM 렌더링 후 비활성 카테고리만 hidden 처리) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {GUIDE_CARDS.map((guide, idx) => {
                        const isVisible = selectedGuideCategory === 'all' || guide.category === selectedGuideCategory;
                        return (
                            <Link
                                key={idx}
                                href={`/tools/${guide.slug}`}
                                className={`${isVisible ? 'block' : 'hidden'} bg-slate-50 hover:bg-blue-50/50 p-5 rounded-2xl border border-slate-200/80 hover:border-blue-200 transition-all space-y-2 group`}
                            >
                                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 text-sm sm:text-base flex items-center justify-between gap-2 transition-colors">
                                    <span className="flex items-center gap-2">
                                        <i className={`${guide.icon} ${guide.iconColor}`}></i> {guide.title}
                                    </span>
                                    <i className="fas fa-arrow-right text-xs text-slate-400 group-hover:text-blue-600 transition-colors"></i>
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {guide.desc}
                                </p>
                            </Link>
                        );
                    })}
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-3">자주 묻는 질문 (FAQ)</h3>
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

            {/* 즐겨찾기 넛지 배너 */}
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

            <SoftLockModal
                isOpen={showSoftLock}
                onClose={() => setShowSoftLock(false)}
                type="calc"
            />
        </main>
    );
}
