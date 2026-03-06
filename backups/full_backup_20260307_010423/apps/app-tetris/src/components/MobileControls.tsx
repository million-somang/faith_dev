import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, RotateCw, Play, Pause, RefreshCw } from 'lucide-react';

interface MobileControlsProps {
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onMoveDown: () => void;
    onRotate: () => void;
    onDrop: () => void;
    onPause: () => void;
    onRestart: () => void;
    isPaused: boolean;
    isGameOver: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({
    onMoveLeft,
    onMoveRight,
    onMoveDown,
    onRotate,
    onDrop,
    onPause,
    onRestart,
    isPaused,
    isGameOver
}) => {
    return (
        <div className="lg:hidden flex flex-col gap-3 w-full max-w-sm mt-3">
            <div className="flex gap-2">
                <button
                    onClick={onPause}
                    disabled={isGameOver}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all
              ${isGameOver ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                            : isPaused ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                >
                    {isPaused ? <><Play size={18} /> RESUME</> : <><Pause size={18} /> PAUSE</>}
                </button>
                <button
                    onClick={onRestart}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/50 rounded-xl font-bold transition-all"
                >
                    <RefreshCw size={18} /> RESTART
                </button>
            </div>

            {/* D-Pad and Action Buttons */}
            <div className="flex justify-between items-end gap-4 h-32 px-4">
                {/* D-Pad (Left, Down, Right) */}
                <div className="grid grid-cols-3 gap-2 w-[180px]">
                    <div className="col-start-1 row-start-2">
                        <button
                            className="w-full aspect-square bg-slate-700 active:bg-slate-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                            onClick={(e) => { e.preventDefault(); onMoveLeft(); }}
                        >
                            <ArrowLeft size={24} />
                        </button>
                    </div>
                    <div className="col-start-2 row-start-2">
                        <button
                            className="w-full aspect-square bg-slate-700 active:bg-slate-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                            onClick={(e) => { e.preventDefault(); onMoveDown(); }}
                        >
                            <ArrowDown size={24} />
                        </button>
                    </div>
                    <div className="col-start-3 row-start-2">
                        <button
                            className="w-full aspect-square bg-slate-700 active:bg-slate-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
                            onClick={(e) => { e.preventDefault(); onMoveRight(); }}
                        >
                            <ArrowRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Action Buttons (Rotate, Drop) */}
                <div className="flex flex-col gap-4">
                    <button
                        className="w-16 h-16 bg-blue-600 active:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-[0_4px_0_theme(colors.blue.800)] active:shadow-none active:translate-y-1 transition-all"
                        onClick={(e) => { e.preventDefault(); onRotate(); }}
                    >
                        <RotateCw size={28} />
                    </button>
                    <button
                        className="w-20 h-20 bg-emerald-500 active:bg-emerald-400 rounded-full flex items-center justify-center text-white shadow-[0_6px_0_theme(colors.emerald.700)] active:shadow-none active:translate-y-1 transition-all -ml-6"
                        onClick={(e) => { e.preventDefault(); onDrop(); }}
                    >
                        <span className="font-bold text-lg tracking-widest">DROP</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileControls;
