interface NewsInsightWidgetProps {
    title: string;
    category?: string;
    summaryLines?: string[];
    content?: string;
}

export function NewsInsightWidget({ title, category = '', summaryLines = [], content = '' }: NewsInsightWidgetProps) {
    // 텍스트 기반 인사이트 분석 로직
    const fullText = `${title} ${category} ${summaryLines.join(' ')} ${content}`.toLowerCase();

    // 카테고리 및 키워드 기반 인사이트 생성
    const getAnalysis = () => {
        if (fullText.includes('부동산') || fullText.includes('아파트') || fullText.includes('분양') || fullText.includes('청약') || fullText.includes('전세') || fullText.includes('집값')) {
            return {
                badge: '부동산 시장 진단',
                badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                impact: '주거 비용 및 자산 가치에 직접적인 영향을 미칠 수 있습니다. 대출 금리 추이와 실면적(전용면적 ㎡ vs 공급평형)을 면밀히 비교 검토하는 것이 유리합니다.',
                action: '관련 매물의 전용면적 평수 환산 및 대출 원리금 상환 계획을 시뮬레이션해 보세요.'
            };
        }
        if (fullText.includes('금리') || fullText.includes('대출') || fullText.includes('은행') || fullText.includes('환율') || fullText.includes('주식') || fullText.includes('증시') || fullText.includes('코스피') || fullText.includes('비트코인')) {
            return {
                badge: '금융·자산 영향 분석',
                badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
                impact: '이자 부담 및 환차손익, 투자 수익률 변동성이 확대되는 구간입니다. 고정금리/변동금리 비중 조절과 자산 포트폴리오 다변화가 필요합니다.',
                action: '현재 보유 대출의 이자 부담액을 재계산하고 현금 유동성 지표를 점검하세요.'
            };
        }
        if (fullText.includes('일자리') || fullText.includes('채용') || fullText.includes('취업') || fullText.includes('자소서') || fullText.includes('청년') || fullText.includes('지원금') || fullText.includes('연금') || fullText.includes('나이')) {
            return {
                badge: '생애·복지 가이드',
                badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
                impact: '연령별 법정 지원 자격(만 나이 기준)과 정책 혜택 수혜 조건이 변동될 수 있습니다.',
                action: '법적 만 나이 기준을 확인하고 지원 신청 마감일까지의 D-Day 일정을 관리하세요.'
            };
        }
        if (fullText.includes('it') || fullText.includes('ai') || fullText.includes('기술') || fullText.includes('소프트웨어') || fullText.includes('반도체') || fullText.includes('인공지능')) {
            return {
                badge: '테크 & 생산성 브리핑',
                badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                impact: '디지털 업무 환경과 산업 생산성에 혁신적인 변화가 가속화되고 있습니다.',
                action: '온라인 생산성 유틸리티 도구를 활용해 업무 효율을 한 단계 높여보세요.'
            };
        }
        return {
            badge: '핵심 트렌드 브리핑',
            badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
            impact: '사회·경제 전반에 걸친 주요 지표 변동 및 제도적 변화를 주의 깊게 모니터링할 필요가 있습니다.',
            action: '관련 데이터와 핵심 지표를 확인하고 신속한 의사결정에 대비하세요.'
        };
    };

    const analysis = getAnalysis();

    // 3줄 핵심 요약 추출 (전달된 요약문 또는 생성)
    const bullets = summaryLines.length >= 2 
        ? summaryLines.slice(0, 3) 
        : [
            title,
            '주요 핵심 지표와 정책 변동 사항이 시장 참여자들의 이목을 집중시키고 있습니다.',
            '향후 관련 업계 및 개인 생활에 미치는 파급 효과를 예의주시할 필요가 있습니다.'
        ];

    return (
        <aside className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-5 sm:p-6 mb-6 animate-fadeIn" aria-label="기사 핵심 요약 및 영향 분석">
            {/* 상단 뱃지 & 헤더 */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-green animate-pulse"></span>
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                        <i className="fas fa-bolt text-amber-500"></i>
                        <span>AI 핵심 요약 &amp; 실생활 영향 분석</span>
                    </h2>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${analysis.badgeColor}`}>
                    {analysis.badge}
                </span>
            </div>

            {/* 1. 3줄 핵심 팩트 요약 */}
            <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <i className="fas fa-list-check text-blue-500"></i> 1분 팩트 체크
                </h3>
                <ul className="space-y-2">
                    {bullets.map((b, idx) => (
                        <li key={idx} className="text-sm text-gray-700 leading-relaxed flex items-start gap-2.5 bg-gray-50/70 p-2.5 rounded-xl border border-gray-100/60">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-white text-blue-600 font-black text-xs flex items-center justify-center shadow-xs border border-gray-100">
                                {idx + 1}
                            </span>
                            <span className="pt-0.5 break-keep">{b}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* 2. 내 지갑 / 실생활 파급 효과 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                <div className="bg-amber-50/50 rounded-xl p-3.5 border border-amber-100/60">
                    <div className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                        <i className="fas fa-wallet text-amber-600"></i>
                        <span>내 지갑 &amp; 일상 파급 영향</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed break-keep">
                        {analysis.impact}
                    </p>
                </div>

                <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/60">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                        <i className="fas fa-lightbulb text-emerald-600"></i>
                        <span>지금 바로 실천할 액션 팁</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed break-keep">
                        {analysis.action}
                    </p>
                </div>
            </div>
        </aside>
    );
}

export default NewsInsightWidget;
