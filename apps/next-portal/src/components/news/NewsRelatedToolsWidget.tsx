'use client';

import React from 'react';
import Link from 'next/link';

interface ToolItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    iconColor: string;
    iconBg: string;
    path: string;
    ctaText: string;
    badge: string;
}

interface NewsRelatedToolsWidgetProps {
    title: string;
    category?: string;
    content?: string;
}

export function NewsRelatedToolsWidget({
    title,
    category = '',
    content = '',
}: NewsRelatedToolsWidgetProps) {
    const fullText = `${title} ${category} ${content}`.toLowerCase();

    const getRecommendedTools = (): ToolItem[] => {
        const tools: ToolItem[] = [];

        // 1. 평수 계산기 (부동산/아파트/청약/주택/전세)
        const realEstateKeywords = [
            '부동산', '아파트', '분양', '청약', '전세', '월세', '집값', '주택', '건설',
            '재개발', '재건축', '오피스텔', '평수', '제곱미터', '전용면적', '공급면적',
            '매매', '원룸', '단독주택', '시세'
        ];
        if (realEstateKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'pyeong-calc',
                name: '아파트·부동산 평수 계산기',
                description: '㎡ ↔ 평 양방향 정밀 환산 및 실면적 아파트 공급평형 즉시 확인',
                icon: 'fa-ruler-combined',
                iconColor: 'text-amber-600',
                iconBg: 'bg-amber-50 border-amber-200',
                path: '/tools/pyeong-calc',
                ctaText: '평수 계산',
                badge: '부동산 필수',
            });
        }

        // 2. 퇴직금 & 연봉 계산기 (근로/임금/퇴직/고용/세금/경제)
        const jobKeywords = [
            '퇴직금', '퇴직', '정년', '임금', '월급', '연봉', '급여', '실업급여', '해고',
            '근로', '노동', '인상', '보너스', '수당', '성과급', '근로기준법', '연말정산',
            '소득세', '고용', '취업'
        ];
        if (jobKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'severance-calc',
                name: '법정 퇴직금 & 급여 계산기',
                description: '고용노동부 기준 3개월 평균임금 및 통상임금 기반 퇴직금 모의 산정',
                icon: 'fa-sack-dollar',
                iconColor: 'text-green-600',
                iconBg: 'bg-green-50 border-green-200',
                path: '/tools/severance-calc',
                ctaText: '퇴직금 계산',
                badge: '직장인 추천',
            });
        }

        // 3. 만 나이 계산기 (연령/나이/생일/복지/청년/아동)
        const ageKeywords = [
            '만 나이', '나이', '생일', '청년', '노인', '고령', '어린이', '유아', '청소년',
            '정년', '연금', '국민연금', '입학', '선거권', '군대', '입대', '징집', '복지 혜택'
        ];
        if (ageKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'age-calc',
                name: '한국 공통 만 나이 계산기',
                description: '만 나이, 연 나이, 띠, 생애주기별 법정 복지 혜택 자격 조회',
                icon: 'fa-cake-candles',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50 border-blue-200',
                path: '/tools/age-calc',
                ctaText: '만 나이 확인',
                badge: '법정 기준',
            });
        }

        // 4. 감성 D-Day 매니저 (일정/마감/접수/시험/신청)
        const ddayKeywords = [
            '신청 마감', '모집 기간', '접수 마감', '마감일', '디데이', 'd-day', '개막',
            '만기일', '원서 접수', '시험일', '일정', '발표일', '공휴일', '연휴'
        ];
        if (ddayKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'dday-calc',
                name: '스마트 D-Day 매니저',
                description: '정책 신청 마감일, 시험·입학 및 중요 일정 D-Day 관리',
                icon: 'fa-calendar-check',
                iconColor: 'text-rose-600',
                iconBg: 'bg-rose-50 border-rose-200',
                path: '/app/dday-calc/',
                ctaText: 'D-Day 등록',
                badge: '일정 관리',
            });
        }

        // 5. 글자수 세기 & 맞춤법 교정기 (문서/자소서/글/원고)
        const textCheckerKeywords = [
            '글자수', '자소서', '자기소개서', '맞춤법', '원고료', '원고지', '띄어쓰기', '문서',
            '보고서', '서류'
        ];
        if (textCheckerKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'text-checker',
                name: '글자수 세기 & 맞춤법 교정기',
                description: '공백 포함/제외 글자수 실시간 계산 및 띄어쓰기 철자 교정',
                icon: 'fa-spell-check',
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50 border-emerald-200',
                path: '/tools/text-checker',
                ctaText: '맞춤법 검사',
                badge: '문서 작성',
            });
        }

        // 6. JSON 포맷터 & 데이터 변환기 (IT/API/데이터/소프트웨어)
        const itKeywords = ['json', 'api', '데이터 포맷', '파싱', 'rest api', '데이터셋', '개발자', '코드'];
        if (itKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'json-formatter',
                name: 'JSON 포맷터 & 변환기',
                description: 'JSON 데이터 구조 정렬 및 문법 오류 실시간 자동 검증',
                icon: 'fa-code',
                iconColor: 'text-cyan-600',
                iconBg: 'bg-cyan-50 border-cyan-200',
                path: '/tools/json-formatter',
                ctaText: 'JSON 정렬',
                badge: '개발 도구',
            });
        }

        // 7. Base64 인코더/디코더
        const encodingKeywords = ['base64', '인코딩', '디코딩', '암호화', '바이트', '인코드'];
        if (encodingKeywords.some((kw) => fullText.includes(kw))) {
            tools.push({
                id: 'base64-converter',
                name: 'Base64 변환기',
                description: '텍스트·이미지 데이터의 안전한 Base64 인코딩 및 디코딩',
                icon: 'fa-file-code',
                iconColor: 'text-indigo-600',
                iconBg: 'bg-indigo-50 border-indigo-200',
                path: '/tools/base64-converter',
                ctaText: '변환하기',
                badge: '인코딩',
            });
        }

        // 매칭된 도구가 1개 이하일 경우 기본 인기 생활도구 보강 (평수 계산기 또는 만 나이 계산기)
        if (tools.length === 0) {
            tools.push({
                id: 'pyeong-calc',
                name: '아파트·부동산 평수 계산기',
                description: '㎡ ↔ 평 양방향 정밀 환산 및 아파트 전용/공급면적 즉시 확인',
                icon: 'fa-ruler-combined',
                iconColor: 'text-amber-600',
                iconBg: 'bg-amber-50 border-amber-200',
                path: '/tools/pyeong-calc',
                ctaText: '평수 계산',
                badge: '인기 도구',
            });
            tools.push({
                id: 'age-calc',
                name: '한국 공통 만 나이 계산기',
                description: '만 나이, 연 나이 및 생애주기별 법적 권리/혜택 원클릭 조회',
                icon: 'fa-cake-candles',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50 border-blue-200',
                path: '/tools/age-calc',
                ctaText: '나이 확인',
                badge: '생활 필수',
            });
        } else if (tools.length === 1) {
            if (tools[0].id !== 'age-calc') {
                tools.push({
                    id: 'age-calc',
                    name: '한국 공통 만 나이 계산기',
                    description: '만 나이, 연 나이 및 생애주기별 법정 복지 혜택 자격 조회',
                    icon: 'fa-cake-candles',
                    iconColor: 'text-blue-600',
                    iconBg: 'bg-blue-50 border-blue-200',
                    path: '/tools/age-calc',
                    ctaText: '나이 확인',
                    badge: '생활 필수',
                });
            } else {
                tools.push({
                    id: 'pyeong-calc',
                    name: '아파트·부동산 평수 계산기',
                    description: '㎡ ↔ 평 양방향 정밀 환산 및 실면적 아파트 공급평형 즉시 확인',
                    icon: 'fa-ruler-combined',
                    iconColor: 'text-amber-600',
                    iconBg: 'bg-amber-50 border-amber-200',
                    path: '/tools/pyeong-calc',
                    ctaText: '평수 계산',
                    badge: '인기 도구',
                });
            }
        }

        return tools.slice(0, 2);
    };

    const recommendedTools = getRecommendedTools();

    return (
        <section
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs my-6"
            aria-label="기사 연관 추천 도구"
        >
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                        <i className="fas fa-screwdriver-wrench"></i>
                    </span>
                    <h2 className="text-base font-black text-slate-900">
                        기사 연계 맞춤 생활도구
                    </h2>
                </div>
                <Link
                    href="/lifestyle"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                >
                    <span>전체 도구 보기</span>
                    <i className="fas fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
                </Link>
            </div>

            {/* 도구 카드 리스트 */}
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {recommendedTools.map((tool) => (
                    <Link
                        key={tool.id}
                        href={tool.path}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 hover:bg-blue-50/50 border border-slate-200/70 hover:border-blue-300 transition-all group text-left w-full shadow-2xs hover:shadow-xs"
                    >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div
                                className={`w-10 h-10 rounded-xl ${tool.iconBg} border flex items-center justify-center ${tool.iconColor} shrink-0 text-base shadow-2xs group-hover:scale-105 transition-transform`}
                            >
                                <i className={`fas ${tool.icon}`}></i>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                        {tool.name}
                                    </h3>
                                    <span className="text-[10px] font-extrabold text-blue-700 bg-white px-1.5 py-0.2 rounded border border-blue-100 shrink-0">
                                        {tool.badge}
                                    </span>
                                </div>
                                <p className="text-[11px] sm:text-xs text-slate-500 truncate font-medium">
                                    {tool.description}
                                </p>
                            </div>
                        </div>

                        <span className="shrink-0 px-3 py-1.5 bg-white group-hover:bg-blue-600 text-slate-700 group-hover:text-white border border-slate-200 group-hover:border-blue-600 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs">
                            <span>{tool.ctaText}</span>
                            <i className="fas fa-arrow-right text-[9px]"></i>
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}

export default NewsRelatedToolsWidget;
