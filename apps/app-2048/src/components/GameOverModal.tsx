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
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 sm:p-10 rounded-2xl text-center shadow-2xl max-w-sm w-full">
                <div className="text-4xl font-bold text-[#776e65] mb-2">
                    게임 오버!
                </div>
                <div className="text-6xl mb-4">😢</div>
                <div className="text-xl text-[#8f7a66] mb-6 space-y-1">
                    <p>최종 점수: <strong className="text-[#776e65]">{score.toLocaleString()}</strong></p>
                    <p>최고 타일: <strong className="text-[#776e65]">{maxTile}</strong></p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-[#eee4da] text-[#776e65] rounded-lg font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        닫기
                    </button>
                    <button
                        onClick={onNewGame}
                        className="flex-1 py-3 px-4 bg-[#8f7a66] text-white rounded-lg font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        다시 하기
                    </button>
                </div>
            </div>
        </div>
    );
}
