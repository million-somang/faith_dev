interface WinModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onNewGame: () => void;
}

export default function WinModal({ isOpen, onContinue, onNewGame }: WinModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-white/90 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 sm:p-10 rounded-2xl text-center shadow-2xl max-w-sm w-full">
                <div className="text-4xl font-bold text-[#776e65] mb-2">
                    축하합니다!
                </div>
                <div className="text-6xl mb-4">🎉</div>
                <div className="text-xl text-[#8f7a66] mb-6">
                    2048 타일을 만들었습니다!
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onContinue}
                        className="flex-1 py-3 px-4 bg-[#eee4da] text-[#776e65] rounded-lg font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        계속 하기
                    </button>
                    <button
                        onClick={onNewGame}
                        className="flex-1 py-3 px-4 bg-[#8f7a66] text-white rounded-lg font-bold text-base hover:opacity-90 transition-opacity cursor-pointer"
                    >
                        새 게임
                    </button>
                </div>
            </div>
        </div>
    );
}
