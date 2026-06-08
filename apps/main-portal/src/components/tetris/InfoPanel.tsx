import React from 'react';
import { TetrominoType } from './types';
import NextPiecePreview from './NextPiecePreview';

interface InfoPanelProps {
    score: number;
    level: number;
    lines: number;
    nextPieceType: TetrominoType;
    isPaused: boolean;
    isGameOver: boolean;
    onPause: () => void;
    onRestart: () => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({
    score,
    level,
    lines,
    nextPieceType,
    isPaused,
    isGameOver,
    onPause,
    onRestart
}) => {

    return (
        <div className="flex flex-col gap-4 w-full max-w-[200px] text-slate-800">
            {/* Score Card */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-sm relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                <div className="relative z-10 flex flex-col gap-1 items-center">
                    <span className="text-emerald-600 font-bold tracking-wider text-xs flex items-center gap-1.5">
                        <i className="fas fa-trophy"></i> SCORE
                    </span>
                    <span className="text-3xl font-mono font-bold text-slate-800 tabular-nums drop-shadow-sm">
                        {score.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Stats Details */}
            <div className="flex gap-3">
                <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col items-center">
                    <span className="text-slate-500 font-bold text-[10px] mb-1 tracking-wider">LEVEL</span>
                    <span className="text-xl font-mono font-bold text-amber-600">{level}</span>
                </div>
                <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-200/80 shadow-sm flex flex-col items-center">
                    <span className="text-slate-500 font-bold text-[10px] mb-1 tracking-wider">LINES</span>
                    <span className="text-xl font-mono font-bold text-cyan-600">{lines}</span>
                </div>
            </div>

            {/* Next Piece */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col items-center">
                <span className="text-slate-500 font-bold tracking-wider text-xs mb-3">NEXT BLOCK</span>
                <div className="w-24 h-24 flex items-center justify-center bg-slate-950 rounded-xl p-2 shadow-inner">
                    <NextPiecePreview type={nextPieceType} blockSize="w-5 h-5" borderWidth="border-[3px]" />
                </div>
            </div>

            {/* Control Buttons (Desktop) */}
            <div className="hidden lg:flex gap-2 w-full">
                <button
                    onClick={onPause}
                    disabled={isGameOver}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl font-bold text-xs transition-all border
            ${isGameOver ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                             : isPaused ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-sm'
                                 : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
                >
                    {isPaused ? <><i className="fas fa-play text-[10px]"></i> RESUME</> : <><i className="fas fa-pause text-[10px]"></i> PAUSE</>}
                </button>

                <button
                    onClick={onRestart}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs transition-all"
                >
                    <i className="fas fa-sync-alt text-[10px]"></i> RESTART
                </button>
            </div>
        </div>
    );
};

export default InfoPanel;
