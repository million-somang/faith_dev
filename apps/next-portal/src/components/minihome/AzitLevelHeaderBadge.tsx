'use client';

import React from 'react';
import type { AzitFullGameState } from '@/types/azit-game.types';

interface AzitLevelHeaderBadgeProps {
    gameState: AzitFullGameState;
    onOpenMarketModal: () => void;
    onOpenFarmerModal?: () => void;
    onOpenChefModal?: () => void;
    onOpenMercModal?: () => void;
    onOpenWarehouseModal?: () => void;
    onOpenShopModal?: () => void;
}

export const AzitLevelHeaderBadge: React.FC<AzitLevelHeaderBadgeProps> = ({
    gameState,
    onOpenMarketModal,
    onOpenFarmerModal,
    onOpenChefModal,
    onOpenMercModal,
    onOpenWarehouseModal,
    onOpenShopModal,
}) => {
    const { profile, veraPoints, chefs, mercenaries, farmers } = gameState;
    const isFarmerUnlocked = profile.azitLevel >= 20;
    const safeAzitXp = Number.isFinite(profile.azitXp) ? Math.max(0, Math.floor(profile.azitXp)) : 0;
    const clampedPct = Number.isFinite(profile.progressPct)
        ? Math.max(0, Math.min(100, profile.progressPct))
        : 0;

    const neutralBtnClass =
        'px-2.5 py-1 rounded-xl bg-[#f0f4f8] hover:bg-white text-[#1e293b] border border-white/90 shadow-[3px_3px_6px_rgba(163,177,198,0.35),-3px_-3px_6px_rgba(255,255,255,0.85)] active:shadow-[inset_2px_2px_4px_rgba(163,177,198,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.8)] text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shrink-0';

    return (
        <div className="w-full rounded-2xl bg-[#e8edf2]/85 border border-white/80 shadow-[inset_2px_2px_6px_rgba(163,177,198,0.35),inset_-2px_-2px_6px_rgba(255,255,255,0.85)] px-3 py-2.5 space-y-2">
            {/* 윗줄: 성장 & 자산 */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black shadow-xs shrink-0">
                        🏰 Lv.{profile.azitLevel}
                    </span>
                    <span className="text-xs font-black text-[#1e293b] truncate">{profile.title}</span>

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
                            <rect x="0" y="0" width="100" height="8" rx="4" fill="#cbd5e1" />
                            <rect x="0" y="0" width={clampedPct} height="8" rx="4" fill="#10b981" />
                        </svg>
                        <span className="text-[10px] font-mono font-bold text-[#64748b] shrink-0">
                            {profile.nextLevelXp !== null
                                ? `${safeAzitXp}/${profile.nextLevelXp} XP`
                                : `${safeAzitXp} XP (MAX)`}
                        </span>
                    </div>
                </div>

                <span
                    className="px-2.5 py-0.5 rounded-full bg-white/95 border border-white text-[#1e293b] text-[11px] font-black font-mono shadow-[2px_2px_5px_rgba(163,177,198,0.35),-2px_-2px_5px_rgba(255,255,255,0.9)] shrink-0"
                    title="포털·아지트 통합 베라포인트"
                >
                    🪙 {veraPoints.toLocaleString()} P
                </span>
            </div>

            {/* 아랫줄: 운영 퀵독 (인력 | 거래·보관) */}
            <div className="w-full flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
                {(onOpenFarmerModal || onOpenChefModal || onOpenMercModal) && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className="hidden sm:inline text-[10px] font-extrabold text-[#94a3b8] shrink-0">
                            인력
                        </span>
                        {onOpenFarmerModal && (
                            <button
                                type="button"
                                onClick={onOpenFarmerModal}
                                className={neutralBtnClass}
                                title={
                                    isFarmerUnlocked
                                        ? '농부 길드 & 자동화 관리'
                                        : '아지트 Lv.20 달성 시 농부 고용 해금'
                                }
                            >
                                <span>👨‍🌾 농부</span>
                                {isFarmerUnlocked ? (
                                    <span className="font-mono text-[#64748b]">
                                        {farmers.length}/{profile.limits.maxFarmers}
                                    </span>
                                ) : (
                                    <span className="font-mono text-amber-700">🔒 Lv.20</span>
                                )}
                            </button>
                        )}
                        {onOpenChefModal && (
                            <button
                                type="button"
                                onClick={onOpenChefModal}
                                className={neutralBtnClass}
                                title="요리사 길드 관리"
                            >
                                <span>👨‍🍳 요리사</span>
                                <span className="font-mono text-[#64748b]">
                                    {chefs.length}/{profile.limits.maxChefs}
                                </span>
                            </button>
                        )}

                        {onOpenMercModal && (
                            <button
                                type="button"
                                onClick={onOpenMercModal}
                                className={neutralBtnClass}
                                title="용병 길드 관리"
                            >
                                <span>⚔️ 용병</span>
                                <span className="font-mono text-[#64748b]">
                                    {mercenaries.length}/{profile.limits.maxMercs}
                                </span>
                            </button>
                        )}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <span className="hidden sm:inline text-[10px] font-extrabold text-[#94a3b8] shrink-0">
                        거래·보관
                    </span>
                    <button
                        type="button"
                        onClick={onOpenMarketModal}
                        className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs transition-all cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                        title="작물·요리 장터"
                    >
                        <span>💰 장터</span>
                    </button>

                    {onOpenWarehouseModal && (
                        <button
                            type="button"
                            onClick={onOpenWarehouseModal}
                            className={neutralBtnClass}
                            title="농장 창고"
                        >
                            <span>🏚️ 창고</span>
                        </button>
                    )}

                    {onOpenShopModal && (
                        <button
                            type="button"
                            onClick={onOpenShopModal}
                            className={neutralBtnClass}
                            title="상점·보관함 (0원)"
                        >
                            <span>🎁 상점</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
