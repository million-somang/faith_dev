'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type {
    DriveExplorerTab,
    DriveFilesListResponse,
    DriveFolderBreadcrumb,
    DriveItem,
    RepeatMode,
    VideoPlaylistItem,
    WindowWithGoogleGsi,
} from '@/types/driveVideo.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DEFAULT_GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

const STORAGE_KEYS = {
    CLIENT_ID: 'vera_google_drive_client_id',
    PLAYLIST: 'vera_mypage_drive_playlist_v1',
    VOLUME: 'vera_mypage_video_volume',
    SHUFFLE: 'vera_mypage_video_shuffle',
    REPEAT: 'vera_mypage_video_repeat',
    ACCESS_TOKEN: 'vera_gdrive_access_token',
    TOKEN_EXPIRY: 'vera_gdrive_token_expiry',
} as const;

const DRIVE_READONLY_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

function loadGsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === 'undefined') {
            reject(new Error('브라우저 환경이 아닙니다.'));
            return;
        }
        const win = window as WindowWithGoogleGsi;
        if (win.google?.accounts?.oauth2) {
            resolve();
            return;
        }
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve());
            existingScript.addEventListener('error', () => reject(new Error('Google 인증 스크립트 로드 실패')));
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google 인증 스크립트 로드에 실패했습니다.'));
        document.head.appendChild(script);
    });
}

function buildStreamUrl(fileId: string, accessToken: string): string {
    const base = `${API_BASE_URL}/api/user/drive/stream/${encodeURIComponent(fileId)}`;
    if (accessToken) {
        return `${base}?token=${encodeURIComponent(accessToken)}`;
    }
    return base;
}

function extractDriveFileId(rawInput: string): string | null {
    const trimmed = rawInput.trim();
    if (!trimmed) return null;

    const filePathMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{10,120})/);
    if (filePathMatch && filePathMatch[1]) {
        return filePathMatch[1];
    }

    const idQueryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{10,120})/);
    if (idQueryMatch && idQueryMatch[1]) {
        return idQueryMatch[1];
    }

    if (/^[a-zA-Z0-9_-]{15,120}$/.test(trimmed)) {
        return trimmed;
    }

    return null;
}

export function formatDuration(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds < 0) return '00:00';
    const totalSecs = Math.floor(seconds);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    if (hrs > 0) {
        return `${hrs}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
    if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes <= 0) {
        return '';
    }
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function useDriveVideoPlayer() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);

    // ─── Google OAuth & Drive 연동 상태 ───
    const [googleClientId, setGoogleClientId] = useState<string>(DEFAULT_GOOGLE_CLIENT_ID);
    const [currentOrigin, setCurrentOrigin] = useState<string>('');
    const [accessToken, setAccessToken] = useState<string>('');
    const [isDriveConnected, setIsDriveConnected] = useState<boolean>(false);
    const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
    const [isClientConfigOpen, setIsClientConfigOpen] = useState<boolean>(false);
    const [isShareLinkModalOpen, setIsShareLinkModalOpen] = useState<boolean>(false);

    // ─── 드라이브 탐색기 모달 상태 ───
    const [explorerTab, setExplorerTab] = useState<DriveExplorerTab>('my-drive');
    const [breadcrumbs, setBreadcrumbs] = useState<DriveFolderBreadcrumb[]>([
        { id: 'root', name: '내 드라이브' },
    ]);
    const [driveItems, setDriveItems] = useState<DriveItem[]>([]);
    const [selectedDriveMap, setSelectedDriveMap] = useState<Record<string, DriveItem>>({});
    const [driveSearchQuery, setDriveSearchQuery] = useState<string>('');
    const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
    const [isLoadingFolderBatch, setIsLoadingFolderBatch] = useState<string | null>(null);
    const [driveError, setDriveError] = useState<string | null>(null);

    // ─── 비디오 플레이리스트 & 재생 상태 ───
    const [playlist, setPlaylist] = useState<VideoPlaylistItem[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isShuffle, setIsShuffle] = useState<boolean>(false);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
    const [volume, setVolume] = useState<number>(0.85);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [playbackRate, setPlaybackRate] = useState<number>(1);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [isBuffering, setIsBuffering] = useState<boolean>(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [toastNotice, setToastNotice] = useState<string | null>(null);

    const showNotice = useCallback((msg: string) => {
        setToastNotice(msg);
        window.setTimeout(() => {
            setToastNotice((prev) => (prev === msg ? null : prev));
        }, 3200);
    }, []);

    // ─── 초기 설정 및 저장된 재생목록/토큰 복원 ───
    useEffect(() => {
        if (typeof window === 'undefined') return;

        setCurrentOrigin(window.location.origin);

        const savedClientId = localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
        if (savedClientId && savedClientId.trim()) {
            setGoogleClientId(savedClientId.trim());
        }

        const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
        if (savedVolume !== null) {
            const parsedVol = Number(savedVolume);
            if (Number.isFinite(parsedVol) && parsedVol >= 0 && parsedVol <= 1) {
                setVolume(parsedVol);
            }
        }

        const savedShuffle = localStorage.getItem(STORAGE_KEYS.SHUFFLE);
        if (savedShuffle === 'true') {
            setIsShuffle(true);
        }

        const savedRepeat = localStorage.getItem(STORAGE_KEYS.REPEAT);
        if (savedRepeat === 'off' || savedRepeat === 'all' || savedRepeat === 'one') {
            setRepeatMode(savedRepeat);
        }

        const savedToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const savedExpiry = Number(sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) || '0');
        let activeToken = '';
        if (savedToken && savedExpiry > Date.now() + 60_000) {
            activeToken = savedToken;
            setAccessToken(savedToken);
            setIsDriveConnected(true);
        }

        const savedPlaylistRaw = localStorage.getItem(STORAGE_KEYS.PLAYLIST);
        if (savedPlaylistRaw) {
            try {
                const parsed = JSON.parse(savedPlaylistRaw) as VideoPlaylistItem[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const hydrated = parsed
                        .filter((item) => item.sourceType === 'google-drive')
                        .map((item) => ({
                            ...item,
                            streamUrl: buildStreamUrl(item.id, activeToken),
                        }));
                    if (hydrated.length > 0) {
                        setPlaylist(hydrated);
                    }
                }
            } catch (_) {
                // 손상된 로컬 스토리지 무시
            }
        }
    }, []);

    // 구글 드라이브 항목만 로컬스토리지에 보존 (로컬 Object URL 제외)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const driveOnly = playlist.filter((item) => item.sourceType === 'google-drive');
        localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(driveOnly));
    }, [playlist]);

    // ─── 전체화면 상태 변화 감지 ───
    useEffect(() => {
        const handleFullscreenChange = () => {
            const fsElement = document.fullscreenElement;
            setIsFullscreen(Boolean(fsElement));
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // ─── 현재 재생 중인 트랙 ───
    const currentTrack: VideoPlaylistItem | null = useMemo(() => {
        if (playlist.length === 0) return null;
        const safeIdx = Math.min(Math.max(0, currentIndex), playlist.length - 1);
        return playlist[safeIdx] || null;
    }, [playlist, currentIndex]);

    // ─── Google Drive API 파일 목록 조회 ───
    const fetchDriveFiles = useCallback(
        async (
            tokenToUse: string,
            tab: DriveExplorerTab,
            folderId: string,
            searchKeyword: string
        ) => {
            if (!tokenToUse) return;
            setIsLoadingDrive(true);
            setDriveError(null);

            try {
                const queryParts: string[] = ['trashed = false'];
                const trimmedKeyword = searchKeyword.trim().replace(/'/g, "\\'");

                if (trimmedKeyword) {
                    queryParts.push(`name contains '${trimmedKeyword}'`);
                    queryParts.push(
                        `(mimeType = '${FOLDER_MIME_TYPE}' or mimeType contains 'video/')`
                    );
                } else if (tab === 'my-drive') {
                    queryParts.push(`'${folderId}' in parents`);
                    queryParts.push(
                        `(mimeType = '${FOLDER_MIME_TYPE}' or mimeType contains 'video/')`
                    );
                } else if (tab === 'shared') {
                    if (folderId !== 'root') {
                        queryParts.push(`'${folderId}' in parents`);
                    } else {
                        queryParts.push('sharedWithMe = true');
                    }
                    queryParts.push(
                        `(mimeType = '${FOLDER_MIME_TYPE}' or mimeType contains 'video/')`
                    );
                } else {
                    queryParts.push(`mimeType contains 'video/'`);
                }

                const q = queryParts.join(' and ');
                const fields =
                    'files(id,name,mimeType,size,thumbnailLink,iconLink,modifiedTime,videoMediaMetadata)';
                const orderBy = 'folder,name_natural';
                const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
                    q
                )}&fields=${encodeURIComponent(
                    fields
                )}&orderBy=${encodeURIComponent(
                    orderBy
                )}&pageSize=100&includeItemsFromAllDrives=true&supportsAllDrives=true`;

                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${tokenToUse}`,
                    },
                });

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403) {
                        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                        sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
                        setIsDriveConnected(false);
                        setAccessToken('');
                        throw new Error(
                            '구글 드라이브 인증 세션이 만료되었습니다. [구글 드라이브 연결] 버튼을 다시 눌러주세요.'
                        );
                    }
                    throw new Error(`구글 드라이브 목록 조회 실패 (HTTP ${response.status})`);
                }

                const data = (await response.json()) as DriveFilesListResponse;
                setDriveItems(data.files || []);
            } catch (err: unknown) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : '구글 드라이브 파일 목록을 불러오지 못했습니다.';
                setDriveError(msg);
            } finally {
                setIsLoadingDrive(false);
            }
        },
        []
    );

    const currentFolderId = useMemo(() => {
        const last = breadcrumbs[breadcrumbs.length - 1];
        return last ? last.id : 'root';
    }, [breadcrumbs]);

    // 모달이 열려 있고 토큰이 있을 때 탭/폴더 변경 시 자동 조회
    useEffect(() => {
        if (isPickerOpen && accessToken) {
            fetchDriveFiles(accessToken, explorerTab, currentFolderId, driveSearchQuery);
        }
    }, [isPickerOpen, accessToken, explorerTab, currentFolderId, driveSearchQuery, fetchDriveFiles]);

    // ─── Google OAuth 로그인 & 드라이브 모달 열기 ───
    const connectAndOpenDrivePicker = useCallback(async () => {
        if (accessToken && isDriveConnected) {
            setIsPickerOpen(true);
            return;
        }

        const activeClientId = googleClientId.trim();
        if (!activeClientId) {
            setIsClientConfigOpen(true);
            return;
        }

        try {
            await loadGsiScript();
            const win = window as WindowWithGoogleGsi;
            const oauth2 = win.google?.accounts?.oauth2;
            if (!oauth2) {
                showNotice('구글 OAuth 모듈을 초기화할 수 없습니다.');
                return;
            }

            const tokenClient = oauth2.initTokenClient({
                client_id: activeClientId,
                scope: DRIVE_READONLY_SCOPE,
                callback: (tokenResponse) => {
                    if (tokenResponse.error || !tokenResponse.access_token) {
                        const errDesc = tokenResponse.error_description || tokenResponse.error || '';
                        if (errDesc.includes('origin_mismatch') || errDesc.includes('400')) {
                            setIsClientConfigOpen(true);
                            showNotice(`⚠️ 구글 콘솔에 현재 도메인(${window.location.origin}) 등록이 필요합니다.`);
                        } else {
                            setDriveError(
                                errDesc ||
                                    '구글 드라이브 접근 권한 승인이 취소되었거나 실패했습니다.'
                            );
                        }
                        return;
                    }
                    const newToken = tokenResponse.access_token;
                    const expiresInSec = tokenResponse.expires_in || 3500;
                    const expiryTime = Date.now() + expiresInSec * 1000;

                    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
                    sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));

                    setAccessToken(newToken);
                    setIsDriveConnected(true);
                    setPlaylist((prev) =>
                        prev.map((item) =>
                            item.sourceType === 'google-drive'
                                ? { ...item, streamUrl: buildStreamUrl(item.id, newToken) }
                                : item
                        )
                    );
                    setIsPickerOpen(true);
                    showNotice('구글 드라이브가 성공적으로 연결되었습니다!');
                },
                error_callback: (err) => {
                    const msg = err?.message || '';
                    if (msg.includes('origin_mismatch') || msg.includes('400') || msg.includes('popup_closed_by_user')) {
                        // origin_mismatch의 경우 구글 팝업창에서 직접 400이 발생하거나 팝업이 닫힐 수 있으므로 안내
                        showNotice(
                            msg.includes('origin_mismatch')
                                ? `⚠️ 구글 콘솔에 현재 도메인(${window.location.origin})을 등록해 주세요.`
                                : (msg || '구글 인증 팝업이 닫혔습니다.')
                        );
                    } else {
                        showNotice(msg || '구글 계정 인증 팝업이 닫혔거나 차단되었습니다.');
                    }
                },
            });

            // 이미 구글에 로그인되어 있는 상태라면 계정 선택/동의 후 즉시 토큰 발급
            tokenClient.requestAccessToken({ prompt: '' });
        } catch (err: unknown) {
            const msg =
                err instanceof Error ? err.message : '구글 드라이브 연결 중 오류가 발생했습니다.';
            showNotice(msg);
        }
    }, [accessToken, isDriveConnected, googleClientId, showNotice]);

    const saveGoogleClientId = useCallback(
        (newClientId: string) => {
            const trimmed = newClientId.trim();
            setGoogleClientId(trimmed);
            if (typeof window !== 'undefined') {
                if (trimmed) {
                    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, trimmed);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
                }
            }
            setIsClientConfigOpen(false);
            showNotice('구글 OAuth Client ID 설정이 저장되었습니다.');
        },
        [showNotice]
    );

    // ─── 폴더 탐색 제어 ───
    const handleChangeExplorerTab = useCallback((tab: DriveExplorerTab) => {
        setExplorerTab(tab);
        setDriveSearchQuery('');
        if (tab === 'my-drive') {
            setBreadcrumbs([{ id: 'root', name: '내 드라이브' }]);
        } else if (tab === 'shared') {
            setBreadcrumbs([{ id: 'root', name: '공유 문서함' }]);
        } else {
            setBreadcrumbs([{ id: 'root', name: '전체 동영상' }]);
        }
    }, []);

    const openDriveFolder = useCallback((folder: DriveItem) => {
        if (folder.mimeType !== FOLDER_MIME_TYPE) return;
        setDriveSearchQuery('');
        setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    }, []);

    const navigateToBreadcrumb = useCallback((index: number) => {
        setDriveSearchQuery('');
        setBreadcrumbs((prev) => prev.slice(0, index + 1));
    }, []);

    // ─── 비디오 파일 다중 선택 & 폴더 통째로 담기 ───
    const toggleSelectDriveVideo = useCallback((item: DriveItem) => {
        if (item.mimeType === FOLDER_MIME_TYPE) return;
        setSelectedDriveMap((prev) => {
            const next = { ...prev };
            if (next[item.id]) {
                delete next[item.id];
            } else {
                next[item.id] = item;
            }
            return next;
        });
    }, []);

    const selectAllVideosInCurrentView = useCallback(() => {
        const videoItems = driveItems.filter((item) => item.mimeType !== FOLDER_MIME_TYPE);
        if (videoItems.length === 0) return;

        setSelectedDriveMap((prev) => {
            const allAlreadySelected = videoItems.every((v) => Boolean(prev[v.id]));
            const next = { ...prev };
            if (allAlreadySelected) {
                for (const v of videoItems) {
                    delete next[v.id];
                }
            } else {
                for (const v of videoItems) {
                    next[v.id] = v;
                }
            }
            return next;
        });
    }, [driveItems]);

    const clearDriveSelection = useCallback(() => {
        setSelectedDriveMap({});
    }, []);

    const convertDriveItemToPlaylistItem = useCallback(
        (item: DriveItem, folderName?: string): VideoPlaylistItem => {
            const parsedSize = item.size ? Number(item.size) : null;
            const parsedDuration = item.videoMediaMetadata?.durationMillis
                ? Number(item.videoMediaMetadata.durationMillis)
                : null;
            return {
                id: item.id,
                name: item.name,
                mimeType: item.mimeType || 'video/mp4',
                sizeBytes: Number.isFinite(parsedSize) ? parsedSize : null,
                durationMs: Number.isFinite(parsedDuration) ? parsedDuration : null,
                thumbnailUrl: item.thumbnailLink || null,
                sourceType: 'google-drive',
                streamUrl: buildStreamUrl(item.id, accessToken),
                folderName,
            };
        },
        [accessToken]
    );

    const appendItemsToPlaylist = useCallback(
        (newItems: VideoPlaylistItem[]) => {
            if (newItems.length === 0) return;
            setPlaylist((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const deduped = newItems.filter((item) => !existingIds.has(item.id));
                const merged = [...prev, ...deduped];
                if (prev.length === 0 && merged.length > 0) {
                    setCurrentIndex(0);
                    setIsPlaying(true);
                }
                return merged;
            });
        },
        []
    );

    const addSelectedDriveVideosToPlaylist = useCallback(() => {
        const selectedList = Object.values(selectedDriveMap);
        if (selectedList.length === 0) return;

        const currentFolderName = breadcrumbs[breadcrumbs.length - 1]?.name;
        const mapped = selectedList.map((item) =>
            convertDriveItemToPlaylistItem(item, currentFolderName)
        );
        appendItemsToPlaylist(mapped);
        setSelectedDriveMap({});
        setIsPickerOpen(false);
        showNotice(`🎬 선택한 동영상 ${mapped.length}개를 재생목록에 추가했습니다.`);
    }, [
        selectedDriveMap,
        breadcrumbs,
        convertDriveItemToPlaylistItem,
        appendItemsToPlaylist,
        showNotice,
    ]);

    const addEntireFolderToPlaylist = useCallback(
        async (folder: DriveItem) => {
            if (!accessToken || folder.mimeType !== FOLDER_MIME_TYPE) return;
            setIsLoadingFolderBatch(folder.id);
            try {
                const q = `'${folder.id}' in parents and trashed = false and mimeType contains 'video/'`;
                const fields =
                    'files(id,name,mimeType,size,thumbnailLink,modifiedTime,videoMediaMetadata)';
                const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
                    q
                )}&fields=${encodeURIComponent(
                    fields
                )}&orderBy=name_natural&pageSize=100&includeItemsFromAllDrives=true&supportsAllDrives=true`;

                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`폴더 내 동영상 조회 실패 (HTTP ${response.status})`);
                }
                const data = (await response.json()) as DriveFilesListResponse;
                const videoFiles = data.files || [];
                if (videoFiles.length === 0) {
                    showNotice(`'${folder.name}' 폴더 안에 재생 가능한 비디오 파일이 없습니다.`);
                    return;
                }
                const mapped = videoFiles.map((v) =>
                    convertDriveItemToPlaylistItem(v, folder.name)
                );
                appendItemsToPlaylist(mapped);
                showNotice(
                    `📁 '${folder.name}' 폴더의 동영상 ${mapped.length}개를 모두 추가했습니다!`
                );
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : '폴더 내 동영상을 불러오지 못했습니다.';
                showNotice(msg);
            } finally {
                setIsLoadingFolderBatch(null);
            }
        },
        [accessToken, convertDriveItemToPlaylistItem, appendItemsToPlaylist, showNotice]
    );

    // ─── 보조 소스: 구글 드라이브 공유 링크 & 로컬 비디오 파일 추가 ───
    const addDriveSharedLink = useCallback(
        (rawUrlOrId: string, customName?: string): boolean => {
            const fileId = extractDriveFileId(rawUrlOrId);
            if (!fileId) {
                showNotice('유효한 구글 드라이브 파일 공유 링크 또는 파일 ID를 입력해 주세요.');
                return false;
            }
            const label =
                customName && customName.trim()
                    ? customName.trim()
                    : `Google Drive Video (${fileId.slice(0, 8)})`;

            const newItem: VideoPlaylistItem = {
                id: fileId,
                name: label,
                mimeType: 'video/mp4',
                sizeBytes: null,
                durationMs: null,
                thumbnailUrl: null,
                sourceType: 'google-drive',
                streamUrl: buildStreamUrl(fileId, accessToken),
                folderName: '드라이브 링크',
            };
            appendItemsToPlaylist([newItem]);
            setIsShareLinkModalOpen(false);
            showNotice(`🔗 '${label}' 동영상이 재생목록에 추가되었습니다.`);
            return true;
        },
        [accessToken, appendItemsToPlaylist, showNotice]
    );

    const handleAddLocalFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const added: VideoPlaylistItem[] = [];
            for (let i = 0; i < files.length; i += 1) {
                const file = files[i];
                if (!file || !file.type.startsWith('video/')) continue;
                const objectUrl = URL.createObjectURL(file);
                added.push({
                    id: `local_${Date.now()}_${i}_${file.name}`,
                    name: file.name,
                    mimeType: file.type || 'video/mp4',
                    sizeBytes: file.size,
                    durationMs: null,
                    thumbnailUrl: null,
                    sourceType: 'local',
                    streamUrl: objectUrl,
                    folderName: '내 기기 파일',
                });
            }
            if (added.length > 0) {
                appendItemsToPlaylist(added);
                showNotice(`💻 내 기기에서 동영상 ${added.length}개를 불러왔습니다.`);
            }
        },
        [appendItemsToPlaylist, showNotice]
    );

    // ─── 재생목록 편집 ───
    const removePlaylistItem = useCallback((id: string) => {
        setPlaylist((prev) => {
            const idx = prev.findIndex((item) => item.id === id);
            if (idx === -1) return prev;
            const target = prev[idx];
            if (target && target.sourceType === 'local' && target.streamUrl.startsWith('blob:')) {
                URL.revokeObjectURL(target.streamUrl);
            }
            const next = prev.filter((item) => item.id !== id);
            setCurrentIndex((currIdx) => {
                if (next.length === 0) return 0;
                if (idx < currIdx) return Math.max(0, currIdx - 1);
                if (currIdx >= next.length) return next.length - 1;
                return currIdx;
            });
            return next;
        });
    }, []);

    const clearPlaylist = useCallback(() => {
        setPlaylist((prev) => {
            for (const item of prev) {
                if (item.sourceType === 'local' && item.streamUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.streamUrl);
                }
            }
            return [];
        });
        setCurrentIndex(0);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setPlayerError(null);
    }, []);

    // ─── 비디오 플레이어 컨트롤 (재생/일시정지/랜덤/볼륨/진행바/전체화면) ───
    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video || !currentTrack) return;
        if (video.paused) {
            video.play().catch(() => {
                setIsPlaying(false);
            });
        } else {
            video.pause();
        }
    }, [currentTrack]);

    const playTrackAtIndex = useCallback(
        (index: number) => {
            if (index < 0 || index >= playlist.length) return;
            setPlayerError(null);
            setCurrentIndex(index);
            setCurrentTime(0);
            setIsPlaying(true);
        },
        [playlist.length]
    );

    const pickRandomNextIndex = useCallback(
        (totalLength: number, currentIdx: number): number => {
            if (totalLength <= 1) return 0;
            const candidates: number[] = [];
            for (let i = 0; i < totalLength; i += 1) {
                if (i !== currentIdx) {
                    candidates.push(i);
                }
            }
            const randomPos = Math.floor(Math.random() * candidates.length);
            return candidates[randomPos] ?? 0;
        },
        []
    );

    const playNext = useCallback(() => {
        if (playlist.length === 0) return;
        setPlayerError(null);

        if (isShuffle && playlist.length > 1) {
            const nextIdx = pickRandomNextIndex(playlist.length, currentIndex);
            setCurrentIndex(nextIdx);
            setCurrentTime(0);
            setIsPlaying(true);
            return;
        }

        const nextIdx = currentIndex + 1;
        if (nextIdx < playlist.length) {
            setCurrentIndex(nextIdx);
            setCurrentTime(0);
            setIsPlaying(true);
        } else if (repeatMode === 'all') {
            setCurrentIndex(0);
            setCurrentTime(0);
            setIsPlaying(true);
        } else {
            setIsPlaying(false);
        }
    }, [playlist.length, isShuffle, currentIndex, repeatMode, pickRandomNextIndex]);

    const playPrev = useCallback(() => {
        if (playlist.length === 0) return;
        const video = videoRef.current;
        if (video && video.currentTime > 4) {
            video.currentTime = 0;
            setCurrentTime(0);
            return;
        }
        setPlayerError(null);
        if (isShuffle && playlist.length > 1) {
            const randomIdx = pickRandomNextIndex(playlist.length, currentIndex);
            setCurrentIndex(randomIdx);
            setCurrentTime(0);
            setIsPlaying(true);
            return;
        }
        const prevIdx = currentIndex - 1 >= 0 ? currentIndex - 1 : playlist.length - 1;
        setCurrentIndex(prevIdx);
        setCurrentTime(0);
        setIsPlaying(true);
    }, [playlist.length, isShuffle, currentIndex, pickRandomNextIndex]);

    const toggleShuffle = useCallback(() => {
        setIsShuffle((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.SHUFFLE, String(next));
            }
            showNotice(next ? '🎲 랜덤 재생(셔플)이 켜졌습니다.' : '➡️ 순차 재생 모드로 전환되었습니다.');
            return next;
        });
    }, [showNotice]);

    const cycleRepeatMode = useCallback(() => {
        setRepeatMode((prev) => {
            const next: RepeatMode = prev === 'all' ? 'one' : prev === 'one' ? 'off' : 'all';
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.REPEAT, next);
            }
            return next;
        });
    }, []);

    const handleSeekChange = useCallback((newTimeSeconds: number) => {
        const video = videoRef.current;
        if (!video || !Number.isFinite(newTimeSeconds)) return;
        const clamped = Math.max(0, Math.min(newTimeSeconds, video.duration || newTimeSeconds));
        video.currentTime = clamped;
        setCurrentTime(clamped);
    }, []);

    const seekRelative = useCallback((deltaSeconds: number) => {
        const video = videoRef.current;
        if (!video) return;
        const target = Math.max(
            0,
            Math.min(video.duration || 0, video.currentTime + deltaSeconds)
        );
        video.currentTime = target;
        setCurrentTime(target);
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        const clamped = Math.max(0, Math.min(1, newVolume));
        setVolume(clamped);
        setIsMuted(clamped === 0);
        if (videoRef.current) {
            videoRef.current.volume = clamped;
            videoRef.current.muted = clamped === 0;
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.VOLUME, String(clamped));
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted((prev) => {
            const next = !prev;
            if (videoRef.current) {
                videoRef.current.muted = next;
            }
            return next;
        });
    }, []);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        setPlaybackRate(rate);
        if (videoRef.current) {
            videoRef.current.playbackRate = rate;
        }
    }, []);

    const toggleFullscreen = useCallback(async () => {
        const container = playerContainerRef.current;
        const video = videoRef.current;
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else if (container && container.requestFullscreen) {
                await container.requestFullscreen();
            } else if (video && video.requestFullscreen) {
                await video.requestFullscreen();
            }
        } catch (_) {
            // 모바일 Safari 등 전체화면 예외 처리
        }
    }, []);

    // 트랙 변경 시 자동 재생 및 볼륨/배속 동기화
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentTrack) return;

        video.volume = volume;
        video.muted = isMuted;
        video.playbackRate = playbackRate;

        if (isPlaying) {
            video.play().catch(() => {
                setIsPlaying(false);
            });
        }
    }, [currentTrack, isPlaying, volume, isMuted, playbackRate]);

    const handleVideoEnded = useCallback(() => {
        const video = videoRef.current;
        if (repeatMode === 'one' && video) {
            video.currentTime = 0;
            video.play().catch(() => setIsPlaying(false));
            return;
        }
        playNext();
    }, [repeatMode, playNext]);

    return {
        videoRef,
        playerContainerRef,
        // Google Drive OAuth & Picker
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
        // Explorer Modal
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
        // Playlist & Player
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
    };
}
