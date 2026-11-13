'use client';

import React from 'react';
import Link from 'next/link';
import { useDrivePlayerContext } from '@/context/DrivePlayerContext';
import { formatDuration } from '@/hooks/useDriveVideoPlayer';

export const GlobalMiniPlayerBar: React.FC = () => {
    const {
        currentTrack,
        playlist,
        currentIndex,
        isPlaying,
        isShuffle,
        currentTime,
        duration,
        isFullStageMounted,
        isMiniBarDismissed,
        isCurrentTrackAudio,
        togglePlayPause,
        playPrev,
        playNext,
        toggleShuffle,
        handleSeekChange,
        dismissMiniBar,
    } = useDrivePlayerContext();

    if (
        !currentTrack ||
        isFullStageMounted ||
        isMiniBarDismissed ||
        (!isPlaying && currentTime <= 0)
    ) {
        return null;
    }

    const progressPercent =
        duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

    return (
        <div
            role="region"
            aria-label="전역 미니 미디어 플레이어"
            className="fixed bottom-16 md:bottom-4 left-0 right-0 z-40 pointer-events-none"
        >
            <div className="max-w-6xl mx-auto px-3 sm:px-4 w-full">
                <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-2xl border border-slate-700/90 shadow-2xl overflow-hidden">
                    {/* 상단 슬림 진행 바 */}
                    <div className="relative h-1.5 bg-slate-800 w-full">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-400 transition-all duration-150"
                            style={{ width: `${progressPercent}%` }}
                        />
                        <input
                            type="range"
                            aria-label="미니 플레이어 재생 위치 이동"
                            min={0}
                            max={duration > 0 ? duration : 100}
                            step={0.5}
                            value={duration > 0 ? Math.min(currentTime, duration) : 0}
                            onChange={(e) => handleSeekChange(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>

                    <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3">
                        {/* 좌측: 아이콘 + 곡 제목 + 재생 시간 */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <button
                                type="button"
                                onClick={togglePlayPause}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform cursor-pointer ${
                                    isPlaying
                                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                                title={isPlaying ? '일시정지' : '재생'}
                            >
                                <i
                                    className={`fas ${
                                        isPlaying
                                            ? isCurrentTrackAudio
                                                ? 'fa-music animate-bounce'
                                                : 'fa-headphones-alt animate-pulse'
                                            : 'fa-play ml-0.5'
                                    } text-sm`}
                                ></i>
                            </button>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black shrink-0">
                                        {currentIndex + 1}/{playlist.length}
                                    </span>
                                    <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                                        {currentTrack.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-semibold mt-0.5">
                                    <span className="font-mono text-amber-300">
                                        {formatDuration(currentTime)} / {formatDuration(duration)}
                                    </span>
                                    {currentTrack.folderName && (
                                        <span className="hidden sm:inline truncate max-w-[160px]">
                                            • 📁 {currentTrack.folderName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 우측: 컨트롤 버튼 그룹 */}
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={playPrev}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                                title="이전 곡"
                            >
                                <i className="fas fa-step-backward text-xs"></i>
                            </button>

                            <button
                                type="button"
                                onClick={togglePlayPause}
                                className="w-9 h-8 sm:w-10 sm:h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-sm transition-colors cursor-pointer"
                                title={isPlaying ? '일시정지' : '재생'}
                            >
                                <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xs`}></i>
                            </button>

                            <button
                                type="button"
                                onClick={playNext}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                                title="다음 곡"
                            >
                                <i className="fas fa-step-forward text-xs"></i>
                            </button>

                            <button
                                type="button"
                                onClick={toggleShuffle}
                                className={`hidden sm:flex w-9 h-9 rounded-xl items-center justify-center border transition-colors cursor-pointer ${
                                    isShuffle
                                        ? 'bg-emerald-600 text-white border-emerald-500'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                                }`}
                                title="랜덤 재생 켜기/끄기"
                            >
                                <i className="fas fa-random text-xs"></i>
                            </button>

                            <Link
                                href="/mypage?section=video"
                                className="px-2.5 sm:px-3 h-8 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 text-[11px] font-extrabold flex items-center gap-1 transition-colors"
                                title="전체 플레이어 화면 열기"
                            >
                                <i className="fas fa-expand-alt text-[10px]"></i>
                                <span className="hidden md:inline">플레이어 열기</span>
                            </Link>

                            <button
                                type="button"
                                onClick={dismissMiniBar}
                                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800/80 hover:bg-rose-600/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                                title="재생 정지 및 미니 플레이어 닫기"
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
