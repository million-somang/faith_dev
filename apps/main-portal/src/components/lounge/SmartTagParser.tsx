import { LiveStockWidget } from './LiveStockWidget';
import { LiveUtilityWidget } from './LiveUtilityWidget';
import { NewsAiSummaryWidget } from './NewsAiSummaryWidget';

interface SmartTagParserProps {
    text: string;
}

export function SmartTagParser({ text }: SmartTagParserProps) {
    if (!text) return null;

    // 정규표현식: $주식명, #유틸리티명, @기사링크 URL 패턴 검출
    // 공백 또는 줄바꿈을 기준으로 나눈 단어들을 토큰으로 검사
    const lines = text.split('\n');

    return (
        <div className="space-y-1">
            {lines.map((line, lineIdx) => {
                const words = line.split(' ');
                const lineContent: React.ReactNode[] = [];
                const widgets: React.ReactNode[] = [];

                words.forEach((word, wordIdx) => {
                    // 1. 주식 태그 감지 ($엔비디아, $삼성전자 등)
                    const stockMatch = word.match(/^\$([a-zA-Z가-힣]+)/);
                    // 2. 유틸리티 태그 감지 (#사다리타기, #주사위굴리기 등)
                    const utilityMatch = word.match(/^#([a-zA-Z가-힣]+)/);
                    // 3. 기사 링크 감지 (@http:// 또는 @https:// 또는 일반 http 링크에 @가 붙은 경우)
                    const newsLinkMatch = word.match(/^@(https?:\/\/[^\s]+)/) || word.match(/^(https?:\/\/[^\s]+)/);

                    if (stockMatch) {
                        const stockName = stockMatch[0];
                        lineContent.push(
                            <span key={`text-${wordIdx}`} className="text-violet-400 font-extrabold cursor-pointer hover:underline mr-1">
                                {stockName}
                            </span>
                        );
                        widgets.push(<LiveStockWidget key={`widget-stock-${wordIdx}`} stockName={stockName} />);
                    } else if (utilityMatch) {
                        const utilityName = utilityMatch[0];
                        lineContent.push(
                            <span key={`text-${wordIdx}`} className="text-sky-400 font-extrabold mr-1">
                                {utilityName}
                            </span>
                        );
                        widgets.push(<LiveUtilityWidget key={`widget-util-${wordIdx}`} utilityName={utilityName} />);
                    } else if (newsLinkMatch) {
                        const rawUrl = newsLinkMatch[1] || newsLinkMatch[0];
                        // 텍스트상에는 깔끔하게 링크 아이콘이나 줄인 텍스트 표시
                        lineContent.push(
                            <span key={`text-${wordIdx}`} className="text-amber-400 font-bold hover:underline cursor-pointer mr-1 break-all">
                                🔗 AI 뉴스분석 링크
                            </span>
                        );
                        widgets.push(<NewsAiSummaryWidget key={`widget-news-${wordIdx}`} url={rawUrl} />);
                    } else {
                        // 일반 단어
                        lineContent.push(<span key={`text-${wordIdx}`} className="mr-1">{word}</span>);
                    }
                });

                return (
                    <div key={lineIdx} className="text-sm leading-relaxed text-slate-200">
                        {/* 텍스트 행 렌더링 */}
                        <div className="flex flex-wrap items-center">
                            {lineContent}
                        </div>
                        {/* 추출된 라이브 위젯들을 텍스트 아래에 줄바꿈하여 순차 렌더링 */}
                        {widgets.length > 0 && (
                            <div className="my-2.5 flex flex-col gap-1">
                                {widgets}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
