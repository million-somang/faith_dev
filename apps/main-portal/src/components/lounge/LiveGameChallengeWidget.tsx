import React, { useState, useEffect } from 'react';
import { getStoredBattleRecord, BattleRecord } from './LoungeBattleModal';

interface LiveGameChallengeWidgetProps {
    gameTag: string;
    scoreText?: string;
    challengerName?: string;
    onOpenBattle?: (gameTag: string, targetScore: number, challengerName?: string) => void;
}

export const LiveGameChallengeWidget: React.FC<LiveGameChallengeWidgetProps> = ({
    gameTag,
    scoreText,
    challengerName,
    onOpenBattle
}) => {
    const cleanTag = gameTag.replace('#', '').trim();

    // 게임 종류 판별
    let gameTitle = '테트리스';
    let icon = 'fas fa-cubes';
    let gradient = 'from-violet-600 to-indigo-600';
    let defaultTargetScore = 12400;

    if (cleanTag.includes('스도쿠')) {
        gameTitle = '스도쿠';
        icon = 'fas fa-table-cells';
        gradient = 'from-emerald-600 to-teal-600';
        defaultTargetScore = 15000;
    } else if (cleanTag.includes('2048')) {
        gameTitle = '2048 퍼즐';
        icon = 'fas fa-border-all';
        gradient = 'from-amber-600 to-orange-600';
        defaultTargetScore = 20480;
    } else if (cleanTag.includes('지뢰찾기')) {
        gameTitle = '지뢰찾기';
        icon = 'fas fa-bomb';
        gradient = 'from-rose-600 to-red-600';
        defaultTargetScore = 9900;
    }

    // scoreText에서 숫자 추출 시도 (예: "12,400점" -> 12400)
    let parsedTargetScore = defaultTargetScore;
    if (scoreText) {
        const numOnly = parseInt(scoreText.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(numOnly) && numOnly > 0) {
            parsedTargetScore = numOnly;
        }
    }

    const [challengeCount, setChallengeCount] = useState(14);
    const [record, setRecord] = useState<BattleRecord>(getStoredBattleRecord);

    useEffect(() => {
        setRecord(getStoredBattleRecord());
    }, []);

    const handleChallenge = () => {
        setChallengeCount(prev => prev + 1);
        if (onOpenBattle) {
            onOpenBattle(gameTag, parsedTargetScore, challengerName || '베라 랭커');
        } else {
            // 커스텀 이벤트 디스패치 (어디서든 모달 트리거 가능)
            window.dispatchEvent(new CustomEvent('open-lounge-battle', {
                detail: { gameTag, targetScore: parsedTargetScore, challengerName: challengerName || '베라 랭커' }
            }));
        }
    };

    const winRate = record.wins + record.losses > 0
        ? Math.round((record.wins / (record.wins + record.losses)) * 100)
        : 0;

    return (
        <div className="my-2.5 p-4 rounded-2xl bg-gradient-to-br from-violet-50/90 via-indigo-50/50 to-purple-50/80 border border-violet-200/90 text-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white text-lg shadow-md shrink-0`}>
                        <i className={icon}></i>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
                                🎮 실시간 게임 챌린지
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                                현재 {challengeCount}명 대결 중
                            </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-850 mt-0.5 tracking-tight flex items-center gap-1.5 flex-wrap">
                            {gameTitle} 1:1 배틀
                            <span className="text-xs font-mono font-bold text-violet-600">
                                (목표: {parsedTargetScore.toLocaleString()}P)
                            </span>
                        </h4>
                    </div>
                </div>

                <button
                    onClick={handleChallenge}
                    className="self-end sm:self-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <i className="fas fa-gamepad text-xs"></i>
                    <span>팝업으로 1:1 대결하기</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
            </div>

            {/* 내 실시간 전적 및 최고 기록 표시 바 */}
            <div className="flex items-center justify-between pt-2.5 mt-3 border-t border-violet-200/60 text-[10px] text-slate-500 font-bold">
                <div className="flex items-center gap-2">
                    <span className="text-violet-700 font-black">
                        🏆 내 배틀 전적: {record.wins}승 {record.losses}패 (승률 {winRate}%)
                    </span>
                </div>
                <div className="text-slate-600">
                    내 최고 기록: <span className="font-mono font-black text-slate-800">{record.highScore.toLocaleString()}P</span>
                </div>
            </div>
        </div>
    );
};
