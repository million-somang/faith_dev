'use client';

import React, { createContext, useContext } from 'react';
import { useDriveVideoPlayer } from '@/hooks/useDriveVideoPlayer';

export type DrivePlayerContextValue = ReturnType<typeof useDriveVideoPlayer>;

const DrivePlayerContext = createContext<DrivePlayerContextValue | null>(null);

export const DrivePlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const player = useDriveVideoPlayer();

    const {
        videoRef,
        currentTrack,
        setIsBuffering,
        handleLoadedMetadata,
        handleTimeUpdate,
        handleMediaPlay,
        handleMediaPlaying,
        handleMediaPause,
        handleMediaError,
        handleVideoEnded,
    } = player;

    // 음악·비디오 구분 및 페이지 이동과 무관하게 전역 마스터 <audio> 엔진이 항상 마운트되어 사운드를 전담 출력합니다.
    // 모바일 OS는 화면을 끄면 <video> 태그를 강제 정지시키지만, 이미 재생 중인 <audio> 태그는 백그라운드에서 계속 재생됩니다.
    const shouldRenderGlobalAudio = Boolean(currentTrack);

    return (
        <DrivePlayerContext.Provider value={player}>
            {children}
            {shouldRenderGlobalAudio && currentTrack && (
                <audio
                    ref={videoRef as React.RefObject<HTMLAudioElement>}
                    src={currentTrack.streamUrl}
                    playsInline
                    preload="auto"
                    className="w-0 h-0 opacity-0 pointer-events-none fixed -z-10"
                    onPlay={handleMediaPlay}
                    onPause={handleMediaPause}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={handleMediaPlaying}
                    onCanPlay={() => setIsBuffering(false)}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onError={handleMediaError}
                />
            )}
        </DrivePlayerContext.Provider>
    );
};

export function useDrivePlayerContext(): DrivePlayerContextValue {
    const ctx = useContext(DrivePlayerContext);
    if (!ctx) {
        throw new Error('useDrivePlayerContext must be used within a DrivePlayerProvider');
    }
    return ctx;
}
