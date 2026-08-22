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

export function NewsRelatedToolsWidget({ title, category = '', content = '' }: NewsRelatedToolsWidgetProps) {
    const fullText = `${title} ${category} ${content}`.toLowerCase();

    // 키워드 기반 연관 도구 추천 매핑
    const getRecommendedTools = (): ToolItem[] => {
        // 1. 부동산 관련 키워드
        if (fullText.includes('부동산') || fullText.includes('아파트') || fullText.includes('분양') || fullText.includes('청약') || fullText.includes('전세') || fullText.includes('평형') || fullText.includes('집값') || fullText.includes('건설') || fullText.includes('재건축')) {
            return [
                {
                    id: 'pyeong-calc',
                    name: '부동산 평수 계산기',
                    description: '전용 59㎡·84㎡ 평수 환산 및 평당가 즉시 계산',
                    icon: 'fa-home',
                    iconColor: 'text-purple-600',
                    iconBg: 'bg-purple-50 border-purple-100',
                    path: '/app/pyeong-calc/',
                    ctaText: '평수 환산',
                    badge: '부동산'
                },
                {
                    id: 'calculator',
                    name: '스마트 대출이자 계산기',
                    description: '주담대·전세대출 월 상환액과 총 이자 시뮬레이션',
                    icon: 'fa-calculator',
                    iconColor: 'text-blue-600',
                    iconBg: 'bg-blue-50 border-blue-100',
                    path: '/app/calculator/',
                    ctaText: '이자 계산',
                    badge: '금융'
                }
            ];
        }

        // 2. 금융/금리/투자 관련 키워드
        if (fullText.includes('금리') || fullText.includes('대출') || fullText.includes('은행') || fullText.includes('환율') || fullText.includes('주식') || fullText.includes('증시') || fullText.includes('코스피') || fullText.includes('비트코인') || fullText.includes('이자') || fullText.includes('세금') || fullText.includes('금융')) {
            return [
                {
                    id: 'calculator',
                    name: '스마트 다기능 계산기',
                    description: '복리 수익률, 대출 상환액, 백분율 증감률 연산',
                    icon: 'fa-calculator',
                    iconColor: 'text-emerald-600',
                    iconBg: 'bg-emerald-50 border-emerald-100',
                    path: '/app/calculator/',
                    ctaText: '계산하기',
                    badge: '금융/투자'
                },
                {
                    id: 'dday-calc',
                    name: '감성 D-Day 매니저',
                    description: '적금 만기일, 정책 신청 마감일까지 남은 일수 관리',
                    icon: 'fa-calendar-check',
                    iconColor: 'text-pink-600',
                    iconBg: 'bg-pink-50 border-pink-100',
                    path: '/app/dday-calc/',
                    ctaText: 'D-Day 등록',
                    badge: '일정 관리'
                }
            ];
        }

        // 3. 연령/청년/복지/취업 관련 키워드
        if (fullText.includes('청년') || fullText.includes('지원금') || fullText.includes('나이') || fullText.includes('연금') || fullText.includes('복지') || fullText.includes('입학') || fullText.includes('군대') || fullText.includes('생일')) {
            return [
                {
                    id: 'age-calc',
                    name: '한국 나이 계산기',
                    description: '만 나이 기준 내 법적 권리 및 복지 혜택 조회',
                    icon: 'fa-cake-candles',
                    iconColor: 'text-blue-600',
                    iconBg: 'bg-blue-50 border-blue-100',
                    path: '/app/age-calc/',
                    ctaText: '나이 확인',
                    badge: '만 나이'
                },
                {
                    id: 'dday-calc',
                    name: '감성 D-Day 매니저',
                    description: '정책 신청 마감일, 시험·입학 D-Day 일정 관리',
                    icon: 'fa-calendar-check',
                    iconColor: 'text-purple-600',
                    iconBg: 'bg-purple-50 border-purple-100',
                    path: '/app/dday-calc/',
                    ctaText: '일정 등록',
                    badge: 'D-Day'
                }
            ];
        }

        // 4. IT/개발/데이터 관련 키워드
        if (fullText.includes('it') || fullText.includes('ai') || fullText.includes('데이터') || fullText.includes('개발') || fullText.includes('소프트웨어') || fullText.includes('코드') || fullText.includes('보안')) {
            return [
                {
                    id: 'json-formatter',
                    name: 'JSON 포맷터 & 검증기',
                    description: 'JSON 데이터 구조 정렬 및 문법 오류 실시간 검증',
                    icon: 'fa-code',
                    iconColor: 'text-cyan-600',
                    iconBg: 'bg-cyan-50 border-cyan-100',
                    path: '/app/json-formatter/',
                    ctaText: 'JSON 정렬',
                    badge: '개발 도구'
                },
                {
                    id: 'base64-converter',
                    name: 'Base64 변환기',
                    description: '텍스트·이미지 Base64 안전 인코딩/디코딩',
                    icon: 'fa-file-code',
                    iconColor: 'text-indigo-600',
                    iconBg: 'bg-indigo-50 border-indigo-100',
                    path: '/app/base64-converter/',
                    ctaText: '변환하기',
                    badge: '인코딩'
                }
            ];
        }

        // 5. 기본 폴백
        return [
            {
                id: 'calculator',
                name: '스마트 다기능 계산기',
                description: '기본 연산부터 대출, 단위 변환까지 즉시 계산',
                icon: 'fa-calculator',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50 border-blue-100',
                path: '/app/calculator/',
                ctaText: '계산기 열기',
                badge: '유틸리티'
            },
            {
                id: 'text-checker',
                name: '글자수 세기 & 맞춤법',
                description: '실시간 글자수 계산과 한국어 띄어쓰기 철자 교정',
                icon: 'fa-spell-check',
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50 border-emerald-100',
                path: '/app/text-checker/',
                ctaText: '맞춤법 검사',
                badge: '문서 작성'
            }
        ];
    };

    const recommendedTools = getRecommendedTools();

    return (
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs my-4" aria-label="기사 연관 추천 도구">
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3.5">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs">
                        <i className="fas fa-tools"></i>
                    </span>
                    <h2 className="text-sm font-bold text-gray-800">
                        기사 관련 추천 도구
                    </h2>
                </div>
                <span className="text-[11px] text-gray-400 font-medium">
                    무료 온라인 도구
                </span>
            </div>

            {/* 도구 2개 컴팩트 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedTools.map((tool) => (
                    <a
                        key={tool.id}
                        href={tool.path}
                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50/70 hover:bg-blue-50/40 border border-gray-200/60 hover:border-blue-200 transition-all group"
                    >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                            <div className={`w-9 h-9 rounded-xl ${tool.iconBg} border flex items-center justify-center ${tool.iconColor} shrink-0 text-sm`}>
                                <i className={`fas ${tool.icon}`}></i>
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <h3 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                        {tool.name}
                                    </h3>
                                    <span className="text-[9px] font-semibold text-gray-400 bg-white px-1.5 py-0.2 rounded border border-gray-100 shrink-0">
                                        {tool.badge}
                                    </span>
                                </div>
                                <p className="text-[11px] text-gray-500 truncate">
                                    {tool.description}
                                </p>
                            </div>
                        </div>

                        <span className="shrink-0 px-2.5 py-1 bg-white group-hover:bg-blue-600 text-gray-600 group-hover:text-white border border-gray-200 group-hover:border-blue-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs">
                            <span>{tool.ctaText}</span>
                            <i className="fas fa-chevron-right text-[8px]"></i>
                        </span>
                    </a>
                ))}
            </div>
        </section>
    );
}

export default NewsRelatedToolsWidget;
