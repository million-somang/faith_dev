import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LiveGameChallengeWidgetProps {
    gameTag: string;
    scoreText?: string;
}

export const LiveGameChallengeWidget: React.FC<LiveGameChallengeWidgetProps> = ({ gameTag, scoreText }) => {
    const navigate = useNavigate();
    const cleanTag = gameTag.replace('#', '').trim();

    // 게임 종류 판별
    let gameTitle = '테트리스';
    let gameRoute = '/game/play/tetris';
    let icon = 'fas fa-cubes';
    let gradient = 'from-violet-600 to-indigo-600';
    let defaultScore = '12,400점';

    if (cleanTag.includes('스도쿠')) {
        gameTitle = '스도쿠';
        gameRoute = '/game';
        icon = 'fas fa-table-cells';
        gradient = 'from-emerald-600 to-teal-600';
        defaultScore = '3분 20초 컷!';
    } else if (cleanTag.includes('2048')) {
        gameTitle = '2048 퍼즐';
        gameRoute = '/game';
        icon = 'fas fa-border-all';
        gradient = 'from-amber-600 to-orange-600';
        defaultScore = '2048 타일 달성!';
    } else if (cleanTag.includes('지뢰찾기')) {
        gameTitle = '지뢰찾기';
        gameRoute = '/game';
        icon = 'fas fa-bomb';
        gradient = 'from-rose-600 to-red-600';
        defaultScore = '전문가 45초 클리어';
    }

    const [challengeCount, setChallengeCount] = useState(14);
    const [hasChallenged, setHasChallenged] = useState(false);

    const handleChallenge = () => {
        setChallengeCount(prev => prev + 1);
        setHasChallenged(true);
        navigate(gameRoute);
    };

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
                                현재 {challengeCount}명 도전 중
                            </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-850 mt-0.5 tracking-tight flex items-center gap-1.5">
                            {gameTitle} 랭킹 챌린지
                            <span className="text-xs font-mono font-bold text-violet-600">
                                ({scoreText || defaultScore})
                            </span>
                        </h4>
                    </div>
                </div>

                <button
                    onClick={handleChallenge}
                    className="self-end sm:self-auto px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-xs flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                    <i className="fas fa-gamepad text-xs"></i>
                    <span>{hasChallenged ? '다시 도전하기' : '1:1 대결 도전하기'}</span>
                    <i className="fas fa-arrow-right text-[10px]"></i>
                </button>
            </div>
        </div>
    );
};
