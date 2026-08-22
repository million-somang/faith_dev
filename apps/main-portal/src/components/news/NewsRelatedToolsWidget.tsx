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

    // 키워드 정밀 매칭을 통한 연관 도구 추출 (억지 기본값 없음)
    const getRecommendedTools = (): ToolItem[] => {
        const tools: ToolItem[] = [];

        // 1. 부동산 평수 계산기
        const realEstateKeywords = ['부동산', '아파트', '분양', '청약', '전세', '월세', '평형', '평수', '㎡', '재개발', '재건축', '집값', '매매가', '건설사', '오피스텔'];
        if (realEstateKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'pyeong-calc',
                name: '부동산 평수 계산기',
                description: '전용 59㎡·84㎡ 평수 환산 및 평당가 즉시 계산',
                icon: 'fa-home',
                iconColor: 'text-purple-600',
                iconBg: 'bg-purple-50 border-purple-100',
                path: '/app/pyeong-calc/',
                ctaText: '평수 환산',
                badge: '부동산'
            });
        }

        // 2. 금융/대출 계산기
        const financeKeywords = ['대출', '금리', '이자', '주담대', '기준금리', '환율', '주식', '증시', '코스피', '코스닥', '비트코인', '가상자산', '적금', '예금', '세금', '연봉', '환전'];
        if (financeKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'calculator',
                name: '스마트 금융/대출 계산기',
                description: '복리 수익률, 대출 상환액, 백분율 증감률 연산',
                icon: 'fa-calculator',
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50 border-emerald-100',
                path: '/app/calculator/',
                ctaText: '계산하기',
                badge: '금융/투자'
            });
        }

        // 3. 한국 나이 계산기
        const ageKeywords = ['만 나이', '청년', '정년', '연령', '노인', '기초연금', '국민연금', '입학', '군대', '병역', '생일', '복지 혜택'];
        if (ageKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'age-calc',
                name: '한국 나이 계산기',
                description: '만 나이 기준 내 법적 권리 및 복지 혜택 조회',
                icon: 'fa-cake-candles',
                iconColor: 'text-blue-600',
                iconBg: 'bg-blue-50 border-blue-100',
                path: '/app/age-calc/',
                ctaText: '나이 확인',
                badge: '만 나이'
            });
        }

        // 4. 감성 D-Day 매니저
        const ddayKeywords = ['신청 마감', '모집 기간', '접수 마감', '마감일', '디데이', 'd-day', '개막', '만기일', '원서 접수', '시험일', '일정'];
        if (ddayKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'dday-calc',
                name: '감성 D-Day 매니저',
                description: '정책 신청 마감일, 시험·입학 D-Day 일정 관리',
                icon: 'fa-calendar-check',
                iconColor: 'text-pink-600',
                iconBg: 'bg-pink-50 border-pink-100',
                path: '/app/dday-calc/',
                ctaText: 'D-Day 등록',
                badge: '일정 관리'
            });
        }

        // 5. JSON 포맷터 & 검증기
        const itKeywords = ['json', 'api', '데이터 포맷', '파싱', 'rest api', '데이터셋', '개발자'];
        if (itKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'json-formatter',
                name: 'JSON 포맷터 & 검증기',
                description: 'JSON 데이터 구조 정렬 및 문법 오류 실시간 검증',
                icon: 'fa-code',
                iconColor: 'text-cyan-600',
                iconBg: 'bg-cyan-50 border-cyan-100',
                path: '/app/json-formatter/',
                ctaText: 'JSON 정렬',
                badge: '개발 도구'
            });
        }

        // 6. Base64 변환기
        const encodingKeywords = ['base64', '인코딩', '디코딩', '암호화', '바이트', '인코드'];
        if (encodingKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'base64-converter',
                name: 'Base64 변환기',
                description: '텍스트·이미지 Base64 안전 인코딩/디코딩',
                icon: 'fa-file-code',
                iconColor: 'text-indigo-600',
                iconBg: 'bg-indigo-50 border-indigo-100',
                path: '/app/base64-converter/',
                ctaText: '변환하기',
                badge: '인코딩'
            });
        }

        // 7. 글자수 세기 & 맞춤법
        const textCheckerKeywords = ['글자수', '자소서', '자기소개서', '맞춤법', '원고료', '원고지', '띄어쓰기'];
        if (textCheckerKeywords.some(kw => fullText.includes(kw))) {
            tools.push({
                id: 'text-checker',
                name: '글자수 세기 & 맞춤법',
                description: '실시간 글자수 계산과 한국어 띄어쓰기 철자 교정',
                icon: 'fa-spell-check',
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50 border-emerald-100',
                path: '/app/text-checker/',
                ctaText: '맞춤법 검사',
                badge: '문서 작성'
            });
        }

        // 최대 2개까지만 반환 (매칭된 것이 없으면 빈 배열)
        return tools.slice(0, 2);
    };

    const recommendedTools = getRecommendedTools();

    return (
        <section className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs my-3" aria-label="기사 연관 추천 도구">
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

            {/* 도구가 없을 때 / 1개일 때 / 2개일 때 유연한 렌더링 */}
            {recommendedTools.length === 0 ? (
                <div className="py-3 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-info-circle text-gray-400"></i>
                        <span>이 기사와 직접 연관된 계산/변환 도구가 없습니다.</span>
                    </div>
                    <a
                        href="/apps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 font-semibold flex items-center gap-1 text-[11px]"
                    >
                        <span>전체 도구 보기</span>
                        <i className="fas fa-arrow-up-right-from-square text-[9px]"></i>
                    </a>
                </div>
            ) : (
                <div className={`grid gap-3 ${recommendedTools.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    {recommendedTools.map((tool) => (
                        <a
                            key={tool.id}
                            href={tool.path}
                            target="_blank"
                            rel="noopener noreferrer"
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

                            <span className="shrink-0 px-2.5 py-1 bg-white group-hover:bg-blue-600 text-gray-600 group-hover:text-white border border-gray-200 group-hover:border-blue-600 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-2xs">
                                <span>{tool.ctaText}</span>
                                <i className="fas fa-arrow-up-right-from-square text-[9px]"></i>
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </section>
    );
}

export default NewsRelatedToolsWidget;
