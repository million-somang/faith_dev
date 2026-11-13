'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    formatDuration,
    formatFileSize,
    isAudioMedia,
} from '@/hooks/useDriveVideoPlayer';
import { useDrivePlayerContext } from '@/context/DrivePlayerContext';
import { DriveFilePickerModal } from './DriveFilePickerModal';

const PLAYBACK_RATES: readonly number[] = [0.5, 1, 1.25, 1.5, 2];

export const DriveVideoPlayerSection: React.FC = () => {
    const {
        videoRef,
        playerContainerRef,
        googleClientId,
        googleClientSecret,
        currentOrigin,
        isDriveConnected,
        isPermanentConnected,
        isPickerOpen,
        setIsPickerOpen,
        isClientConfigOpen,
        setIsClientConfigOpen,
        isShareLinkModalOpen,
        setIsShareLinkModalOpen,
        connectAndOpenDrivePicker,
        forceReconnectDrive,
        saveGoogleClientId,
        explorerTab,
        handleChangeExplorerTab,
        breadcrumbs,
        openDriveFolder,
        navigateToBreadcrumb,
        driveItems,
        selectedDriveMap,
        driveSearchQuery,
        setDriveSearchQuery,
        isLoadingDrive,
        isLoadingFolderBatch,
        driveError,
        toggleSelectDriveVideo,
        selectAllVideosInCurrentView,
        clearDriveSelection,
        addSelectedDriveVideosToPlaylist,
        addEntireFolderToPlaylist,
        addDriveSharedLink,
        handleAddLocalFiles,
        playlist,
        currentIndex,
        currentTrack,
        isCurrentTrackAudio,
        isPlaying,
        setIsPlaying,
        isShuffle,
        repeatMode,
        volume,
        isMuted,
        currentTime,
        duration,
        playbackRate,
        isFullscreen,
        isAudioOnlyMode,
        isPipActive,
        mountFullStage,
        unmountFullStage,
        isBuffering,
        setIsBuffering,
        playerError,
        setPlayerError,
        toastNotice,
        togglePlayPause,
        stopPlayback,
        playTrackAtIndex,
        playNext,
        playPrev,
        toggleShuffle,
        cycleRepeatMode,
        handleSeekChange,
        seekRelative,
        handleVolumeChange,
        toggleMute,
        handlePlaybackRateChange,
        toggleFullscreen,
        toggleAudioOnlyMode,
        togglePip,
        handleLoadedMetadata,
        handleTimeUpdate,
        handleMediaPlay,
        handleMediaPlaying,
        handleMediaPause,
        handleMediaError,
        handleVideoEnded,
        removePlaylistItem,
        clearPlaylist,
    } = useDrivePlayerContext();

    useEffect(() => {
        mountFullStage();
        return () => {
            unmountFullStage();
        };
    }, [mountFullStage, unmountFullStage]);

    const localFileInputRef = useRef<HTMLInputElement | null>(null);
    const [clientIdDraft, setClientIdDraft] = useState<string>(googleClientId);
    const [clientSecretDraft, setClientSecretDraft] = useState<string>(googleClientSecret);
    const [shareUrlDraft, setShareUrlDraft] = useState<string>('');
    const [shareTitleDraft, setShareTitleDraft] = useState<string>('');
    const [copiedOrigin, setCopiedOrigin] = useState<boolean>(false);

    const handleCopyOrigin = async () => {
        const originToCopy = currentOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
        if (!originToCopy) return;
        try {
            await navigator.clipboard.writeText(originToCopy);
            setCopiedOrigin(true);
            setTimeout(() => setCopiedOrigin(false), 2500);
        } catch (_) {}
    };

    const effectiveVolume = isMuted ? 0 : volume;
    const volumePercent = Math.round(effectiveVolume * 100);
    const isEffectiveAudioMode = isAudioOnlyMode || isCurrentTrackAudio;

    const handleOpenClientConfig = () => {
        setClientIdDraft(googleClientId);
        setClientSecretDraft(googleClientSecret);
        setIsClientConfigOpen(true);
    };

    const handleSaveClientConfigSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveGoogleClientId(clientIdDraft, clientSecretDraft);
    };

    const handleAddShareLinkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const ok = addDriveSharedLink(shareUrlDraft, shareTitleDraft);
        if (ok) {
            setShareUrlDraft('');
            setShareTitleDraft('');
        }
    };

    return (
        <section
            aria-label="구글 드라이브 연동 멀티 비디오 및 음악 플레이어"
            className="animate-fade-in space-y-6"
        >
            {/* 토스트 알림 */}
            {toastNotice && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-indigo-400/40">
                    {toastNotice}
                </div>
            )}

            {/* ─── 상단 헤더 & 구글 드라이브 소스 연동 툴바 ─── */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xl shadow-md shrink-0">
                        <i className="fab fa-google-drive"></i>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                                구글 드라이브 비디오 · 음악 플레이어
                            </h2>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 ${
                                    isDriveConnected
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        isDriveConnected ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                ></span>
                                <span>
                                    {isDriveConnected
                                        ? isPermanentConnected
                                            ? 'Google 드라이브 영구 자동연결 활성'
                                            : 'Google 드라이브 로그인 연동됨'
                                        : 'Google 드라이브 연동 가능'}
                                </span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            로그인된 구글 드라이브에서 폴더 및 여러 동영상·음악(MP3·FLAC·M4A 등) 파일을 선택해 연속·랜덤·백그라운드 재생으로 감상하세요.
                        </p>
                    </div>
                </div>

                {/* 소스 선택 버튼 그룹 */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={connectAndOpenDrivePicker}
                        className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <i className="fab fa-google-drive text-sm"></i>
                        <span>
                            {isDriveConnected
                                ? '구글 드라이브 폴더·파일 선택'
                                : '구글 드라이브 연결 및 파일 선택'}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={forceReconnectDrive}
                        className="px-3.5 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="구글 드라이브 계정을 다시 로그인하거나 다른 구글 계정으로 전환합니다"
                    >
                        <i className="fas fa-sync-alt text-amber-600"></i>
                        <span>구글 재로그인</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsShareLinkModalOpen(true)}
                        className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <i className="fas fa-link text-indigo-500"></i>
                        <span>드라이브 링크 추가</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => localFileInputRef.current?.click()}
                        className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                        <i className="fas fa-folder-plus text-emerald-600"></i>
                        <span>내 기기 영상·음악 선택</span>
                    </button>
                    <input
                        ref={localFileInputRef}
                        type="file"
                        accept="video/*,audio/*,.mp3,.m4a,.flac,.wav,.ogg,.aac,.wma,.opus,.mp4,.mkv,.webm,.mov"
                        multiple
                        onChange={(e) => {
                            handleAddLocalFiles(e.target.files);
                            e.target.value = '';
                        }}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={handleOpenClientConfig}
                        className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="구글 드라이브 OAuth Client ID 설정"
                    >
                        <i className="fas fa-cog text-xs"></i>
                    </button>
                </div>
            </div>

            {/* ─── 메인 12컬럼 레이아웃: 좌측 비디오 플레이어(8) + 우측 멀티 재생목록(4) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1) 좌측 비디오 스테이지 & 커스텀 컨트롤 바 (전체화면 컨테이너) */}
                <div
                    ref={playerContainerRef}
                    className={`lg:col-span-8 bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-xl flex flex-col justify-between ${
                        isFullscreen ? 'w-screen h-screen rounded-none border-none' : ''
                    }`}
                >
                    {/* 상단 현재 재생 중인 파일 헤더 바 */}
                    <div className="px-4 sm:px-5 py-3 bg-slate-900/95 border-b border-slate-800 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black shrink-0">
                                {currentTrack
                                    ? `${currentIndex + 1} / ${playlist.length}`
                                    : 'READY'}
                            </span>
                            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">
                                {currentTrack
                                    ? currentTrack.name
                                    : '재생할 동영상·음악 파일을 구글 드라이브에서 선택해 주세요'}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {isCurrentTrackAudio ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center gap-1">
                                    <i className="fas fa-music text-[9px]"></i>
                                    <span>음악 스트리밍</span>
                                </span>
                            ) : (
                                isAudioOnlyMode && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black flex items-center gap-1">
                                        <i className="fas fa-headphones-alt text-[9px]"></i>
                                        <span>화면 끄고 듣기 ON</span>
                                    </span>
                                )
                            )}
                            {isShuffle && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                                    <i className="fas fa-random text-[9px]"></i>
                                    <span>랜덤 재생 중</span>
                                </span>
                            )}
                            {currentTrack?.folderName && (
                                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                                    📁 {currentTrack.folderName}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* 중앙 비디오 / 백그라운드 오디오 렌더링 영역 */}
                    <div
                        className={`relative bg-black flex items-center justify-center select-none ${
                            isFullscreen ? 'flex-1 min-h-0' : 'aspect-video w-full'
                        }`}
                    >
                        {currentTrack ? (
                            <>
                                {isEffectiveAudioMode ? (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-900">
                                        <div
                                            onClick={togglePlayPause}
                                            className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl sm:text-4xl shadow-2xl border-2 cursor-pointer transition-all ${
                                                isPlaying
                                                    ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-300/60 scale-105 shadow-amber-500/30'
                                                    : 'bg-slate-800/90 text-slate-300 border-slate-600 hover:bg-slate-700'
                                            }`}
                                            title={isPlaying ? '일시정지' : '재생'}
                                        >
                                            <i
                                                className={`fas ${
                                                    isPlaying
                                                        ? isCurrentTrackAudio
                                                            ? 'fa-music animate-bounce'
                                                            : 'fa-headphones-alt animate-pulse'
                                                        : 'fa-play ml-1'
                                                }`}
                                            ></i>
                                        </div>

                                        <div className="mt-4 space-y-1.5 max-w-md px-2">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-black">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${
                                                        isPlaying
                                                            ? 'bg-emerald-400 animate-ping'
                                                            : 'bg-slate-400'
                                                    }`}
                                                ></span>
                                                <span>
                                                    {isCurrentTrackAudio
                                                        ? '🎵 뮤직·오디오 스트리밍 모드 (다른 페이지 이동·화면 잠금 연속재생)'
                                                        : '🎧 백그라운드 오디오 전용 모드 (다른 페이지 이동·화면 잠금 연속재생)'}
                                                </span>
                                            </div>
                                            <h4 className="text-sm sm:text-base font-black text-white line-clamp-1">
                                                {currentTrack.name}
                                            </h4>
                                            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                                                베라 홈페이지의 다른 메뉴(홈·뉴스·게임·가이드)로 이동하거나 핸드폰 화면을 닫아도 끊김 없이 연속 재생됩니다.
                                            </p>
                                        </div>

                                        {!isCurrentTrackAudio && (
                                            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={toggleAudioOnlyMode}
                                                    className="px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-600 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                                                >
                                                    <i className="fas fa-video text-indigo-400"></i>
                                                    <span>비디오 화면 다시 켜기</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <video
                                        ref={videoRef}
                                        src={currentTrack.streamUrl}
                                        className="w-full h-full max-h-full object-contain cursor-pointer"
                                        playsInline
                                        preload="auto"
                                        onClick={togglePlayPause}
                                        onDoubleClick={toggleFullscreen}
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

                                {/* 버퍼링 로딩 스피너 */}
                                {isBuffering && (
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                        <div className="w-11 h-11 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-bold text-white/90">
                                            스트리밍 버퍼링 중...
                                        </span>
                                    </div>
                                )}

                                {/* 일시정지 시 중앙 대형 재생 버튼 오버레이 (비디오 모드일 때만) */}
                                {!isEffectiveAudioMode && !isPlaying && !isBuffering && !playerError && (
                                    <button
                                        type="button"
                                        onClick={togglePlayPause}
                                        className="absolute w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center text-2xl shadow-2xl border-2 border-white/30 transition-transform hover:scale-105 cursor-pointer"
                                        aria-label="재생"
                                    >
                                        <i className="fas fa-play ml-1"></i>
                                    </button>
                                )}

                                {/* 스트리밍 에러 발생 시 안내 오버레이 */}
                                {playerError && (
                                    <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-xl">
                                            <i className="fas fa-exclamation-circle"></i>
                                        </div>
                                        <p className="text-xs sm:text-sm font-bold text-slate-200 max-w-md">
                                            {playerError}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={forceReconnectDrive}
                                                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black cursor-pointer"
                                            >
                                                구글 드라이브 다시 연결
                                            </button>
                                            {playlist.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={playNext}
                                                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold cursor-pointer"
                                                >
                                                    다음 영상으로 건너뛰기 →
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* 재생목록이 비어있을 때 초기 안내 화면 */
                            <div className="p-8 text-center space-y-4 max-w-md">
                                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 text-indigo-400 flex items-center justify-center text-2xl mx-auto shadow-inner">
                                    <i className="fas fa-film"></i>
                                </div>
                                <div className="space-y-1.5">
                                    <h4 className="text-base sm:text-lg font-black text-white">
                                        구글 드라이브 동영상을 선택해 보세요
                                    </h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        로그인된 구글 드라이브에서 폴더를 통째로 불러오거나 여러 비디오 파일을 한 번에 선택해 연속·랜덤 재생할 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                    <button
                                        type="button"
                                        onClick={connectAndOpenDrivePicker}
                                        className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 cursor-pointer"
                                    >
                                        <i className="fab fa-google-drive"></i>
                                        <span>구글 드라이브 폴더·파일 열기</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => localFileInputRef.current?.click()}
                                        className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <i className="fas fa-upload"></i>
                                        <span>내 기기 동영상 열기</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ─── 곰플레이어(GOM Player) 스타일 2단 정렬 컨트롤 데크 (윗줄: 재생 컨트롤 / 아랫줄: 옵션·볼륨) ─── */}
                    <div className="bg-slate-950 border-t border-slate-800/90 select-none">
                        {/* [상단 시크바] 가로 100% 풀와이드 프로그레스 게이지 */}
                        <div className="relative group h-5 flex items-center px-3 sm:px-4 pt-2 cursor-pointer">
                            <div className="relative w-full h-1.5 group-hover:h-2.5 bg-slate-800 rounded-full overflow-hidden transition-all">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-indigo-500 rounded-full transition-all duration-100"
                                    style={{
                                        width: `${
                                            duration > 0
                                                ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
                                                : 0
                                        }%`,
                                    }}
                                />
                            </div>
                            <input
                                type="range"
                                aria-label="동영상 진행 바"
                                min={0}
                                max={duration > 0 ? duration : 100}
                                step={0.1}
                                disabled={!currentTrack}
                                value={duration > 0 ? Math.min(currentTime, duration) : 0}
                                onChange={(e) => handleSeekChange(Number(e.target.value))}
                                className="absolute inset-x-3 sm:inset-x-4 inset-y-0 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* [윗줄 (1행)] 메인 재생·탐색 컨트롤 & 디지털 타임코드 */}
                        <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
                            {/* 좌측: 이전 / -10초 / 재생·일시정지 / 정지 / +10초 / 다음 */}
                            <div className="flex items-center gap-1 sm:gap-1.5">
                                <button
                                    type="button"
                                    onClick={playPrev}
                                    disabled={playlist.length === 0}
                                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white disabled:opacity-35 flex items-center justify-center transition-colors cursor-pointer"
                                    title="이전 곡/영상"
                                >
                                    <i className="fas fa-step-backward text-xs"></i>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => seekRelative(-10)}
                                    disabled={!currentTrack}
                                    className="px-2.5 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-35 text-[11px] font-mono font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="10초 뒤로"
                                >
                                    <i className="fas fa-undo text-[10px]"></i>
                                    <span>10s</span>
                                </button>

                                {/* 메인 재생 / 일시정지 버튼 */}
                                <button
                                    type="button"
                                    onClick={togglePlayPause}
                                    disabled={!currentTrack}
                                    className={`w-12 h-9 rounded-xl flex items-center justify-center shadow-md transition-all cursor-pointer disabled:opacity-35 ${
                                        isPlaying
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                    }`}
                                    title={isPlaying ? '일시정지' : '재생'}
                                >
                                    <i
                                        className={`fas ${
                                            isPlaying ? 'fa-pause' : 'fa-play ml-0.5'
                                        } text-sm`}
                                    ></i>
                                </button>

                                {/* 정지(Stop) 버튼 */}
                                <button
                                    type="button"
                                    onClick={stopPlayback}
                                    disabled={!currentTrack}
                                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 disabled:opacity-35 flex items-center justify-center transition-colors cursor-pointer"
                                    title="정지 (처음으로)"
                                >
                                    <i className="fas fa-stop text-xs"></i>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => seekRelative(10)}
                                    disabled={!currentTrack}
                                    className="px-2.5 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-35 text-[11px] font-mono font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="10초 앞으로"
                                >
                                    <span>10s</span>
                                    <i className="fas fa-redo text-[10px]"></i>
                                </button>

                                <button
                                    type="button"
                                    onClick={playNext}
                                    disabled={playlist.length === 0}
                                    className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white disabled:opacity-35 flex items-center justify-center transition-colors cursor-pointer"
                                    title="다음 곡/영상"
                                >
                                    <i className="fas fa-step-forward text-xs"></i>
                                </button>
                            </div>

                            {/* 우측: 곰플레이어식 디지털 타임코드 표시창 */}
                            <div className="flex items-center gap-1.5 px-3 h-9 rounded-xl bg-slate-900 border border-slate-800 font-mono text-xs tabular-nums shrink-0">
                                <span className="font-extrabold text-amber-400">
                                    {formatDuration(currentTime)}
                                </span>
                                <span className="text-slate-600">/</span>
                                <span className="font-semibold text-slate-400">
                                    {formatDuration(duration)}
                                </span>
                            </div>
                        </div>

                        {/* [아랫줄 (2행)] 옵션 버튼(랜덤·반복·백그라운드) & 사운드·화면 제어 */}
                        <div className="px-3 sm:px-4 py-2.5 bg-slate-900/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                            {/* 좌측: 모드 옵션 3종 (균일한 다크 메탈릭 캡슐 + LED 상태 표시) */}
                            <div className="flex items-center gap-1.5">
                                {/* 1. 랜덤 재생 토글 */}
                                <button
                                    type="button"
                                    onClick={toggleShuffle}
                                    className={`px-2.5 sm:px-3 h-8 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                                        isShuffle
                                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50'
                                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                                    }`}
                                    title="랜덤 재생(셔플) 켜기/끄기"
                                >
                                    <i className="fas fa-random text-[10px]"></i>
                                    <span>랜덤</span>
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            isShuffle ? 'bg-emerald-400' : 'bg-slate-700'
                                        }`}
                                    ></span>
                                </button>

                                {/* 2. 반복 모드 토글 */}
                                <button
                                    type="button"
                                    onClick={cycleRepeatMode}
                                    className={`px-2.5 sm:px-3 h-8 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                                        repeatMode !== 'off'
                                            ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/50'
                                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                                    }`}
                                    title="반복 재생 모드 전환"
                                >
                                    <i className="fas fa-redo-alt text-[10px]"></i>
                                    <span>
                                        {repeatMode === 'all'
                                            ? '전체반복'
                                            : repeatMode === 'one'
                                            ? '1곡반복'
                                            : '반복꺼짐'}
                                    </span>
                                </button>

                                {/* 3. 화면 끄고 듣기 (백그라운드 모드) 토글 */}
                                <button
                                    type="button"
                                    onClick={toggleAudioOnlyMode}
                                    className={`px-2.5 sm:px-3 h-8 rounded-xl text-[11px] font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                                        isAudioOnlyMode
                                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/50'
                                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800'
                                    }`}
                                    title="핸드폰 화면을 닫거나 다른 페이지로 이동해도 백그라운드에서 계속 재생합니다"
                                >
                                    <i className="fas fa-headphones-alt text-[10px]"></i>
                                    <span>화면끄고 듣기</span>
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            isAudioOnlyMode ? 'bg-amber-400' : 'bg-slate-700'
                                        }`}
                                    ></span>
                                </button>
                            </div>

                            {/* 우측: 볼륨 슬라이더 + 배속 + PIP + 전체화면 */}
                            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                                {/* 볼륨 슬라이더 캡슐 */}
                                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 h-8 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className="text-slate-300 hover:text-white w-4 text-center cursor-pointer"
                                        title={isMuted ? '음소거 해제' : '음소거'}
                                    >
                                        <i
                                            className={`fas ${
                                                effectiveVolume === 0
                                                    ? 'fa-volume-mute text-rose-400'
                                                    : effectiveVolume < 0.5
                                                    ? 'fa-volume-down text-amber-400'
                                                    : 'fa-volume-up text-amber-400'
                                            } text-[11px]`}
                                        ></i>
                                    </button>
                                    <input
                                        type="range"
                                        aria-label="볼륨 조절 바"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={effectiveVolume}
                                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                                        className="w-16 sm:w-20 h-1 bg-slate-700 rounded-lg cursor-pointer accent-amber-400"
                                    />
                                    <span className="text-[10px] font-mono font-bold text-slate-400 w-7 text-right tabular-nums">
                                        {volumePercent}%
                                    </span>
                                </div>

                                {/* 재생 배속 선택 */}
                                <select
                                    aria-label="재생 배속"
                                    value={playbackRate}
                                    onChange={(e) =>
                                        handlePlaybackRateChange(Number(e.target.value))
                                    }
                                    className="h-8 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-[11px] font-mono font-extrabold focus:outline-none cursor-pointer"
                                    title="재생 배속"
                                >
                                    {PLAYBACK_RATES.map((rate) => (
                                        <option
                                            key={rate}
                                            value={rate}
                                            className="bg-slate-900 text-slate-200"
                                        >
                                            {rate}x
                                        </option>
                                    ))}
                                </select>

                                {/* 미니창(PIP) 버튼 */}
                                {!isAudioOnlyMode && !isCurrentTrackAudio && (
                                    <button
                                        type="button"
                                        onClick={togglePip}
                                        disabled={!currentTrack}
                                        className={`px-2.5 h-8 rounded-xl border text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-35 ${
                                            isPipActive
                                                ? 'bg-violet-600 text-white border-violet-500'
                                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                                        }`}
                                        title="미니 팝업창(PIP) 띄우기"
                                    >
                                        <i className="fas fa-clone text-[10px]"></i>
                                        <span className="hidden sm:inline">PIP</span>
                                    </button>
                                )}

                                {/* 전체화면 버튼 */}
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="px-3 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                                    title={isFullscreen ? '전체화면 종료 (ESC)' : '전체화면'}
                                >
                                    <i
                                        className={`fas ${
                                            isFullscreen ? 'fa-compress' : 'fa-expand'
                                        } text-[11px]`}
                                    ></i>
                                    <span className="hidden sm:inline">
                                        {isFullscreen ? '축소' : '전체화면'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2) 우측 멀티 비디오·음악 재생목록(Playlist) 패널 */}
                <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                                <i className="fas fa-list-ul text-indigo-600"></i>
                                <span>선택된 영상 · 음악 목록</span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-black">
                                    {playlist.length}
                                </span>
                            </h3>
                            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                                클릭하여 즉시 재생 · 랜덤 재생 시 무작위 순서로 자동 전환됩니다.
                            </p>
                        </div>

                        {playlist.length > 0 && (
                            <button
                                type="button"
                                onClick={clearPlaylist}
                                className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            >
                                전체 비우기
                            </button>
                        )}
                    </div>

                    {/* 플레이리스트 아이템 스크롤 영역 */}
                    <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                        {playlist.length === 0 ? (
                            <div className="py-12 px-4 text-center space-y-3">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-lg">
                                    <i className="fas fa-music"></i>
                                </div>
                                <div className="text-xs font-bold text-slate-600">
                                    아직 선택된 동영상·음악 파일이 없습니다.
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    [구글 드라이브 폴더·파일 선택] 버튼을 눌러 여러 개의 동영상·음악(MP3 등)이나 폴더 전체를 담아보세요!
                                </p>
                            </div>
                        ) : (
                            playlist.map((item, idx) => {
                                const isActive = idx === currentIndex;
                                const itemIsAudio = isAudioMedia(item.mimeType, item.name);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => playTrackAtIndex(idx)}
                                        className={`flex items-center justify-between gap-2.5 p-2.5 rounded-2xl border transition-all cursor-pointer group ${
                                            isActive
                                                ? 'bg-indigo-50/90 border-indigo-400 shadow-2xs'
                                                : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/70'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                            <div
                                                className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                                                    isActive
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-white text-slate-500 border border-slate-200'
                                                }`}
                                            >
                                                {isActive && isPlaying ? (
                                                    <i className="fas fa-volume-up text-[10px] animate-pulse"></i>
                                                ) : (
                                                    idx + 1
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div
                                                    className={`text-xs font-extrabold truncate ${
                                                        isActive
                                                            ? 'text-indigo-950'
                                                            : 'text-slate-800'
                                                    }`}
                                                >
                                                    {item.name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold mt-0.5">
                                                    <span
                                                        className={
                                                            itemIsAudio
                                                                ? 'text-amber-600 font-extrabold'
                                                                : 'text-indigo-600 font-bold'
                                                        }
                                                    >
                                                        {itemIsAudio ? '🎵 음악' : '🎬 영상'}
                                                    </span>
                                                    <span>
                                                        •{' '}
                                                        {item.sourceType === 'google-drive'
                                                            ? 'Google Drive'
                                                            : '내 기기'}
                                                    </span>
                                                    {item.folderName && (
                                                        <span className="truncate max-w-[90px]">
                                                            • {item.folderName}
                                                        </span>
                                                    )}
                                                    {item.durationMs && (
                                                        <span>
                                                            • {formatDuration(item.durationMs / 1000)}
                                                        </span>
                                                    )}
                                                    {item.sizeBytes && (
                                                        <span>• {formatFileSize(item.sizeBytes)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removePlaylistItem(item.id);
                                            }}
                                            className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                                            title="목록에서 제거"
                                        >
                                            <i className="fas fa-times text-xs"></i>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* 플레이리스트 하단 빠른 액션 */}
                    <div className="p-3.5 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={connectAndOpenDrivePicker}
                            className="py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <i className="fas fa-plus"></i>
                            <span>드라이브 파일 추가</span>
                        </button>
                        <button
                            type="button"
                            onClick={toggleShuffle}
                            className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                                isShuffle
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                        >
                            <i className="fas fa-random"></i>
                            <span>{isShuffle ? '랜덤 재생 켜짐' : '랜덤 재생 켜기'}</span>
                        </button>
                    </div>
                </aside>
            </div>

            {/* ─── 모달 1: 구글 드라이브 폴더·파일 다중 선택 탐색기 ─── */}
            <DriveFilePickerModal
                isOpen={isPickerOpen}
                onClose={() => setIsPickerOpen(false)}
                explorerTab={explorerTab}
                onChangeTab={handleChangeExplorerTab}
                breadcrumbs={breadcrumbs}
                onNavigateBreadcrumb={navigateToBreadcrumb}
                onOpenFolder={openDriveFolder}
                driveItems={driveItems}
                selectedDriveMap={selectedDriveMap}
                onToggleSelectVideo={toggleSelectDriveVideo}
                onSelectAllCurrentView={selectAllVideosInCurrentView}
                onClearSelection={clearDriveSelection}
                onAddSelectedVideos={addSelectedDriveVideosToPlaylist}
                onAddEntireFolder={addEntireFolderToPlaylist}
                searchQuery={driveSearchQuery}
                onChangeSearchQuery={setDriveSearchQuery}
                isLoading={isLoadingDrive}
                isLoadingFolderBatch={isLoadingFolderBatch}
                error={driveError}
                onRetryConnect={forceReconnectDrive}
            />

            {/* ─── 모달 2: 구글 드라이브 공유 링크 / 파일 ID 직접 추가 ─── */}
            {isShareLinkModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <i className="fas fa-link text-indigo-600"></i>
                                <span>구글 드라이브 비디오 링크 추가</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsShareLinkModalOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        </div>

                        <form onSubmit={handleAddShareLinkSubmit} className="space-y-3">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                                    구글 드라이브 파일 공유 URL 또는 파일 ID
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={shareUrlDraft}
                                    onChange={(e) => setShareUrlDraft(e.target.value)}
                                    placeholder="https://drive.google.com/file/d/.../view"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                                    표시할 비디오 제목 (선택사항)
                                </label>
                                <input
                                    type="text"
                                    value={shareTitleDraft}
                                    onChange={(e) => setShareTitleDraft(e.target.value)}
                                    placeholder="예: 내 드라이브 강의 영상 1편"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsShareLinkModalOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
                                >
                                    재생목록에 추가
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── 모달 3: Google OAuth 2.0 Client ID 설정 ─── */}
            {isClientConfigOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                                <i className="fab fa-google text-indigo-600"></i>
                                <span>구글 드라이브 OAuth 연동 설정</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsClientConfigOpen(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
                            >
                                <i className="fas fa-times text-xs"></i>
                            </button>
                        </div>

                        {/* origin_mismatch 오류 해결 원클릭 가이드 */}
                        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-2.5 leading-relaxed">
                            <div className="flex items-center gap-1.5 font-black text-amber-900">
                                <i className="fas fa-exclamation-triangle text-amber-600"></i>
                                <span>‘400 오류: origin_mismatch’ 해결 방법</span>
                            </div>
                            <p className="text-[11px] text-amber-800">
                                구글의 보안 정책상 Google Cloud Console에 현재 사이트 주소가 <strong>‘승인된 자바스크립트 원본’</strong>으로 등록되어 있어야 로그인 팝업이 허용됩니다.
                            </p>

                            <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">등록할 출처 URI</div>
                                    <div className="font-mono font-black text-indigo-700 text-xs truncate">
                                        {currentOrigin || (typeof window !== 'undefined' ? window.location.origin : 'https://veranex.app')}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyOrigin}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                        copiedOrigin
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                    }`}
                                >
                                    <i className={`fas ${copiedOrigin ? 'fa-check' : 'fa-copy'}`}></i>
                                    <span>{copiedOrigin ? '복사됨!' : '주소 복사'}</span>
                                </button>
                            </div>

                            <div className="text-[11px] text-slate-600 space-y-1 pt-1">
                                <p>1. 아래 버튼을 눌러 Google Cloud Console의 <strong>‘사용자 인증 정보’</strong>로 이동합니다.</p>
                                <p>2. <strong>Web client</strong>(웹 애플리케이션) 우측의 <strong>연필(수정) 아이콘</strong>을 클릭합니다.</p>
                                <p>3. <strong>‘승인된 자바스크립트 원본’</strong> 항목에 위 복사한 주소를 추가하고 <strong>[저장]</strong>을 누릅니다.</p>
                            </div>

                            <a
                                href="https://console.cloud.google.com/apis/credentials"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs transition-colors"
                            >
                                <i className="fas fa-external-link-alt text-[10px]"></i>
                                <span>Google Cloud 사용자 인증 정보 콘솔 열기 ↗</span>
                            </a>
                        </div>

                        <form onSubmit={handleSaveClientConfigSubmit} className="space-y-3.5 pt-1">
                            <div>
                                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                                    Google OAuth 2.0 Client ID
                                </label>
                                <input
                                    type="text"
                                    value={clientIdDraft}
                                    onChange={(e) => setClientIdDraft(e.target.value)}
                                    placeholder="1234567890-abcdefg.apps.googleusercontent.com"
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    콘솔에 표시된 클라이언트 ID 전체(예: <span className="font-mono text-slate-600">715992191539-...apps.googleusercontent.com</span>)를 입력하세요.
                                </p>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-extrabold text-slate-700">
                                        Google OAuth Client Secret <span className="text-indigo-600 font-black">(1시간 끊김 없는 영구 자동연결용 · 권장)</span>
                                    </label>
                                    {isPermanentConnected && (
                                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                                            영구 토큰 활성됨
                                        </span>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    value={clientSecretDraft}
                                    onChange={(e) => setClientSecretDraft(e.target.value)}
                                    placeholder="GOCSPX-..."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    콘솔 우측의 <strong>클라이언트 보안 비밀번호(<span className="font-mono">GOCSPX-...</span>)</strong>를 함께 저장한 뒤 <strong>[구글 재로그인]</strong>을 1회 완료하면, 서버가 오프라인 갱신 토큰(<span className="font-mono">refresh_token</span>)을 보관하여 <strong>1시간이 지나도 재로그인 없이 영구적으로 자동 연결</strong>됩니다.
                                </p>
                            </div>

                            <div className="pt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsClientConfigOpen(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
                                >
                                    닫기
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
                                >
                                    저장하기
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};
