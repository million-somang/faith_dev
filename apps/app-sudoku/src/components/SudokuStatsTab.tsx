import React from 'react';
import { GameStats } from '../hooks/useSudoku';
import { getDifficultyLabel, Difficulty } from '../logic/sudoku';

interface SudokuStatsTabProps {
    stats: GameStats;
    onResetStats?: () => void;
}

export const SudokuStatsTab: React.FC<SudokuStatsTabProps> = ({ stats }) => {
    const winRate = stats.gamesPlayed > 0 
        ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
        : 0;

    const formatTime = (seconds: number | null) => {
        if (seconds === null) return '--:--';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];

    return (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 animate-fade-in bg-slate-50">
            {/* 상단 통계 헤더 카드 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm text-center">
                <span className="text-[11px] font-black uppercase text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    CAREER STATS
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-2">나의 스도쿠 마스터 기록</h2>
                <p className="text-xs text-slate-500 mt-1">로컬 브라우저에 안전하게 저장된 실시간 플레이 전적</p>

                {/* 3대 핵심 수치 그리드 */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block">총 대국수</span>
                        <span className="text-lg font-black text-slate-800 tabular-nums">{stats.gamesPlayed}회</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block">완전 정복</span>
                        <span className="text-lg font-black text-emerald-600 tabular-nums">{stats.gamesWon}회</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 block">승률 (완주율)</span>
                        <span className="text-lg font-black text-blue-600 tabular-nums">{winRate}%</span>
                    </div>
                </div>
            </div>

            {/* 난이도별 최고 기록 (Best Time) 카드 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <i className="fas fa-stopwatch text-amber-500"></i>
                    난이도별 최단 클리어 기록 (Best Time)
                </h3>

                <div className="space-y-2">
                    {difficulties.map(diff => {
                        const time = stats.bestTime[diff];
                        const label = getDifficultyLabel(diff);
                        const badgeColor = diff === 'easy' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : diff === 'medium'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200';

                        return (
                            <div 
                                key={diff}
                                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${badgeColor}`}>
                                        {label}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700">{label} 모드</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-black text-slate-900 font-mono tabular-nums">
                                        {formatTime(time)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 두뇌 활성화 지수 카드 */}
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black tracking-wider uppercase opacity-90">BRAIN HEALTH INDEX</span>
                    <i className="fas fa-brain text-xl opacity-80"></i>
                </div>
                <h4 className="text-base font-black mb-1">논리적 사고 & 단기 기억력 증진</h4>
                <p className="text-xs opacity-90 leading-relaxed">
                    스도쿠는 좌뇌의 논리 추론 영역과 공간 인지 능력을 동시에 자극하는 공인 두뇌 트레이닝 퍼즐입니다. 매일 1판 완주로 집중력을 유지하세요.
                </p>
            </div>
        </div>
    );
};
