'use client';

import React from 'react';
import type {
    DriveExplorerTab,
    DriveFolderBreadcrumb,
    DriveItem,
} from '@/types/driveVideo.types';
import { formatDuration, formatFileSize, isAudioMedia } from '@/hooks/useDriveVideoPlayer';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export interface DriveFilePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    explorerTab: DriveExplorerTab;
    onChangeTab: (tab: DriveExplorerTab) => void;
    breadcrumbs: DriveFolderBreadcrumb[];
    onNavigateBreadcrumb: (index: number) => void;
    onOpenFolder: (folder: DriveItem) => void;
    driveItems: DriveItem[];
    selectedDriveMap: Record<string, DriveItem>;
    onToggleSelectVideo: (item: DriveItem) => void;
    onSelectAllCurrentView: () => void;
    onClearSelection: () => void;
    onAddSelectedVideos: () => void;
    onAddEntireFolder: (folder: DriveItem) => void;
    searchQuery: string;
    onChangeSearchQuery: (q: string) => void;
    isLoading: boolean;
    isLoadingFolderBatch: string | null;
    error: string | null;
    onRetryConnect: () => void;
}

export const DriveFilePickerModal: React.FC<DriveFilePickerModalProps> = ({
    isOpen,
    onClose,
    explorerTab,
    onChangeTab,
    breadcrumbs,
    onNavigateBreadcrumb,
    onOpenFolder,
    driveItems,
    selectedDriveMap,
    onToggleSelectVideo,
    onSelectAllCurrentView,
    onClearSelection,
    onAddSelectedVideos,
    onAddEntireFolder,
    searchQuery,
    onChangeSearchQuery,
    isLoading,
    isLoadingFolderBatch,
    error,
    onRetryConnect,
}) => {
    if (!isOpen) return null;

    const selectedCount = Object.keys(selectedDriveMap).length;
    const folders = driveItems.filter((item) => item.mimeType === FOLDER_MIME_TYPE);
    const videos = driveItems.filter((item) => item.mimeType !== FOLDER_MIME_TYPE);
    const allCurrentVideosSelected =
        videos.length > 0 && videos.every((v) => Boolean(selectedDriveMap[v.id]));

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-fade-in">
                {/* ─── 모달 헤더 ─── */}
                <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-lg text-emerald-400">
                            <i className="fab fa-google-drive"></i>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base sm:text-lg font-black tracking-tight">
                                    Google 드라이브 폴더 · 영상 · 음악 선택
                                </h3>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                                    로그인 연동됨
                                </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-0.5">
                                폴더를 통째로 담거나 여러 동영상·음악(MP3·FLAC·M4A 등) 파일을 체크하여 플레이리스트에 추가하세요.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        aria-label="닫기"
                    >
                        <i className="fas fa-times text-sm"></i>
                    </button>
                </div>

                {/* ─── 상단 탭 & 검색바 ─── */}
                <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200">
                            <button
                                type="button"
                                onClick={() => onChangeTab('my-drive')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    explorerTab === 'my-drive'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <i className="fas fa-folder-tree"></i>
                                <span>내 드라이브</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangeTab('shared')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    explorerTab === 'shared'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <i className="fas fa-users"></i>
                                <span>공유 문서함</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangeTab('all-videos')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    explorerTab === 'all-videos'
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <i className="fas fa-film"></i>
                                <span>전체 동영상</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangeTab('all-audio')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    explorerTab === 'all-audio'
                                        ? 'bg-amber-500 text-slate-950 shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <i className="fas fa-music"></i>
                                <span>전체 음악</span>
                            </button>
                        </div>

                        {/* 검색창 */}
                        <div className="relative flex-1 sm:max-w-xs">
                            <i className="fas fa-search text-xs text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"></i>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => onChangeSearchQuery(e.target.value)}
                                placeholder="폴더·동영상·음악 이름 검색..."
                                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => onChangeSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <i className="fas fa-times-circle text-xs"></i>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 경로 Breadcrumb 및 현재 폴더 전체 선택 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center flex-wrap gap-1 text-xs">
                            {breadcrumbs.map((crumb, idx) => {
                                const isLast = idx === breadcrumbs.length - 1;
                                return (
                                    <React.Fragment key={`${crumb.id}_${idx}`}>
                                        <button
                                            type="button"
                                            onClick={() => onNavigateBreadcrumb(idx)}
                                            className={`px-2 py-1 rounded-lg font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                                                isLast
                                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/70'
                                                    : 'text-slate-600 hover:bg-slate-200/70'
                                            }`}
                                        >
                                            {idx === 0 && (
                                                <i className="fas fa-hard-drive text-[11px] text-indigo-500"></i>
                                            )}
                                            <span className="max-w-[140px] truncate">{crumb.name}</span>
                                        </button>
                                        {!isLast && (
                                            <i className="fas fa-chevron-right text-[9px] text-slate-400"></i>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>

                        {videos.length > 0 && (
                            <button
                                type="button"
                                onClick={onSelectAllCurrentView}
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-extrabold transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <i
                                    className={`fas ${
                                        allCurrentVideosSelected ? 'fa-check-square' : 'fa-square'
                                    } text-indigo-600`}
                                ></i>
                                <span>
                                    {allCurrentVideosSelected
                                        ? '현재 목록 전체 해제'
                                        : `현재 폴더 영상·음악 전체 선택 (${videos.length}개)`}
                                </span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ─── 본문: 폴더 및 동영상·음악 목록 ─── */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px]">
                    {isLoading ? (
                        <div className="py-16 text-center space-y-3">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs font-bold text-slate-500">
                                구글 드라이브에서 폴더와 동영상·음악을 불러오는 중입니다...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                                <i className="fas fa-exclamation-triangle"></i>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-rose-800 leading-relaxed max-w-md mx-auto">{error}</p>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                <a
                                    href="https://console.cloud.google.com/apis/library/drive.googleapis.com"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition-colors flex items-center gap-1.5"
                                >
                                    <i className="fas fa-external-link-alt text-[10px]"></i>
                                    <span>Google Drive API 사용 설정 켜기 ↗</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={onRetryConnect}
                                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black cursor-pointer"
                                >
                                    다시 구글 계정 인증하기
                                </button>
                            </div>
                        </div>
                    ) : folders.length === 0 && videos.length === 0 ? (
                        <div className="py-16 text-center space-y-2">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                                <i className="fas fa-folder-open"></i>
                            </div>
                            <p className="text-sm font-extrabold text-slate-700">
                                이 위치에 표시할 폴더나 동영상·음악 파일이 없습니다.
                            </p>
                            <p className="text-xs text-slate-400">
                                상단 경로를 이동하거나 [전체 동영상] / [전체 음악] 탭을 선택해 보세요.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* 1) 폴더 목록 */}
                            {folders.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                                        폴더 ({folders.length})
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {folders.map((folder) => {
                                            const isBatchLoading = isLoadingFolderBatch === folder.id;
                                            return (
                                                <div
                                                    key={folder.id}
                                                    className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-amber-50/50 hover:bg-amber-50 border border-amber-200/70 transition-all group"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenFolder(folder)}
                                                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                                                    >
                                                        <span className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                                                            <i className="fas fa-folder"></i>
                                                        </span>
                                                        <div className="min-w-0">
                                                            <div className="text-xs sm:text-sm font-extrabold text-slate-800 truncate">
                                                                {folder.name}
                                                            </div>
                                                            <div className="text-[10px] font-semibold text-amber-700">
                                                                클릭하여 하위 폴더 열기 →
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBatchLoading}
                                                        onClick={() => onAddEntireFolder(folder)}
                                                        className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200 text-[11px] font-extrabold shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                                                        title="이 폴더 안의 모든 동영상·음악을 한 번에 추가합니다"
                                                    >
                                                        {isBatchLoading ? (
                                                            <span>
                                                                <i className="fas fa-spinner fa-spin mr-1"></i>
                                                                담는 중...
                                                            </span>
                                                        ) : (
                                                            <span>+ 폴더 통째로 담기</span>
                                                        )}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 2) 동영상 & 음악 파일 목록 */}
                            {videos.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider px-1">
                                        미디어 파일 · 영상/음악 ({videos.length})
                                    </div>
                                    <div className="space-y-1.5">
                                        {videos.map((video) => {
                                            const isSelected = Boolean(selectedDriveMap[video.id]);
                                            const isAudio = isAudioMedia(video.mimeType, video.name);
                                            const sizeNum = video.size ? Number(video.size) : null;
                                            const durationSecs = video.videoMediaMetadata?.durationMillis
                                                ? Number(video.videoMediaMetadata.durationMillis) / 1000
                                                : null;
                                            const formatBadge = video.mimeType
                                                .replace('video/', '')
                                                .replace('audio/', '')
                                                .replace('x-m4a', 'M4A')
                                                .replace('mpeg', 'MP3')
                                                .toUpperCase();

                                            return (
                                                <div
                                                    key={video.id}
                                                    onClick={() => onToggleSelectVideo(video)}
                                                    className={`flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer ${
                                                        isSelected
                                                            ? 'bg-indigo-50/90 border-indigo-400 shadow-2xs'
                                                            : 'bg-white hover:bg-slate-50 border-slate-200/80'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div
                                                            className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-colors ${
                                                                isSelected
                                                                    ? 'bg-indigo-600 border-indigo-600 text-white'
                                                                    : 'bg-white border-slate-300 text-transparent'
                                                            }`}
                                                        >
                                                            <i className="fas fa-check text-[10px]"></i>
                                                        </div>

                                                        {video.thumbnailLink ? (
                                                            <img
                                                                src={video.thumbnailLink}
                                                                alt={video.name}
                                                                className="w-12 h-8 rounded-lg object-cover bg-slate-900 shrink-0 border border-slate-200"
                                                                referrerPolicy="no-referrer"
                                                            />
                                                        ) : isAudio ? (
                                                            <div className="w-12 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                                <i className="fas fa-music text-xs"></i>
                                                            </div>
                                                        ) : (
                                                            <div className="w-12 h-8 rounded-lg bg-slate-900 text-indigo-400 flex items-center justify-center shrink-0">
                                                                <i className="fas fa-play text-xs"></i>
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                                                                {video.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                                                                <span
                                                                    className={
                                                                        isAudio
                                                                            ? 'text-amber-600 font-extrabold'
                                                                            : 'text-indigo-600 font-bold'
                                                                    }
                                                                >
                                                                    {isAudio ? `🎵 ${formatBadge}` : `🎬 ${formatBadge}`}
                                                                </span>
                                                                {durationSecs !== null && durationSecs > 0 && (
                                                                    <span>• ⏱ {formatDuration(durationSecs)}</span>
                                                                )}
                                                                {sizeNum !== null && sizeNum > 0 && (
                                                                    <span>• {formatFileSize(sizeNum)}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <span
                                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold shrink-0 ${
                                                            isSelected
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {isSelected ? '선택됨' : '선택'}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ─── 모달 하단 액션 푸터 ─── */}
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-700">
                            선택된 미디어:{' '}
                            <strong className="text-indigo-600 font-black">{selectedCount}개</strong>
                        </span>
                        {selectedCount > 0 && (
                            <button
                                type="button"
                                onClick={onClearSelection}
                                className="text-xs font-bold text-slate-400 hover:text-rose-600 underline cursor-pointer"
                            >
                                전체 선택 해제
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-extrabold cursor-pointer"
                        >
                            닫기
                        </button>
                        <button
                            type="button"
                            disabled={selectedCount === 0}
                            onClick={onAddSelectedVideos}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-40 text-white text-xs sm:text-sm font-black shadow-md transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <i className="fas fa-plus-circle"></i>
                            <span>선택한 {selectedCount}개 파일 재생목록에 추가</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
