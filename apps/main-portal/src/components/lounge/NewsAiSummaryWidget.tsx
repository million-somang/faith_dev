import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface NewsAiSummaryWidgetProps {
    url: string;
}

interface NewsSummaryData {
    id: number;
    title: string;
    source: string;
    bullets: string[];
    sentiment: 'good' | 'bad' | 'neutral';
    sentimentScore: number;
}

export function NewsAiSummaryWidget({ url }: NewsAiSummaryWidgetProps) {
    const navigate = useNavigate();
    const [news, setNews] = useState<NewsSummaryData | null>(null);

    // 결정론적 모킹 요약 데이터 매핑
    useEffect(() => {
        let title = '글로벌 반도체 공급망 개편 속 엔비디아 사상 최대 주가 돌파';
        let source = 'VERA IT 뉴스';
        let bullets = [
            '엔비디아의 차세대 AI 가속기 칩 수요가 전년 동기 대비 250% 폭증하며 품귀 현상 지속.',
            '대만 파운드리 TSMC의 첨단 패키징 라인 증설 일정이 앞당겨져 내년 상반기 병목 완전 해소 전망.',
            '글로벌 투자은행들이 일제히 엔비디아의 목표 주가를 상향하며 호재성 리포트가 지배적으로 작용.'
        ];
        let sentiment: 'good' | 'bad' | 'neutral' = 'good';
        let sentimentScore = 88;
        let id = 1;

        if (url.includes('rate') || url.includes('interest') || url.includes('fed')) {
            title = '미 연준 연내 기준금리 인하 기조 공식 발표, 연 3회 인하 신호탄';
            source = 'VERA 거시금융 뉴스';
            bullets = [
                '제롬 파월 연준 의장이 공식 기자회견에서 인플레이션 둔화 추세를 명확히 인정함.',
                '연방기금금리 선물 시장에서는 9월 첫 금리 인하 확률을 85% 이상으로 대폭 선반영.',
                '글로벌 리스크 자산(비트코인, 주식) 시장에 강한 유동성 유입 흐름이 관측되며 급등세 동조.'
            ];
            sentiment = 'good';
            sentimentScore = 92;
            id = 2;
        } else if (url.includes('china') || url.includes('tariff') || url.includes('trade')) {
            title = '글로벌 무역 분쟁 2차 격돌, 대중국 고율 관세 부과 리스크 발발';
            source = 'VERA 국제경제 뉴스';
            bullets = [
                '정부가 이차전지 원자재 및 친환경 품목에 대해 최대 45%의 특별 추가 관세를 예고함.',
                '원자재 공급 다변화에 시일이 걸리는 국내 중소 제조업체들의 영업이익률 비상등.',
                '중국 상무부 역시 즉각적인 보복 성격의 무역 조치를 맞대응 발표하여 증시 불안 가중.'
            ];
            sentiment = 'bad';
            sentimentScore = 76;
            id = 3;
        } else if (url.includes('samsung') || url.includes('hbm')) {
            title = '삼성전자 HBM3E 엔비디아 품질 검증 완료 임박, 공급 계약 성사 국면';
            source = 'VERA 테크 뉴스';
            bullets = [
                '테스트 최종 승인 절차가 완료 단계에 접어들며 이르면 3분기 말 양산 물량 인도 개시.',
                'HBM 공급선 다변화로 엔비디아 역시 단가 네고에서 유리한 입지를 다지기 위해 서두르는 양상.',
                '국내 반도체 장비 밸류체인 소부장 기업들의 동반 매출 상승에 따른 실적 턴어라운드 기대.'
            ];
            sentiment = 'good';
            sentimentScore = 84;
            id = 4;
        } else {
            let hash = 0;
            for (let i = 0; i < url.length; i++) {
                hash = url.charCodeAt(i) + ((hash << 5) - hash);
            }
            const seed = Math.abs(hash);
            id = (seed % 10) + 1;
            sentiment = (seed % 3) === 0 ? 'good' : (seed % 3) === 1 ? 'bad' : 'neutral';
            sentimentScore = 60 + (seed % 35);
            title = `실시간 시황 브리핑: 종합 경제 변동 지표 분석 보고서`;
            bullets = [
                'VERA AI 여론 모니터링 엔진이 실시간으로 수집한 핫 이슈 스냅샷 분석 결과입니다.',
                '지표 요약: 현재 해당 이슈는 글로벌 거시 변동성과 결합하여 활발한 매물대 이동을 유발 중.',
                '의견 취합: 단기 충격파는 크지 않으나 장기 투자 전략 구축 시 관망이 권장되는 추세입니다.'
            ];
        }

        setNews({ id, title, source, bullets, sentiment, sentimentScore });
    }, [url]);

    if (!news) return null;

    const handleNewsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/news/${news.id}`);
    };

    return (
        <div 
            onClick={handleNewsClick}
            className="my-2.5 p-4 bg-slate-50 border border-slate-200/80 hover:border-violet-300 rounded-2xl shadow-sm cursor-pointer transition-all hover:translate-y-[-1px] group"
        >
            <div className="flex justify-between items-start gap-2 mb-2">
                <span className="bg-violet-50 border border-violet-200 text-violet-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    📰 VERA AI 뉴스 3줄 요약
                </span>
                
                {news.sentiment === 'good' && (
                    <span className="bg-rose-50 border border-rose-200 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        호재 {news.sentimentScore}%
                    </span>
                )}
                {news.sentiment === 'bad' && (
                    <span className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        악재 {news.sentimentScore}%
                    </span>
                )}
                {news.sentiment === 'neutral' && (
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        중립 {news.sentimentScore}%
                    </span>
                )}
            </div>

            <h4 className="text-sm font-black text-slate-800 group-hover:text-violet-600 transition-colors mb-2 break-keep leading-snug">
                {news.title}
            </h4>

            <ul className="space-y-1.5 border-l-2 border-violet-300 pl-3">
                {news.bullets.map((bullet, idx) => (
                    <li key={idx} className="text-xs text-slate-500 font-medium leading-relaxed break-keep">
                        {bullet}
                    </li>
                ))}
            </ul>

            <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold border-t border-slate-100 pt-2.5 mt-3">
                <span>출처: {news.source}</span>
                <span className="text-violet-600 font-black flex items-center gap-0.5">
                    기사 전체 읽기 <i className="fas fa-chevron-right text-[7px]"></i>
                </span>
            </div>
        </div>
    );
}
