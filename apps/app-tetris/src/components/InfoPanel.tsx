import React from 'react';
import { TetrominoType } from '../types';
import { Trophy, HelpCircle, ArrowRight, ArrowLeft, ArrowDown, RotateCw, Pause, Play, RefreshCw } from 'lucide-react';
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
        <div className="flex flex-col gap-6 w-full max-w-[200px] text-white">
            {/* Score Card */}
            <div className="bg-slate-800 rounded-xl p-4 border-2 border-slate-700 shadow-xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                <div className="relative z-10 flex flex-col gap-1 items-center">
                    <span className="text-emerald-400 font-bold tracking-wider text-sm flex items-center gap-2">
                        <Trophy size={16} /> SCORE
                    </span>
                    <span className="text-3xl font-mono font-bold text-white tabular-nums drop-shadow-md">
                        {score.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Stats Details */}
            <div className="flex gap-4">
                <div className="flex-1 bg-slate-800 rounded-xl p-3 border-2 border-slate-700 shadow-lg flex flex-col items-center">
                    <span className="text-slate-400 font-semibold text-xs mb-1 tracking-widest">LEVEL</span>
                    <span className="text-xl font-mono font-bold text-yellow-400">{level}</span>
                </div>
                <div className="flex-1 bg-slate-800 rounded-xl p-3 border-2 border-slate-700 shadow-lg flex flex-col items-center">
                    <span className="text-slate-400 font-semibold text-xs mb-1 tracking-widest">LINES</span>
                    <span className="text-xl font-mono font-bold text-cyan-400">{lines}</span>
                </div>
            </div>

            {/* Next Piece */}
            <div className="bg-slate-800 rounded-xl p-4 border-2 border-slate-700 shadow-xl flex flex-col items-center">
                <span className="text-slate-400 font-bold tracking-wider text-sm mb-4">NEXT BLOCK</span>
                <div className="w-24 h-24 flex items-center justify-center bg-slate-900 rounded-lg p-2 inner-shadow">
                    <NextPiecePreview type={nextPieceType} blockSize="w-5 h-5" borderWidth="border-[3px]" />
                </div>
            </div>

            {/* Control Buttons (Desktop) */}
            <div className="hidden lg:flex flex-col gap-3">
                <button
                    onClick={onPause}
                    disabled={isGameOver}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all
            ${isGameOver ? 'opacity-50 cursor-not-allowed bg-slate-700 text-slate-400'
                            : isPaused ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                >
                    {isPaused ? <><Play size={18} /> RESUME</> : <><Pause size={18} /> PAUSE</>}
                </button>

                <button
                    onClick={onRestart}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-red-500/20 hover:bg-red-500 hover:text-white text-red-500 border border-red-500/50 rounded-xl font-bold transition-all"
                >
                    <RefreshCw size={18} /> RESTART
                </button>
            </div>

            {/* PC Keyboard Guide */}
            <div className="hidden lg:block mt-auto text-xs text-slate-400 bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h4 className="font-bold flex items-center gap-2 mb-3 text-slate-300">
                    <HelpCircle size={14} /> CONTROLS
                </h4>
                <div className="grid grid-cols-[1fr_auto] gap-y-2">
                    <span><ArrowLeft size={12} className="inline mr-1" /><ArrowRight size={12} className="inline mr-1" /> Move</span>
                    <span className="font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">← →</span>
                    <span><RotateCw size={12} className="inline mr-1" /> Rotate</span>
                    <span className="font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">↑</span>
                    <span><ArrowDown size={12} className="inline mr-1" /> Soft Drop</span>
                    <span className="font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">↓</span>
                    <span>⏬ Hard Drop</span>
                    <span className="font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">Space</span>
                </div>
            </div>
        </div>
    );
};

export default InfoPanel;
