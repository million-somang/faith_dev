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
        isAudioOnlyMode,
        isCurrentTrackAudio,
        isFullStageMounted,
        setIsBuffering,
        setPlayerError,
        setIsPlaying,
        handleLoadedMetadata,
        handleTimeUpdate,
        handleMediaPlay,
        handleMediaPause,
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
            {shouldRenderGlobalAudio && currentTrack && (
                <audio
                    ref={videoRef as React.RefObject<HTMLAudioElement>}
                    key={`global-audio-${currentTrack.id}`}
                    src={currentTrack.streamUrl}
                    playsInline
                    preload="auto"
                    className="hidden"
                    onPlay={handleMediaPlay}
                    onPause={handleMediaPause}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => {
                        setIsBuffering(false);
                        setPlayerError(null);
                    }}
                    onCanPlay={() => setIsBuffering(false)}
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleVideoEnded}
                    onError={() => {
                        setIsBuffering(false);
                        setIsPlaying(false);
                        setPlayerError(
                            '오디오 스트림을 불러올 수 없습니다. 구글 드라이브 접근 권한을 다시 연결하거나 파일 공유 상태를 확인해 주세요.'
                        );
                    }}
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
