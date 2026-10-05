interface GameOverModalProps {
    isOpen: boolean;
    score: number;
    maxTile: number;
    onClose: () => void;
    onNewGame: () => void;
}

export default function GameOverModal({ isOpen, score, maxTile, onClose, onNewGame }: GameOverModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl text-center shadow-2xl border border-slate-100 max-w-xs w-full animate-scale-up">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-2xl mb-3 shadow-xs">
                    <i className="fas fa-face-frown"></i>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-1">
                    게임 종료!
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                    더 이상 이동 가능한 블록이 없습니다.
                </p>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 mb-5 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">최종 점수</span>
                        <span className="text-slate-900 font-black text-sm tabular-nums">{score.toLocaleString()} 점</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-semibold">최대 달성 타일</span>
                        <span className="text-purple-600 font-black text-sm tabular-nums">{maxTile}</span>
                    </div>
                </div>

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                        기록 확인
                    </button>
                    <button
                        onClick={onNewGame}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                    >
                        다시 도전
                    </button>
                </div>
            </div>
        </div>
    );
}
