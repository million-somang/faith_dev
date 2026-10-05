interface WinModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onNewGame: () => void;
}

export default function WinModal({ isOpen, onContinue, onNewGame }: WinModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white p-6 rounded-3xl text-center shadow-2xl border border-slate-100 max-w-xs w-full animate-scale-up">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 text-white flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-500/30 animate-bounce-soft">
                    <i className="fas fa-crown"></i>
                </div>

                <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block mb-1.5">
                    VICTORY ACHIEVED
                </span>

                <h3 className="text-xl font-black text-slate-900 mb-1">
                    축하합니다!
                </h3>
                <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                    환상적인 연쇄 슬라이드로 <strong className="text-purple-600 font-black">2048 타일</strong>을 완성했습니다!
                </p>

                <div className="flex gap-2.5">
                    <button
                        onClick={onContinue}
                        className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                    >
                        계속 도전 (무한)
                    </button>
                    <button
                        onClick={onNewGame}
                        className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                    >
                        새 게임
                    </button>
                </div>
            </div>
        </div>
    );
}
