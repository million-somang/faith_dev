'use client';

import React, { useRef, useState } from 'react';
import {
    useDriveVideoPlayer,
    formatDuration,
    formatFileSize,
} from '@/hooks/useDriveVideoPlayer';
import { DriveFilePickerModal } from './DriveFilePickerModal';

const PLAYBACK_RATES: readonly number[] = [0.5, 1, 1.25, 1.5, 2];

export const DriveVideoPlayerSection: React.FC = () => {
    const {
        videoRef,
        playerContainerRef,
        googleClientId,
        currentOrigin,
        isDriveConnected,
        isPickerOpen,
        setIsPickerOpen,
        isClientConfigOpen,
        setIsClientConfigOpen,
        isShareLinkModalOpen,
        setIsShareLinkModalOpen,
        connectAndOpenDrivePicker,
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
        isPlaying,
        setIsPlaying,
        isShuffle,
        repeatMode,
        volume,
        isMuted,
        currentTime,
        setCurrentTime,
        duration,
        setDuration,
        playbackRate,
        isFullscreen,
        isBuffering,
        setIsBuffering,
        playerError,
        setPlayerError,
        toastNotice,
        togglePlayPause,
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
        handleVideoEnded,
        removePlaylistItem,
        clearPlaylist,
    } = useDriveVideoPlayer();

    const localFileInputRef = useRef<HTMLInputElement | null>(null);
    const [clientIdDraft, setClientIdDraft] = useState<string>(googleClientId);
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

    const handleOpenClientConfig = () => {
        setClientIdDraft(googleClientId);
        setIsClientConfigOpen(true);
    };

    const handleSaveClientConfigSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveGoogleClientId(clientIdDraft);
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
            aria-label="구글 드라이브 연동 멀티 비디오 플레이어"
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
                                구글 드라이브 비디오 플레이어
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
                                        ? 'Google 드라이브 로그인 연동됨'
                                        : 'Google 드라이브 연동 가능'}
                                </span>
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 font-medium">
                            로그인된 구글 드라이브에서 폴더 및 여러 비디오 파일을 선택해 재생목록을 구성하고 랜덤 재생·전체화면으로 감상하세요.
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
                        <span>내 기기 비디오 선택</span>
                    </button>
                    <input
                        ref={localFileInputRef}
                        type="file"
                        accept="video/*"
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
                                    : '재생할 비디오 파일을 구글 드라이브에서 선택해 주세요'}
                            </h3>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
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

                    {/* 중앙 비디오 렌더링 영역 */}
                    <div
                        className={`relative bg-black flex items-center justify-center select-none ${
                            isFullscreen ? 'flex-1 min-h-0' : 'aspect-video w-full'
                        }`}
                    >
                        {currentTrack ? (
                            <>
                                <video
                                    ref={videoRef}
                                    key={currentTrack.id}
                                    src={currentTrack.streamUrl}
                                    className="w-full h-full max-h-full object-contain cursor-pointer"
                                    playsInline
                                    onClick={togglePlayPause}
                                    onDoubleClick={toggleFullscreen}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onWaiting={() => setIsBuffering(true)}
                                    onPlaying={() => {
                                        setIsBuffering(false);
                                        setPlayerError(null);
                                    }}
                                    onCanPlay={() => setIsBuffering(false)}
                                    onLoadedMetadata={(e) => {
                                        const vid = e.currentTarget;
                                        setDuration(vid.duration || 0);
                                        vid.volume = volume;
                                        vid.muted = isMuted;
                                        vid.playbackRate = playbackRate;
                                    }}
                                    onTimeUpdate={(e) => {
                                        setCurrentTime(e.currentTarget.currentTime || 0);
                                    }}
                                    onEnded={handleVideoEnded}
                                    onError={() => {
                                        setIsBuffering(false);
                                        setIsPlaying(false);
                                        setPlayerError(
                                            '동영상 스트림을 불러올 수 없습니다. 구글 드라이브 접근 권한을 다시 연결하거나 파일 공유 상태를 확인해 주세요.'
                                        );
                                    }}
                                />

                                {/* 버퍼링 로딩 스피너 */}
                                {isBuffering && (
                                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 pointer-events-none">
                                        <div className="w-11 h-11 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-xs font-bold text-white/90">
                                            스트리밍 버퍼링 중...
                                        </span>
                                    </div>
                                )}

                                {/* 일시정지 시 중앙 대형 재생 버튼 오버레이 */}
                                {!isPlaying && !isBuffering && !playerError && (
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
                                                onClick={connectAndOpenDrivePicker}
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

                    {/* ─── 하단 비디오 컨트롤 바 (진행 바 + 재생/랜덤/볼륨/전체화면) ─── */}
                    <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3.5">
                        {/* 1단: 동영상 진행 바 (Seek / Progress Bar) */}
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] font-mono font-bold text-indigo-300 w-12 text-right shrink-0">
                                {formatDuration(currentTime)}
                            </span>
                            <input
                                type="range"
                                aria-label="동영상 진행 바"
                                min={0}
                                max={duration > 0 ? duration : 100}
                                step={0.1}
                                disabled={!currentTrack}
                                value={duration > 0 ? Math.min(currentTime, duration) : 0}
                                onChange={(e) => handleSeekChange(Number(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg cursor-pointer accent-indigo-500 disabled:opacity-40"
                            />
                            <span className="text-[11px] font-mono font-bold text-slate-400 w-12 shrink-0">
                                {formatDuration(duration)}
                            </span>
                        </div>

                        {/* 2단: 재생/탐색, 랜덤 재생, 볼륨 조절 바, 배속, 전체화면 버튼 */}
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            {/* 좌측: 재생·이전·다음·10초 이동·랜덤 재생·반복 */}
                            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                {/* 이전 비디오 */}
                                <button
                                    type="button"
                                    onClick={playPrev}
                                    disabled={playlist.length === 0}
                                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer"
                                    title="이전 동영상"
                                >
                                    <i className="fas fa-step-backward text-xs"></i>
                                </button>

                                {/* 10초 뒤로 */}
                                <button
                                    type="button"
                                    onClick={() => seekRelative(-10)}
                                    disabled={!currentTrack}
                                    className="px-2.5 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="10초 뒤로"
                                >
                                    <i className="fas fa-undo text-[10px]"></i>
                                    <span>10s</span>
                                </button>

                                {/* 재생 / 일시정지 메인 버튼 */}
                                <button
                                    type="button"
                                    onClick={togglePlayPause}
                                    disabled={!currentTrack}
                                    className="w-11 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
                                    title={isPlaying ? '일시정지' : '재생'}
                                >
                                    <i
                                        className={`fas ${
                                            isPlaying ? 'fa-pause' : 'fa-play'
                                        } text-sm`}
                                    ></i>
                                </button>

                                {/* 10초 앞으로 */}
                                <button
                                    type="button"
                                    onClick={() => seekRelative(10)}
                                    disabled={!currentTrack}
                                    className="px-2.5 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-[11px] font-extrabold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="10초 앞으로"
                                >
                                    <span>10s</span>
                                    <i className="fas fa-redo text-[10px]"></i>
                                </button>

                                {/* 다음 비디오 */}
                                <button
                                    type="button"
                                    onClick={playNext}
                                    disabled={playlist.length === 0}
                                    className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer"
                                    title="다음 동영상"
                                >
                                    <i className="fas fa-step-forward text-xs"></i>
                                </button>

                                {/* 🎲 랜덤 재생 (Shuffle) 토글 버튼 */}
                                <button
                                    type="button"
                                    onClick={toggleShuffle}
                                    className={`px-3 h-9 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isShuffle
                                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                    }`}
                                    title="랜덤 재생(셔플) 켜기/끄기"
                                >
                                    <i className="fas fa-random text-xs"></i>
                                    <span>{isShuffle ? '랜덤 재생 ON' : '랜덤 재생'}</span>
                                </button>

                                {/* 🔁 반복 모드 버튼 */}
                                <button
                                    type="button"
                                    onClick={cycleRepeatMode}
                                    className={`px-2.5 h-9 rounded-xl text-xs font-extrabold border transition-all flex items-center gap-1 cursor-pointer ${
                                        repeatMode !== 'off'
                                            ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50'
                                            : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}
                                    title="반복 재생 설정"
                                >
                                    <i className="fas fa-redo-alt text-[11px]"></i>
                                    <span className="text-[11px]">
                                        {repeatMode === 'all'
                                            ? '전체반복'
                                            : repeatMode === 'one'
                                            ? '1곡반복'
                                            : '반복꺼짐'}
                                    </span>
                                </button>
                            </div>

                            {/* 우측: 볼륨 컨트롤 바 + 배속 + 전체화면 버튼 */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                {/* 🔊 볼륨 조절 바 */}
                                <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl border border-slate-700">
                                    <button
                                        type="button"
                                        onClick={toggleMute}
                                        className="text-slate-200 hover:text-white w-5 text-center cursor-pointer"
                                        title={isMuted ? '음소거 해제' : '음소거'}
                                    >
                                        <i
                                            className={`fas ${
                                                effectiveVolume === 0
                                                    ? 'fa-volume-mute text-rose-400'
                                                    : effectiveVolume < 0.5
                                                    ? 'fa-volume-down text-emerald-400'
                                                    : 'fa-volume-up text-emerald-400'
                                            } text-xs`}
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
                                        className="w-20 sm:w-24 h-1.5 bg-slate-600 rounded-lg cursor-pointer accent-emerald-400"
                                    />
                                    <span className="text-[11px] font-mono font-bold text-slate-300 w-8 text-right">
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
                                    className="h-9 px-2.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    {PLAYBACK_RATES.map((rate) => (
                                        <option key={rate} value={rate}>
                                            {rate}x
                                        </option>
                                    ))}
                                </select>

                                {/* ⛶ 전체화면 버튼 */}
                                <button
                                    type="button"
                                    onClick={toggleFullscreen}
                                    className="px-3.5 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                    title={isFullscreen ? '전체화면 종료 (ESC)' : '전체화면으로 보기'}
                                >
                                    <i
                                        className={`fas ${
                                            isFullscreen ? 'fa-compress' : 'fa-expand'
                                        } text-xs`}
                                    ></i>
                                    <span>{isFullscreen ? '전체화면 종료' : '전체화면'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2) 우측 멀티 비디오 재생목록(Playlist) 패널 */}
                <aside className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                                <i className="fas fa-list-ul text-indigo-600"></i>
                                <span>선택된 비디오 목록</span>
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
                                    <i className="fas fa-video"></i>
                                </div>
                                <div className="text-xs font-bold text-slate-600">
                                    아직 선택된 비디오 파일이 없습니다.
                                </div>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    [구글 드라이브 폴더·파일 선택] 버튼을 눌러 여러 개의 비디오나 폴더 전체를 담아보세요!
                                </p>
                            </div>
                        ) : (
                            playlist.map((item, idx) => {
                                const isActive = idx === currentIndex;
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
                                                    <span className="text-indigo-600">
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
                onRetryConnect={connectAndOpenDrivePicker}
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
