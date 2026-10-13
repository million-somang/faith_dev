import { useState } from 'react';

interface LiveUtilityWidgetProps {
    utilityName: string;
}

export function LiveUtilityWidget({ utilityName }: LiveUtilityWidgetProps) {
    const cleanName = utilityName.replace('#', '').trim();

    // 1. 사다리타기 상태
    const [ladderResult, setLadderResult] = useState<string | null>(null);
    const [isLadderRunning, setIsLadderRunning] = useState(false);
    const [ladderSelection, setLadderSelection] = useState<number | null>(null);

    // 2. 주사위 상태
    const [diceResult, setDiceResult] = useState<number | null>(null);
    const [isDiceRolling, setIsDiceRolling] = useState(false);

    // 사다리 타기 시뮬레이터 (4개 채널)
    const runLadder = (choice: number) => {
        if (isLadderRunning) return;
        setIsLadderRunning(true);
        setLadderSelection(choice);
        setLadderResult(null);

        setTimeout(() => {
            const results = ['☕ 커피 당첨!', '💸 점심 밥 사기 당첨!', '🎉 세이프! (통과)', '🧹 오늘 청소 당첨!'];
            const randomIdx = Math.floor(Math.random() * results.length);
            setLadderResult(results[randomIdx]);
            setIsLadderRunning(false);
        }, 1200);
    };

    // 주사위 시뮬레이터
    const rollDice = () => {
        if (isDiceRolling) return;
        setIsDiceRolling(true);
        setDiceResult(null);

        let counter = 0;
        const interval = setInterval(() => {
            setDiceResult(Math.floor(Math.random() * 6) + 1);
            counter++;
            if (counter > 8) {
                clearInterval(interval);
                setIsDiceRolling(false);
            }
        }, 100);
    };

    if (cleanName === '사다리타기') {
        return (
            <div className="my-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="bg-sky-50 border border-sky-200 text-sky-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        🛠️ 실시간 사다리타기 위젯
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">VERA 라이프</span>
                </div>

                <p className="text-xs text-slate-600 font-bold mb-2.5">
                    👇 번호를 터치해 사다리 타기 게임을 즉시 시작하세요 (커피 내기용):
                </p>

                <div className="grid grid-cols-4 gap-2 mb-3">
                    {[1, 2, 3, 4].map((num) => (
                        <button
                            key={num}
                            onClick={() => runLadder(num)}
                            disabled={isLadderRunning}
                            className={`py-2.5 rounded-xl border text-xs font-black transition-all ${
                                ladderSelection === num
                                    ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            {num}번
                        </button>
                    ))}
                </div>

                {isLadderRunning && (
                    <div className="text-center py-2 text-xs font-bold text-sky-600 animate-pulse">
                        🚶‍♂️ 사다리를 타고 내려가는 중...
                    </div>
                )}

                {ladderResult && (
                    <div className="p-2.5 bg-sky-50 border border-sky-100 rounded-xl text-center animate-fade-in">
                        <span className="text-[10px] text-slate-450 font-bold">선택: {ladderSelection}번 결과</span>
                        <div className="text-xs font-black text-sky-650 mt-0.5">{ladderResult}</div>
                    </div>
                )}
            </div>
        );
    }

    if (cleanName === '주사위굴리기' || cleanName === '주사위') {
        return (
            <div className="my-2.5 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        🎲 3D 주사위 굴리기 위젯
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">VERA 라이프</span>
                </div>

                <div className="flex items-center justify-around py-1">
                    <div className="flex flex-col items-center gap-1">
                        {/* 주사위 비주얼 */}
                        <div 
                            onClick={rollDice}
                            className={`w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 text-slate-750 ${
                                isDiceRolling ? 'animate-spin' : ''
                            }`}
                        >
                            {diceResult === 1 && '⚀'}
                            {diceResult === 2 && '⚁'}
                            {diceResult === 3 && '⚂'}
                            {diceResult === 4 && '⚃'}
                            {diceResult === 5 && '⚄'}
                            {diceResult === 6 && '⚅'}
                            {!diceResult && '🎲'}
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold">주사위 터치</span>
                    </div>

                    <div className="flex flex-col justify-center items-start gap-1">
                        <p className="text-xs text-slate-600 font-bold">
                            {isDiceRolling ? '주사위 굴리는 중...' : '터치해 주사위를 굴려보세요!'}
                        </p>
                        {diceResult && !isDiceRolling && (
                            <div className="text-xs font-black text-amber-600 animate-bounce">
                                결과 값: <span className="font-mono text-sm">{diceResult}</span>이(가) 나왔습니다!
                            </div>
                        )}
                        <button
                            onClick={rollDice}
                            disabled={isDiceRolling}
                            className="mt-1 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-[10px] font-black transition-colors"
                        >
                            굴리기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
