import { LiveStockWidget } from './LiveStockWidget';
import { LiveUtilityWidget } from './LiveUtilityWidget';
import { NewsAiSummaryWidget } from './NewsAiSummaryWidget';
import { LiveGameChallengeWidget } from './LiveGameChallengeWidget';
import { LiveSajuHoroscopeWidget } from './LiveSajuHoroscopeWidget';

interface SmartTagParserProps {
    text: string;
}

export function SmartTagParser({ text }: SmartTagParserProps) {
    if (!text) return null;

    // 정규표현식: $주식명, #유틸리티/게임/사주명, @기사링크 URL 패턴 검출
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
                    // 2. 해시태그 감지 (#테트리스, #사다리타기, #오늘의운세 등)
                    const hashMatch = word.match(/^#([a-zA-Z가-힣0-9]+)/);
                    // 3. 기사 링크 감지 (@http:// 또는 @https://)
                    const newsLinkMatch = word.match(/^@(https?:\/\/[^\s]+)/) || word.match(/^(https?:\/\/[^\s]+)/);

                    if (stockMatch) {
                        const stockName = stockMatch[0];
                        lineContent.push(
                            <span key={`text-${wordIdx}`} className="text-violet-400 font-extrabold cursor-pointer hover:underline mr-1">
                                {stockName}
                            </span>
                        );
                        widgets.push(<LiveStockWidget key={`widget-stock-${wordIdx}`} stockName={stockName} />);
                    } else if (hashMatch) {
                        const tagName = hashMatch[1];
                        const fullTag = hashMatch[0];

                        // A. 게임 태그 (#테트리스, #스도쿠, #2048, #지뢰찾기, #게임)
                        if (['테트리스', '스도쿠', '2048', '지뢰찾기', '게임'].some(g => tagName.includes(g))) {
                            lineContent.push(
                                <span key={`text-${wordIdx}`} className="text-emerald-400 font-extrabold mr-1">
                                    {fullTag}
                                </span>
                            );
                            widgets.push(<LiveGameChallengeWidget key={`widget-game-${wordIdx}`} gameTag={fullTag} />);
                        }
                        // B. 사주 & 운세 태그 (#오늘의운세, #사주, #운세)
                        else if (['운세', '사주', '타로', '행운'].some(s => tagName.includes(s))) {
                            lineContent.push(
                                <span key={`text-${wordIdx}`} className="text-amber-400 font-extrabold mr-1">
                                    {fullTag}
                                </span>
                            );
                            widgets.push(<LiveSajuHoroscopeWidget key={`widget-saju-${wordIdx}`} tag={fullTag} />);
                        }
                        // C. 생활 유틸리티 태그 (#사다리타기, #주사위, #동전 등)
                        else {
                            lineContent.push(
                                <span key={`text-${wordIdx}`} className="text-sky-400 font-extrabold mr-1">
                                    {fullTag}
                                </span>
                            );
                            widgets.push(<LiveUtilityWidget key={`widget-util-${wordIdx}`} utilityName={fullTag} />);
                        }
                    } else if (newsLinkMatch) {
                        const rawUrl = newsLinkMatch[1] || newsLinkMatch[0];
                        lineContent.push(
                            <span key={`text-${wordIdx}`} className="text-amber-400 font-bold hover:underline cursor-pointer mr-1 break-all">
                                🔗 AI 뉴스분석 링크
                            </span>
                        );
                        widgets.push(<NewsAiSummaryWidget key={`widget-news-${wordIdx}`} url={rawUrl} />);
                    } else {
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
