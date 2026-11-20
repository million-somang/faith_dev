'use client';

import React from 'react';
import type { AzitFullGameState } from '@/types/azit-game.types';

interface AzitLevelHeaderBadgeProps {
    gameState: AzitFullGameState;
    onOpenMarketModal: () => void;
    onOpenChefModal?: () => void;
    onOpenMercModal?: () => void;
}

export const AzitLevelHeaderBadge: React.FC<AzitLevelHeaderBadgeProps> = ({
    gameState,
    onOpenMarketModal,
    onOpenChefModal,
    onOpenMercModal,
}) => {
    const { profile, veraPoints, chefs, mercenaries } = gameState;
    const clampedPct = Math.max(0, Math.min(100, profile.progressPct));

    return (
        <div className="w-full flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-50/95 via-white to-emerald-50/90 border border-amber-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black shadow-2xs shrink-0">
                    🏰 Lv.{profile.azitLevel} 아지트
                </span>
                <span className="text-xs font-black text-slate-800 truncate">{profile.title}</span>

                <div className="flex items-center gap-1.5 min-w-0">
                    <svg
                        viewBox="0 0 100 8"
                        className="w-20 sm:w-24 h-2 shrink-0"
                        role="progressbar"
                        aria-valuenow={clampedPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="아지트 레벨 경험치 진행률"
                    >
                        <rect x="0" y="0" width="100" height="8" rx="4" fill="#e2e8f0" />
                        <rect x="0" y="0" width={clampedPct} height="8" rx="4" fill="#10b981" />
                    </svg>
                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0">
                        {profile.nextLevelXp !== null
                            ? `${profile.azitXp}/${profile.nextLevelXp} XP`
                            : `${profile.azitXp} XP (MAX)`}
                    </span>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
                <span
                    className="px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-black font-mono"
                    title="포털·아지트 통합 베라포인트"
                >
                    🪙 {veraPoints.toLocaleString()} P
                </span>

                {onOpenChefModal && (
                    <button
                        type="button"
                        onClick={onOpenChefModal}
                        className="px-2 py-0.5 rounded-full bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-800 text-[10px] font-extrabold transition-colors cursor-pointer"
                    >
                        👨‍🍳 요리사 {chefs.length}/{profile.limits.maxChefs}
                    </button>
                )}

                {onOpenMercModal && (
                    <button
                        type="button"
                        onClick={onOpenMercModal}
                        className="px-2 py-0.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-[10px] font-extrabold transition-colors cursor-pointer"
                    >
                        ⚔️ 용병 {mercenaries.length}/{profile.limits.maxMercs}
                    </button>
                )}

                <button
                    type="button"
                    onClick={onOpenMarketModal}
                    className="px-2.5 py-0.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-colors cursor-pointer shadow-2xs"
                >
                    💰 작물·요리 장터
                </button>
            </div>
        </div>
    );
};
