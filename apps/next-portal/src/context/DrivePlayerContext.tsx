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
        isPlaying,
        isAudioOnlyMode,
        isCurrentTrackAudio,
        isFullStageMounted,
        setIsBuffering,
        handleLoadedMetadata,
        handleTimeUpdate,
        handleMediaPlay,
        handleMediaPlaying,
        handleMediaCanPlay,
        handleMediaStalled,
        handleMediaPause,
        handleMediaError,
        handleVideoEnded,
    } = player;

    // 음악 파일이거나, '화면 끄고 듣기' 모드이거나, 마이페이지 비디오 탭이 아닌 다른 페이지(베라 홈/뉴스/게임 등)로 이동한 경우
    // 전역 Provider 내부의 단일 <audio> 엔진이 언마운트 없이 계속 스트리밍을 유지합니다.
    const shouldRenderGlobalAudio =
        Boolean(currentTrack) &&
        (isAudioOnlyMode || isCurrentTrackAudio || !isFullStageMounted);

    return (
        <DrivePlayerContext.Provider value={player}>
            {children}
            {Boolean(currentTrack) && currentTrack && (
                <audio
                    ref={
                        shouldRenderGlobalAudio
                            ? (videoRef as React.RefObject<HTMLAudioElement>)
                            : undefined
                    }
                    src={shouldRenderGlobalAudio ? currentTrack.streamUrl : undefined}
                    playsInline
                    preload={!shouldRenderGlobalAudio || !isPlaying ? 'none' : 'auto'}
                    className="fixed -bottom-20 left-0 w-px h-px opacity-0 pointer-events-none"
                    onPlay={shouldRenderGlobalAudio ? handleMediaPlay : undefined}
                    onPause={shouldRenderGlobalAudio ? handleMediaPause : undefined}
                    onWaiting={shouldRenderGlobalAudio ? () => setIsBuffering(true) : undefined}
                    onPlaying={shouldRenderGlobalAudio ? handleMediaPlaying : undefined}
                    onCanPlay={shouldRenderGlobalAudio ? handleMediaCanPlay : undefined}
                    onCanPlayThrough={shouldRenderGlobalAudio ? handleMediaCanPlay : undefined}
                    onLoadedData={shouldRenderGlobalAudio ? handleMediaCanPlay : undefined}
                    onLoadedMetadata={shouldRenderGlobalAudio ? handleLoadedMetadata : undefined}
                    onTimeUpdate={shouldRenderGlobalAudio ? handleTimeUpdate : undefined}
                    onStalled={shouldRenderGlobalAudio ? handleMediaStalled : undefined}
                    onEnded={shouldRenderGlobalAudio ? handleVideoEnded : undefined}
                    onError={shouldRenderGlobalAudio ? handleMediaError : undefined}
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
