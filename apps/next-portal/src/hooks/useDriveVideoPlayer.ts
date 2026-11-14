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
    CLIENT_SECRET: 'vera_google_drive_client_secret',
    PLAYLIST: 'vera_mypage_drive_playlist_v1',
    VOLUME: 'vera_mypage_video_volume',
    SHUFFLE: 'vera_mypage_video_shuffle',
    REPEAT: 'vera_mypage_video_repeat',
    AUDIO_ONLY: 'vera_mypage_video_audio_only_v3',
    ACCESS_TOKEN: 'vera_gdrive_access_token',
    TOKEN_EXPIRY: 'vera_gdrive_token_expiry',
    MINI_BAR_DISMISSED: 'vera_mypage_mini_bar_dismissed',
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

function buildStreamUrl(fileId: string, accessToken: string, audioOnly = false): string {
    const base = `${API_BASE_URL}/api/user/drive/stream/${encodeURIComponent(fileId)}`;
    const params = new URLSearchParams();
    if (accessToken) {
        params.set('token', accessToken);
    }
    if (audioOnly) {
        params.set('mode', 'audio');
    }
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
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

export function isAudioMedia(mimeType?: string, fileName?: string): boolean {
    const lowerMime = (mimeType || '').toLowerCase();
    if (lowerMime.startsWith('audio/')) return true;
    const lowerName = (fileName || '').toLowerCase();
    return /\.(mp3|m4a|flac|wav|ogg|aac|wma|opus|aiff|alac)$/.test(lowerName);
}

export function useDriveVideoPlayer() {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerContainerRef = useRef<HTMLDivElement | null>(null);

    // ─── Google OAuth & Drive 연동 상태 ───
    const [googleClientId, setGoogleClientId] = useState<string>(DEFAULT_GOOGLE_CLIENT_ID);
    const [googleClientSecret, setGoogleClientSecret] = useState<string>('');
    const [hasServerClientSecret, setHasServerClientSecret] = useState<boolean>(false);
    const [isPermanentConnected, setIsPermanentConnected] = useState<boolean>(false);
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
    const [isAudioOnlyMode, setIsAudioOnlyMode] = useState<boolean>(true);
    const [isPipActive, setIsPipActive] = useState<boolean>(false);
    const [isFullStageMounted, setIsFullStageMounted] = useState<boolean>(false);
    const [isMiniBarDismissed, setIsMiniBarDismissed] = useState<boolean>(true);
    const [isBuffering, setIsBuffering] = useState<boolean>(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [toastNotice, setToastNotice] = useState<string | null>(null);
    const [retryNonce, setRetryNonce] = useState<number>(0);
    const userWantsPlayRef = useRef<boolean>(false);
    const pendingResumeTimeRef = useRef<number | null>(null);
    const lastKnownTimeRef = useRef<number>(0);
    const errorRetryCountRef = useRef<number>(0);
    const consecutiveTrackSkipRef = useRef<number>(0);
    const tokenExpiryRef = useRef<number>(0);
    const isSwitchingTrackRef = useRef<boolean>(false);
    const switchTrackTimerRef = useRef<number | null>(null);
    const isPlaylistHydratedRef = useRef<boolean>(false);
    const isServerHydratedRef = useRef<boolean>(false);
    const lastSyncedPlaylistJsonRef = useRef<string>('');
    const googleClientIdRef = useRef<string>(DEFAULT_GOOGLE_CLIENT_ID);
    const googleClientSecretRef = useRef<string>('');
    const hasServerClientSecretRef = useRef<boolean>(false);
    const silentGsiInflightRef = useRef<Promise<string> | null>(null);
    const activeStreamLockRef = useRef<{ trackId: string; retry: number; url: string }>({
        trackId: '',
        retry: -1,
        url: '',
    });
    const resumeRetryTimersRef = useRef<number[]>([]);

    useEffect(() => {
        googleClientIdRef.current = googleClientId;
    }, [googleClientId]);

    useEffect(() => {
        googleClientSecretRef.current = googleClientSecret;
    }, [googleClientSecret]);

    useEffect(() => {
        hasServerClientSecretRef.current = hasServerClientSecret;
    }, [hasServerClientSecret]);

    const markTrackSwitching = useCallback(() => {
        isSwitchingTrackRef.current = true;
        if (typeof window !== 'undefined') {
            if (switchTrackTimerRef.current !== null) {
                window.clearTimeout(switchTrackTimerRef.current);
            }
            // 트랙 변경 직후 동기적 src 교체 순간(120ms)만 방어하고, 이후 로딩 중 OS가 강제하는 pause는 즉시 감지·복구
            switchTrackTimerRef.current = window.setTimeout(() => {
                isSwitchingTrackRef.current = false;
                switchTrackTimerRef.current = null;
            }, 120);
        }
    }, []);

    const clearResumeRetryTimers = useCallback(() => {
        if (typeof window === 'undefined') return;
        for (const timerId of resumeRetryTimersRef.current) {
            window.clearTimeout(timerId);
        }
        resumeRetryTimersRef.current = [];
    }, []);

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

        const savedClientSecret = localStorage.getItem(STORAGE_KEYS.CLIENT_SECRET);
        if (savedClientSecret && savedClientSecret.trim()) {
            setGoogleClientSecret(savedClientSecret.trim());
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

        const isMobileDevice =
            typeof navigator !== 'undefined' &&
            /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
        const savedAudioOnly = localStorage.getItem(STORAGE_KEYS.AUDIO_ONLY);
        if (isMobileDevice) {
            setIsAudioOnlyMode(true);
            localStorage.setItem(STORAGE_KEYS.AUDIO_ONLY, 'true');
        } else if (savedAudioOnly === 'false') {
            setIsAudioOnlyMode(false);
        } else {
            setIsAudioOnlyMode(true);
        }

        const savedToken =
            localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const savedExpiry = Number(
            localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) ||
                sessionStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRY) ||
                '0'
        );
        let activeToken = '';
        if (savedToken && savedExpiry > Date.now() + 60_000) {
            activeToken = savedToken;
            tokenExpiryRef.current = savedExpiry;
            setAccessToken(savedToken);
            setIsDriveConnected(true);
        } else if (savedToken) {
            // 만료된 좀비 토큰은 즉시 폐기하여 스트리밍 URL(?token=...)에 죽은 토큰이 주입되는 것을 원천 차단
            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
            sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
            sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
            tokenExpiryRef.current = 0;
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
                            streamUrl: buildStreamUrl(item.id, ''),
                        }));
                    if (hydrated.length > 0) {
                        lastSyncedPlaylistJsonRef.current = JSON.stringify(hydrated);
                        setPlaylist(hydrated);
                        setIsDriveConnected(true);
                    }
                }
            } catch (_) {
                // 손상된 로컬 스토리지 무시
            }
        }
        isPlaylistHydratedRef.current = true;
    }, []);

    // 재생목록을 로컬스토리지 및 백엔드 DB에 즉시 안전하게 저장 (keepalive 적용)
    const syncPlaylistToServer = useCallback(
        (items: VideoPlaylistItem[], allowEmpty = false) => {
            if (typeof window === 'undefined') return;
            const driveOnly = items
                .filter((item) => item.sourceType === 'google-drive')
                .map((item) => ({
                    ...item,
                    streamUrl: buildStreamUrl(item.id, ''),
                }));
            const serialized = JSON.stringify(driveOnly);
            localStorage.setItem(STORAGE_KEYS.PLAYLIST, serialized);

            if (driveOnly.length === 0 && !allowEmpty) {
                return;
            }
            if (serialized === lastSyncedPlaylistJsonRef.current && !allowEmpty) {
                return;
            }
            lastSyncedPlaylistJsonRef.current = serialized;

            void fetch(`${API_BASE_URL}/api/user/drive/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                keepalive: true,
                body: JSON.stringify({ playlist: driveOnly }),
            }).catch(() => {});
        },
        []
    );

    // 구글 드라이브 항목이 변경될 때 로컬스토리지 및 서버 DB에 보존 (초기 마운트 시 빈 배열 덮어쓰기 방지)
    useEffect(() => {
        if (typeof window === 'undefined' || !isPlaylistHydratedRef.current) return;
        const driveOnly = playlist.filter((item) => item.sourceType === 'google-drive');
        if (driveOnly.length === 0 && !isServerHydratedRef.current) {
            return;
        }
        if (driveOnly.length > 0) {
            syncPlaylistToServer(driveOnly, false);
        }
    }, [playlist, syncPlaylistToServer]);

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

    // ─── 트랙의 실시간 스트림 URL 계산 헬퍼 ───
    const getStreamUrlForTrack = useCallback(
        (raw: VideoPlaylistItem, retry = 0, audioMode = true): string => {
            if (raw.sourceType !== 'google-drive') {
                return raw.streamUrl;
            }
            const lockKey = `${raw.id}:${audioMode ? 'audio' : 'video'}`;
            // 현재 재생 중인 트랙/모드/재시도 시퀀스가 잠금 상태라면 토큰 변동과 무관하게 기존 스트림 URL을 유지하여 곡 중간 리로드 원천 차단
            if (
                activeStreamLockRef.current.trackId === lockKey &&
                activeStreamLockRef.current.retry === retry &&
                activeStreamLockRef.current.url
            ) {
                return activeStreamLockRef.current.url;
            }
            const isTokenStillValid = tokenExpiryRef.current > Date.now() + 10_000;
            const freshToken = isTokenStillValid
                ? accessToken ||
                  (typeof window !== 'undefined'
                      ? localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
                        sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ||
                        ''
                      : '')
                : '';
            const baseStreamUrl = buildStreamUrl(raw.id, freshToken, audioMode);
            const finalStreamUrl =
                retry > 0
                    ? `${baseStreamUrl}${baseStreamUrl.includes('?') ? '&' : '?'}retry=${retry}`
                    : baseStreamUrl;
            activeStreamLockRef.current = {
                trackId: lockKey,
                retry,
                url: finalStreamUrl,
            };
            return finalStreamUrl;
        },
        [accessToken]
    );

    // ─── 현재 재생 중인 트랙 (최신 Google Drive 토큰 및 재시도 시퀀스를 실시간 주입) ───
    const currentTrack: VideoPlaylistItem | null = useMemo(() => {
        if (playlist.length === 0) return null;
        const safeIdx = Math.min(Math.max(0, currentIndex), playlist.length - 1);
        const raw = playlist[safeIdx];
        if (!raw) return null;

        if (raw.sourceType === 'google-drive') {
            const useAudioStream =
                isAudioOnlyMode || !isFullStageMounted || isAudioMedia(raw.mimeType, raw.name);
            return {
                ...raw,
                streamUrl: getStreamUrlForTrack(raw, retryNonce, useAudioStream),
            };
        }

        return raw;
    }, [playlist, currentIndex, retryNonce, isAudioOnlyMode, isFullStageMounted, getStreamUrlForTrack]);

    const isCurrentTrackAudio = useMemo(() => {
        if (!currentTrack) return false;
        return isAudioMedia(currentTrack.mimeType, currentTrack.name);
    }, [currentTrack]);

    const applyNewAccessToken = useCallback((newToken: string, expiresInSec = 3500) => {
        const expiryTime = Date.now() + expiresInSec * 1000;
        tokenExpiryRef.current = expiryTime;

        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
            localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
            sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newToken);
            sessionStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRY, String(expiryTime));
        }

        setAccessToken((prev) => (prev === newToken ? prev : newToken));
        setIsDriveConnected(true);
        setPlayerError(null);
    }, []);

    // ─── 브라우저 Google Identity Services 무음 토큰 자동 갱신 (prompt: 'none') ───
    const silentGsiTokenRefresh = useCallback(async (): Promise<string> => {
        if (typeof window === 'undefined') return '';
        if (silentGsiInflightRef.current) {
            return silentGsiInflightRef.current;
        }

        const activeClientId = (
            googleClientIdRef.current ||
            localStorage.getItem(STORAGE_KEYS.CLIENT_ID) ||
            DEFAULT_GOOGLE_CLIENT_ID
        ).trim();
        if (!activeClientId) return '';

        const task = (async (): Promise<string> => {
            try {
                await loadGsiScript();
                const win = window as WindowWithGoogleGsi;
                const oauth2 = win.google?.accounts?.oauth2;
                if (!oauth2) return '';

                return await new Promise<string>((resolve) => {
                    let settled = false;
                    const timeoutId = window.setTimeout(() => {
                        if (!settled) {
                            settled = true;
                            resolve('');
                        }
                    }, 6000);

                    const finish = (token: string) => {
                        if (!settled) {
                            settled = true;
                            window.clearTimeout(timeoutId);
                            resolve(token);
                        }
                    };

                    try {
                        const tokenClient = oauth2.initTokenClient({
                            client_id: activeClientId,
                            scope: DRIVE_READONLY_SCOPE,
                            callback: (tokenResponse) => {
                                if (tokenResponse.error || !tokenResponse.access_token) {
                                    finish('');
                                    return;
                                }
                                const expiresIn = tokenResponse.expires_in || 3500;
                                applyNewAccessToken(tokenResponse.access_token, expiresIn);
                                void fetch(`${API_BASE_URL}/api/user/drive/oauth/exchange`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    keepalive: true,
                                    body: JSON.stringify({
                                        accessToken: tokenResponse.access_token,
                                        expiresIn,
                                        clientId: activeClientId,
                                        clientSecret: googleClientSecretRef.current || undefined,
                                    }),
                                }).catch(() => {});
                                finish(tokenResponse.access_token);
                            },
                            error_callback: () => {
                                finish('');
                            },
                        });
                        tokenClient.requestAccessToken({ prompt: 'none' });
                    } catch (_) {
                        finish('');
                    }
                });
            } catch (_) {
                return '';
            } finally {
                silentGsiInflightRef.current = null;
            }
        })();

        silentGsiInflightRef.current = task;
        return task;
    }, [applyNewAccessToken]);

    // ─── 서버 기반 무음(Zero-Popup) 토큰 자동 갱신 & 동기화 ───
    const refreshDriveTokenSilently = useCallback(
        async (forceRefresh = true): Promise<string> => {
            try {
                const res = await fetch(
                    `${API_BASE_URL}/api/user/drive/token${forceRefresh ? '?refresh=1' : ''}`,
                    { credentials: 'include' }
                );
                if (!res.ok) return '';
                const json = (await res.json()) as {
                    success?: boolean;
                    data?: {
                        clientId?: string;
                        hasClientSecret?: boolean;
                        accessToken?: string;
                        expiryDate?: number;
                        hasRefreshToken?: boolean;
                        isPermanentConnected?: boolean;
                        hasEverConnected?: boolean;
                        playlist?: VideoPlaylistItem[];
                    };
                };
                if (!json.success || !json.data) return '';

                isServerHydratedRef.current = true;

                const {
                    clientId: serverClientId,
                    hasClientSecret: serverHasSecret,
                    accessToken: serverToken,
                    expiryDate: serverExpiry,
                    isPermanentConnected: permConnected,
                    hasEverConnected,
                    playlist: serverPlaylist,
                } = json.data;

                if (serverClientId) {
                    setGoogleClientId((prev) => prev || serverClientId);
                    if (typeof window !== 'undefined' && !localStorage.getItem(STORAGE_KEYS.CLIENT_ID)) {
                        localStorage.setItem(STORAGE_KEYS.CLIENT_ID, serverClientId);
                    }
                }
                if (serverHasSecret !== undefined) {
                    setHasServerClientSecret(Boolean(serverHasSecret));
                    hasServerClientSecretRef.current = Boolean(serverHasSecret);
                }
                setIsPermanentConnected(Boolean(permConnected));
                if (hasEverConnected) {
                    setIsDriveConnected(true);
                }

                const isServerTokenValid =
                    Boolean(serverToken) && (!serverExpiry || serverExpiry > Date.now() + 60_000);
                const validServerToken = isServerTokenValid ? serverToken || '' : '';

                // 서버 DB에 백업된 재생목록이 있고 현재 로컬 재생목록이 비어 있으면 자동 복원
                if (Array.isArray(serverPlaylist) && serverPlaylist.length > 0) {
                    setPlaylist((prev) => {
                        if (prev.length > 0) return prev;
                        const hydrated = serverPlaylist
                            .filter((item) => item && item.sourceType === 'google-drive')
                            .map((item) => ({
                                ...item,
                                streamUrl: buildStreamUrl(item.id, ''),
                            }));
                        if (hydrated.length > 0) {
                            lastSyncedPlaylistJsonRef.current = JSON.stringify(hydrated);
                            return hydrated;
                        }
                        return prev;
                    });
                    setIsDriveConnected(true);
                }

                if (
                    validServerToken &&
                    (!serverExpiry || serverExpiry > Date.now() + 3 * 60 * 1000)
                ) {
                    const remainingSec = serverExpiry
                        ? Math.max(60, Math.floor((serverExpiry - Date.now()) / 1000))
                        : 3500;
                    applyNewAccessToken(validServerToken, remainingSec);
                    return validServerToken;
                }

                // 서버 토큰이 만료되었거나 만료 임박(12분 이내)이고 화면이 보이는 상태라면 브라우저 GIS 무음 갱신 시도
                if (
                    typeof document !== 'undefined' &&
                    document.visibilityState === 'visible' &&
                    (!validServerToken ||
                        (serverExpiry && serverExpiry <= Date.now() + 12 * 60 * 1000))
                ) {
                    const silentToken = await silentGsiTokenRefresh();
                    if (silentToken) {
                        return silentToken;
                    }
                }

                if (validServerToken) {
                    const remainingSec = serverExpiry
                        ? Math.max(60, Math.floor((serverExpiry - Date.now()) / 1000))
                        : 300;
                    applyNewAccessToken(validServerToken, remainingSec);
                    return validServerToken;
                }

                // 서버와 무음 GIS 모두에서 유효한 토큰을 얻지 못했고 기존 로컬 토큰도 만료된 경우 만료 토큰 정리 (단, 현재 재생 중인 곡의 스트림 잠금은 건드리지 않음)
                if (tokenExpiryRef.current <= Date.now() + 10_000) {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                        localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
                        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                        sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
                    }
                    tokenExpiryRef.current = 0;
                    if (!userWantsPlayRef.current) {
                        activeStreamLockRef.current = { trackId: '', retry: -1, url: '' };
                    }
                    setAccessToken('');
                }
            } catch (_) {
                // 비로그인 또는 네트워크 일시 오류 무시
            }
            return '';
        },
        [applyNewAccessToken, silentGsiTokenRefresh]
    );

    // ─── Google Drive API 파일 목록 조회 (폴더 + 동영상 + 음악 통합 지원) ───
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
                const mediaOrFolderClause = `(mimeType = '${FOLDER_MIME_TYPE}' or mimeType contains 'video/' or mimeType contains 'audio/')`;

                if (trimmedKeyword) {
                    queryParts.push(`name contains '${trimmedKeyword}'`);
                    queryParts.push(mediaOrFolderClause);
                } else if (tab === 'my-drive') {
                    queryParts.push(`'${folderId}' in parents`);
                    queryParts.push(mediaOrFolderClause);
                } else if (tab === 'shared') {
                    if (folderId !== 'root') {
                        queryParts.push(`'${folderId}' in parents`);
                    } else {
                        queryParts.push('sharedWithMe = true');
                    }
                    queryParts.push(mediaOrFolderClause);
                } else if (tab === 'all-audio') {
                    queryParts.push(`mimeType contains 'audio/'`);
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
                    let googleErrorMsg = '';
                    try {
                        const errJson = await response.json();
                        googleErrorMsg = errJson?.error?.message || '';
                    } catch (_) {}

                    if (response.status === 401) {
                        // 토큰이 만료된 경우 서버 refresh_token 및 브라우저 무음 GIS로 자동 갱신 후 재조회 시도
                        const refreshedToken = await refreshDriveTokenSilently(true);
                        if (refreshedToken && refreshedToken !== tokenToUse) {
                            const retryRes = await fetch(url, {
                                headers: {
                                    Authorization: `Bearer ${refreshedToken}`,
                                },
                            });
                            if (retryRes.ok) {
                                const retryData = (await retryRes.json()) as DriveFilesListResponse;
                                setDriveItems(retryData.files || []);
                                return;
                            }
                        }

                        if (typeof window !== 'undefined') {
                            localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                            localStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
                            sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
                            sessionStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRY);
                        }
                        tokenExpiryRef.current = 0;
                        setAccessToken('');
                        throw new Error(
                            '구글 드라이브 인증 토큰을 갱신할 수 없습니다. 상단 [구글 재로그인] 버튼을 한 번 눌러주세요.'
                        );
                    }

                    if (response.status === 403) {
                        if (googleErrorMsg.toLowerCase().includes('disabled') || googleErrorMsg.toLowerCase().includes('not been used')) {
                            throw new Error(
                                'Google Cloud Console에서 "Google Drive API"가 활성화되지 않았습니다. API 라이브러리에서 Google Drive API [사용] 버튼을 클릭해 주세요.'
                            );
                        }
                        throw new Error(
                            googleErrorMsg ||
                            '구글 드라이브 접근 권한이 없습니다. 로그인 시 "드라이브 파일 보기" 권한을 허용했는지 확인해 주세요.'
                        );
                    }

                    throw new Error(`구글 드라이브 목록 조회 실패 (HTTP ${response.status}: ${googleErrorMsg})`);
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
        [refreshDriveTokenSilently]
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

    // 마운트 시 서버에 저장된 영구 연결 토큰 자동 복원 + 4분 주기 선제적 백그라운드 무음 리프레시
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // 1) 최초 마운트 시 서버에서 유효 토큰 & 재생목록 동기화
        refreshDriveTokenSilently(false);

        // 2) 4분마다 토큰 만료 12분 전 여부를 체크하여 팝업 없이 서버 또는 브라우저 GIS 무음 리프레시
        const timer = window.setInterval(() => {
            const now = Date.now();
            if (tokenExpiryRef.current === 0 || now >= tokenExpiryRef.current - 12 * 60 * 1000) {
                void refreshDriveTokenSilently(true);
            }
        }, 4 * 60 * 1000);

        return () => {
            window.clearInterval(timer);
        };
    }, [refreshDriveTokenSilently]);

    const requestGoogleDriveAuth = useCallback(
        async (forceSelectAccount: boolean) => {
            const activeClientId = (googleClientIdRef.current || googleClientId).trim();
            const activeClientSecret = (googleClientSecretRef.current || googleClientSecret).trim();
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

                const runTokenClientFallback = () => {
                    const tokenClient = oauth2.initTokenClient({
                        client_id: activeClientId,
                        scope: DRIVE_READONLY_SCOPE,
                        callback: async (tokenResponse) => {
                            if (tokenResponse.error || !tokenResponse.access_token) {
                                const errDesc =
                                    tokenResponse.error_description || tokenResponse.error || '';
                                if (errDesc.includes('origin_mismatch') || errDesc.includes('400')) {
                                    setIsClientConfigOpen(true);
                                    showNotice(
                                        `⚠️ 구글 콘솔에 현재 도메인(${window.location.origin}) 등록이 필요합니다.`
                                    );
                                } else {
                                    setDriveError(
                                        errDesc ||
                                            '구글 드라이브 접근 권한 승인이 취소되었거나 실패했습니다.'
                                    );
                                }
                                return;
                            }
                            const expiresIn = tokenResponse.expires_in || 3500;
                            applyNewAccessToken(tokenResponse.access_token, expiresIn);

                            // 발급된 토큰을 백엔드 DB에도 동기화하여 스트리밍 프록시가 즉시 사용하도록 보장
                            try {
                                const syncRes = await fetch(
                                    `${API_BASE_URL}/api/user/drive/oauth/exchange`,
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        keepalive: true,
                                        body: JSON.stringify({
                                            accessToken: tokenResponse.access_token,
                                            expiresIn,
                                            clientId: activeClientId,
                                            clientSecret: activeClientSecret || undefined,
                                        }),
                                    }
                                );
                                if (syncRes.ok) {
                                    const syncJson = (await syncRes.json()) as {
                                        data?: { isPermanentConnected?: boolean };
                                    };
                                    if (syncJson.data?.isPermanentConnected) {
                                        setIsPermanentConnected(true);
                                    }
                                }
                            } catch (_) {}

                            setRetryNonce((n) => n + 1);
                            setIsPickerOpen(true);
                            showNotice('구글 드라이브가 성공적으로 연결되었습니다!');
                        },
                        error_callback: (err) => {
                            const msg = err?.message || '';
                            if (
                                msg.includes('origin_mismatch') ||
                                msg.includes('400') ||
                                msg.includes('popup_closed_by_user')
                            ) {
                                showNotice(
                                    msg.includes('origin_mismatch')
                                        ? `⚠️ 구글 콘솔에 현재 도메인(${window.location.origin})을 등록해 주세요.`
                                        : msg || '구글 인증 팝업이 닫혔습니다.'
                                );
                            } else {
                                showNotice(msg || '구글 계정 인증 팝업이 닫혔거나 차단되었습니다.');
                            }
                        },
                    });

                    tokenClient.requestAccessToken({
                        prompt: forceSelectAccount ? 'select_account' : '',
                    });
                };

                // Client Secret이 로컬 또는 서버 DB에 등록된 경우: Offline Authorization Code 플로우로 영구 refresh_token 발급!
                if (
                    (activeClientSecret || hasServerClientSecretRef.current) &&
                    typeof oauth2.initCodeClient === 'function'
                ) {
                    const codeClient = oauth2.initCodeClient({
                        client_id: activeClientId,
                        scope: DRIVE_READONLY_SCOPE,
                        ux_mode: 'popup',
                        access_type: 'offline',
                        prompt: forceSelectAccount ? 'consent select_account' : 'consent',
                        callback: async (codeResponse) => {
                            if (codeResponse.error || !codeResponse.code) {
                                runTokenClientFallback();
                                return;
                            }
                            try {
                                const exRes = await fetch(
                                    `${API_BASE_URL}/api/user/drive/oauth/exchange`,
                                    {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        keepalive: true,
                                        body: JSON.stringify({
                                            code: codeResponse.code,
                                            clientId: activeClientId,
                                            clientSecret: activeClientSecret || undefined,
                                            redirectUri: 'postmessage',
                                        }),
                                    }
                                );
                                const exJson = (await exRes.json()) as {
                                    success?: boolean;
                                    data?: {
                                        accessToken?: string;
                                        expiryDate?: number;
                                        isPermanentConnected?: boolean;
                                    };
                                };
                                if (exRes.ok && exJson.success && exJson.data?.accessToken) {
                                    const remSec = exJson.data.expiryDate
                                        ? Math.max(
                                              60,
                                              Math.floor((exJson.data.expiryDate - Date.now()) / 1000)
                                          )
                                        : 3500;
                                    applyNewAccessToken(exJson.data.accessToken, remSec);
                                    setIsPermanentConnected(Boolean(exJson.data.isPermanentConnected));
                                    setRetryNonce((n) => n + 1);
                                    setIsPickerOpen(true);
                                    showNotice(
                                        '🔒 구글 드라이브 영구 자동연결이 활성화되었습니다! (끊김 시 자동 재연결)'
                                    );
                                    return;
                                }
                                runTokenClientFallback();
                            } catch (_) {
                                runTokenClientFallback();
                            }
                        },
                        error_callback: () => {
                            runTokenClientFallback();
                        },
                    });

                    codeClient.requestCode();
                    return;
                }

                runTokenClientFallback();
            } catch (err: unknown) {
                const msg =
                    err instanceof Error
                        ? err.message
                        : '구글 드라이브 연결 중 오류가 발생했습니다.';
                showNotice(msg);
            }
        },
        [googleClientId, googleClientSecret, applyNewAccessToken, showNotice]
    );

    // ─── Google OAuth 로그인 & 드라이브 모달 열기 ───
    const connectAndOpenDrivePicker = useCallback(async () => {
        const isTokenStillValid =
            Boolean(accessToken) &&
            isDriveConnected &&
            tokenExpiryRef.current > Date.now() + 60_000;

        if (isTokenStillValid) {
            setIsPickerOpen(true);
            return;
        }

        // 팝업을 띄우기 전에 먼저 서버에 저장된 영구 refresh_token으로 무음 갱신이 가능한지 확인!
        const silentlyRefreshed = await refreshDriveTokenSilently(true);
        if (silentlyRefreshed) {
            setIsPickerOpen(true);
            return;
        }

        await requestGoogleDriveAuth(false);
    }, [accessToken, isDriveConnected, refreshDriveTokenSilently, requestGoogleDriveAuth]);

    // ─── Google 계정 강제 재인증 / 계정 전환 팝업 열기 (팝업을 닫더라도 기존 연동 상태가 끊기지 않도록 보호) ───
    const forceReconnectDrive = useCallback(async () => {
        await requestGoogleDriveAuth(true);
    }, [requestGoogleDriveAuth]);

    const saveGoogleClientId = useCallback(
        async (newClientId: string, newClientSecret?: string) => {
            const trimmedId = newClientId.trim();
            const trimmedSecret = (newClientSecret ?? googleClientSecret).trim();
            setGoogleClientId(trimmedId);
            googleClientIdRef.current = trimmedId;
            setGoogleClientSecret(trimmedSecret);
            googleClientSecretRef.current = trimmedSecret;
            if (trimmedSecret) {
                setHasServerClientSecret(true);
                hasServerClientSecretRef.current = true;
            }
            if (typeof window !== 'undefined') {
                if (trimmedId) {
                    localStorage.setItem(STORAGE_KEYS.CLIENT_ID, trimmedId);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
                }
                if (trimmedSecret) {
                    localStorage.setItem(STORAGE_KEYS.CLIENT_SECRET, trimmedSecret);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.CLIENT_SECRET);
                }
            }
            let serverPermConnected = isPermanentConnected;
            try {
                const res = await fetch(`${API_BASE_URL}/api/user/drive/config`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    keepalive: true,
                    body: JSON.stringify({
                        clientId: trimmedId,
                        clientSecret: trimmedSecret,
                    }),
                });
                if (res.ok) {
                    const json = (await res.json()) as {
                        data?: {
                            hasClientSecret?: boolean;
                            isPermanentConnected?: boolean;
                        };
                    };
                    if (json.data?.hasClientSecret !== undefined) {
                        setHasServerClientSecret(Boolean(json.data.hasClientSecret));
                        hasServerClientSecretRef.current = Boolean(json.data.hasClientSecret);
                    }
                    if (json.data?.isPermanentConnected !== undefined) {
                        serverPermConnected = Boolean(json.data.isPermanentConnected);
                        setIsPermanentConnected(serverPermConnected);
                    }
                }
            } catch (_) {}
            setIsClientConfigOpen(false);

            // Client Secret을 새로 입력했고 아직 영구 refresh_token이 발급되지 않았다면 즉시 오프라인 코드 인증 실행
            if (trimmedId && trimmedSecret && !serverPermConnected) {
                showNotice(
                    '🔒 영구 자동연결 설정이 저장되었습니다. 구글 권한 승인을 완료하면 영구 연결이 활성화됩니다.'
                );
                await requestGoogleDriveAuth(false);
                return;
            }

            showNotice(
                trimmedSecret
                    ? '🔒 구글 OAuth Client ID 및 보안 비밀번호(영구 자동연결용)가 저장되었습니다.'
                    : '구글 OAuth Client ID 설정이 저장되었습니다.'
            );
        },
        [googleClientSecret, isPermanentConnected, requestGoogleDriveAuth, showNotice]
    );

    // ─── 폴더 탐색 제어 ───
    const handleChangeExplorerTab = useCallback((tab: DriveExplorerTab) => {
        setExplorerTab(tab);
        setDriveSearchQuery('');
        if (tab === 'my-drive') {
            setBreadcrumbs([{ id: 'root', name: '내 드라이브' }]);
        } else if (tab === 'shared') {
            setBreadcrumbs([{ id: 'root', name: '공유 문서함' }]);
        } else if (tab === 'all-audio') {
            setBreadcrumbs([{ id: 'root', name: '전체 음악' }]);
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
                streamUrl: buildStreamUrl(item.id, ''),
                folderName,
            };
        },
        []
    );

    const appendItemsToPlaylist = useCallback(
        (newItems: VideoPlaylistItem[]) => {
            if (newItems.length === 0) return;
            setPlaylist((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const deduped = newItems.filter((item) => !existingIds.has(item.id));
                const merged = [...prev, ...deduped];
                if (prev.length === 0 && merged.length > 0) {
                    userWantsPlayRef.current = true;
                    setIsMiniBarDismissed(false);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'false');
                    }
                    setCurrentIndex(0);
                    setIsPlaying(true);
                }
                const driveOnly = merged.filter((item) => item.sourceType === 'google-drive');
                if (driveOnly.length > 0) {
                    syncPlaylistToServer(driveOnly, false);
                }
                return merged;
            });
        },
        [syncPlaylistToServer]
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
        showNotice(`🎵 선택한 미디어(영상·음악) ${mapped.length}개를 재생목록에 추가했습니다.`);
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
                const q = `'${folder.id}' in parents and trashed = false and (mimeType contains 'video/' or mimeType contains 'audio/')`;
                const fields =
                    'files(id,name,mimeType,size,thumbnailLink,modifiedTime,videoMediaMetadata)';
                const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
                    q
                )}&fields=${encodeURIComponent(
                    fields
                )}&orderBy=name_natural&pageSize=100&includeItemsFromAllDrives=true&supportsAllDrives=true`;

                let response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (response.status === 401) {
                    const refreshedToken = await refreshDriveTokenSilently(true);
                    if (refreshedToken) {
                        response = await fetch(url, {
                            headers: {
                                Authorization: `Bearer ${refreshedToken}`,
                            },
                        });
                    }
                }
                if (!response.ok) {
                    throw new Error(`폴더 내 미디어 조회 실패 (HTTP ${response.status})`);
                }
                const data = (await response.json()) as DriveFilesListResponse;
                const mediaFiles = data.files || [];
                if (mediaFiles.length === 0) {
                    showNotice(`'${folder.name}' 폴더 안에 재생 가능한 동영상이나 음악 파일이 없습니다.`);
                    return;
                }
                const mapped = mediaFiles.map((v) =>
                    convertDriveItemToPlaylistItem(v, folder.name)
                );
                appendItemsToPlaylist(mapped);
                showNotice(
                    `📁 '${folder.name}' 폴더의 영상·음악 ${mapped.length}개를 모두 추가했습니다!`
                );
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : '폴더 내 미디어 파일을 불러오지 못했습니다.';
                showNotice(msg);
            } finally {
                setIsLoadingFolderBatch(null);
            }
        },
        [accessToken, refreshDriveTokenSilently, convertDriveItemToPlaylistItem, appendItemsToPlaylist, showNotice]
    );

    // ─── 보조 소스: 구글 드라이브 공유 링크 & 로컬 비디오/음악 파일 추가 ───
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
                    : `Google Drive Media (${fileId.slice(0, 8)})`;

            const newItem: VideoPlaylistItem = {
                id: fileId,
                name: label,
                mimeType: isAudioMedia('', label) ? 'audio/mpeg' : 'video/mp4',
                sizeBytes: null,
                durationMs: null,
                thumbnailUrl: null,
                sourceType: 'google-drive',
                streamUrl: buildStreamUrl(fileId, ''),
                folderName: '드라이브 링크',
            };
            appendItemsToPlaylist([newItem]);
            setIsShareLinkModalOpen(false);
            showNotice(`🔗 '${label}' 미디어가 재생목록에 추가되었습니다.`);
            return true;
        },
        [appendItemsToPlaylist, showNotice]
    );

    const handleAddLocalFiles = useCallback(
        (files: FileList | null) => {
            if (!files || files.length === 0) return;
            const added: VideoPlaylistItem[] = [];
            for (let i = 0; i < files.length; i += 1) {
                const file = files[i];
                if (!file) continue;
                const isAudio = isAudioMedia(file.type, file.name);
                const isVideo =
                    file.type.startsWith('video/') ||
                    /\.(mp4|mkv|webm|mov|avi|m4v|ts)$/i.test(file.name);
                if (!isAudio && !isVideo) continue;

                const objectUrl = URL.createObjectURL(file);
                added.push({
                    id: `local_${Date.now()}_${i}_${file.name}`,
                    name: file.name,
                    mimeType: file.type || (isAudio ? 'audio/mpeg' : 'video/mp4'),
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
                showNotice(`💻 내 기기에서 영상·음악 파일 ${added.length}개를 불러왔습니다.`);
            }
        },
        [appendItemsToPlaylist, showNotice]
    );

    // ─── 재생목록 편집 ───
    const removePlaylistItem = useCallback(
        (id: string) => {
            setPlaylist((prev) => {
                const idx = prev.findIndex((item) => item.id === id);
                if (idx === -1) return prev;
                const target = prev[idx];
                if (
                    target &&
                    target.sourceType === 'local' &&
                    target.streamUrl.startsWith('blob:')
                ) {
                    URL.revokeObjectURL(target.streamUrl);
                }
                const next = prev.filter((item) => item.id !== id);
                setCurrentIndex((currIdx) => {
                    if (next.length === 0) return 0;
                    if (idx < currIdx) return Math.max(0, currIdx - 1);
                    if (currIdx >= next.length) return next.length - 1;
                    return currIdx;
                });
                const driveOnly = next.filter((item) => item.sourceType === 'google-drive');
                syncPlaylistToServer(driveOnly, true);
                return next;
            });
        },
        [syncPlaylistToServer]
    );

    const clearPlaylist = useCallback(() => {
        setPlaylist((prev) => {
            for (const item of prev) {
                if (item.sourceType === 'local' && item.streamUrl.startsWith('blob:')) {
                    URL.revokeObjectURL(item.streamUrl);
                }
            }
            return [];
        });
        syncPlaylistToServer([], true);
        setCurrentIndex(0);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setPlayerError(null);
        setIsMiniBarDismissed(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'true');
        }
    }, [syncPlaylistToServer]);

    // ─── 비디오 플레이어 컨트롤 (재생/일시정지/랜덤/볼륨/진행바/전체화면) ───
    const togglePlayPause = useCallback(() => {
        const video = videoRef.current;
        if (!video || !currentTrack) return;
        if (video.paused) {
            userWantsPlayRef.current = true;
            setIsMiniBarDismissed(false);
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'false');
            }
            if (
                tokenExpiryRef.current === 0 ||
                Date.now() >= tokenExpiryRef.current - 10 * 60 * 1000
            ) {
                void refreshDriveTokenSilently(true);
            }
            video.play().catch(() => {
                userWantsPlayRef.current = false;
                setIsPlaying(false);
            });
        } else {
            clearResumeRetryTimers();
            userWantsPlayRef.current = false;
            video.pause();
        }
    }, [currentTrack, clearResumeRetryTimers, refreshDriveTokenSilently]);

    const stopPlayback = useCallback(() => {
        clearResumeRetryTimers();
        userWantsPlayRef.current = false;
        pendingResumeTimeRef.current = null;
        lastKnownTimeRef.current = 0;
        setIsPlaying(false);
        setCurrentTime(0);
        setIsMiniBarDismissed(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'true');
        }
        const video = videoRef.current;
        if (video) {
            video.pause();
            try {
                video.currentTime = 0;
            } catch (_) {}
        }
    }, [clearResumeRetryTimers]);

    const switchAndPlayAtIndex = useCallback(
        (targetIndex: number) => {
            if (targetIndex < 0 || targetIndex >= playlist.length) return;
            clearResumeRetryTimers();
            markTrackSwitching();
            setPlayerError(null);
            errorRetryCountRef.current = 0;
            setRetryNonce(0);
            pendingResumeTimeRef.current = null;
            userWantsPlayRef.current = true;
            setIsMiniBarDismissed(false);
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'false');
            }
            setCurrentIndex(targetIndex);
            setCurrentTime(0);
            setIsPlaying(true);

            if (
                tokenExpiryRef.current === 0 ||
                Date.now() >= tokenExpiryRef.current - 10 * 60 * 1000
            ) {
                void refreshDriveTokenSilently(true);
            }

            const media = videoRef.current;
            const nextTrack = playlist[targetIndex];
            if (media && nextTrack) {
                const useAudioStream =
                    isAudioOnlyMode ||
                    !isFullStageMounted ||
                    isAudioMedia(nextTrack.mimeType, nextTrack.name);
                const nextUrl = getStreamUrlForTrack(nextTrack, 0, useAudioStream);
                if (media.getAttribute('src') !== nextUrl) {
                    // media.load()를 호출하지 않고 src만 교체하여 모바일 백그라운드 오디오 세션을 끊김 없이 유지
                    media.src = nextUrl;
                }
                const playPromise = media.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }

                // 백그라운드(화면 잠금) 상태에서 다음 곡 MP4 헤더 파싱(0.8~2.3초) 완료 즉시 재생이 이어지도록 다중 보장 타이머 가동
                if (typeof window !== 'undefined') {
                    const delays = [150, 450, 1000, 2000, 3200];
                    for (const delay of delays) {
                        const timerId = window.setTimeout(() => {
                            if (
                                userWantsPlayRef.current &&
                                videoRef.current &&
                                videoRef.current.paused
                            ) {
                                videoRef.current.play().catch(() => {});
                            }
                        }, delay);
                        resumeRetryTimersRef.current.push(timerId);
                    }
                }
            }
        },
        [
            playlist,
            isAudioOnlyMode,
            isFullStageMounted,
            clearResumeRetryTimers,
            markTrackSwitching,
            getStreamUrlForTrack,
            refreshDriveTokenSilently,
        ]
    );

    const playTrackAtIndex = useCallback(
        (index: number) => {
            switchAndPlayAtIndex(index);
        },
        [switchAndPlayAtIndex]
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
        if (isShuffle && playlist.length > 1) {
            const nextIdx = pickRandomNextIndex(playlist.length, currentIndex);
            switchAndPlayAtIndex(nextIdx);
            return;
        }

        const nextIdx = currentIndex + 1;
        if (nextIdx < playlist.length) {
            switchAndPlayAtIndex(nextIdx);
        } else if (repeatMode === 'all') {
            switchAndPlayAtIndex(0);
        } else {
            userWantsPlayRef.current = false;
            setIsPlaying(false);
        }
    }, [playlist.length, isShuffle, currentIndex, repeatMode, pickRandomNextIndex, switchAndPlayAtIndex]);

    const playPrev = useCallback(() => {
        if (playlist.length === 0) return;
        const video = videoRef.current;
        if (video && video.currentTime > 4) {
            video.currentTime = 0;
            setCurrentTime(0);
            return;
        }
        if (isShuffle && playlist.length > 1) {
            const randomIdx = pickRandomNextIndex(playlist.length, currentIndex);
            switchAndPlayAtIndex(randomIdx);
            return;
        }
        const prevIdx = currentIndex - 1 >= 0 ? currentIndex - 1 : playlist.length - 1;
        switchAndPlayAtIndex(prevIdx);
    }, [playlist.length, isShuffle, currentIndex, pickRandomNextIndex, switchAndPlayAtIndex]);

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

    // ─── 백그라운드 오디오 전용 모드 전환 (화면 끄고 듣기) ───
    const toggleAudioOnlyMode = useCallback(() => {
        if (videoRef.current) {
            pendingResumeTimeRef.current = videoRef.current.currentTime || currentTime;
        } else if (currentTime > 0) {
            pendingResumeTimeRef.current = currentTime;
        }
        setIsAudioOnlyMode((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem(STORAGE_KEYS.AUDIO_ONLY, String(next));
            }
            if (next) {
                showNotice(
                    '🎧 화면 끄고 듣기(백그라운드 오디오) 모드가 켜졌습니다. 핸드폰 화면을 닫아도 끊김 없이 재생됩니다.'
                );
            } else {
                showNotice('🎬 일반 비디오 화면 모드로 전환되었습니다.');
            }
            return next;
        });
    }, [currentTime, showNotice]);

    // ─── 미니 팝업 플레이어 (Picture-in-Picture) 전환 ───
    const togglePip = useCallback(async () => {
        const video = videoRef.current as (HTMLVideoElement & {
            webkitPresentationMode?: string;
            webkitSupportsPresentationMode?: (mode: string) => boolean;
            webkitSetPresentationMode?: (mode: string) => void;
        }) | null;

        if (!video) return;

        if (isAudioOnlyMode) {
            showNotice('미니창(PIP)을 사용하려면 먼저 비디오 화면 모드로 전환해 주세요.');
            return;
        }

        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPipActive(false);
            } else if (typeof video.requestPictureInPicture === 'function') {
                await video.requestPictureInPicture();
                setIsPipActive(true);
            } else if (
                typeof video.webkitSupportsPresentationMode === 'function' &&
                video.webkitSupportsPresentationMode('picture-in-picture') &&
                typeof video.webkitSetPresentationMode === 'function'
            ) {
                const nextMode =
                    video.webkitPresentationMode === 'picture-in-picture'
                        ? 'inline'
                        : 'picture-in-picture';
                video.webkitSetPresentationMode(nextMode);
                setIsPipActive(nextMode === 'picture-in-picture');
            } else {
                showNotice('현재 브라우저에서는 미니 팝업(PIP) 기능을 지원하지 않습니다.');
            }
        } catch (_) {
            showNotice('미니 팝업(PIP) 모드를 실행할 수 없습니다.');
        }
    }, [isAudioOnlyMode, showNotice]);

    // ─── 미디어 메타데이터 로드 및 재생 위치 복원 ───
    const handleLoadedMetadata = useCallback(
        (e: React.SyntheticEvent<HTMLMediaElement>) => {
            const media = e.currentTarget;
            setDuration(media.duration || 0);
            media.volume = volume;
            media.muted = isMuted;
            media.playbackRate = playbackRate;

            if (pendingResumeTimeRef.current !== null && pendingResumeTimeRef.current > 0) {
                const resumeTarget = pendingResumeTimeRef.current;
                pendingResumeTimeRef.current = null;
                try {
                    media.currentTime = Math.min(
                        resumeTarget,
                        Math.max(0, (media.duration || resumeTarget) - 0.25)
                    );
                    lastKnownTimeRef.current = media.currentTime;
                    setCurrentTime(media.currentTime);
                } catch (_) {
                    // seek 예외 무시
                }
            }

            if (userWantsPlayRef.current || isPlaying) {
                media.play().catch((err) => {
                    // 다음 곡으로 넘어갈 때 src 변경으로 인한 AbortError는 정상 동작이므로 무시
                    if (err instanceof Error && err.name === 'AbortError') return;
                    if (
                        typeof document !== 'undefined' &&
                        document.visibilityState === 'hidden' &&
                        userWantsPlayRef.current
                    ) {
                        return;
                    }
                    setIsPlaying(false);
                });
            }
        },
        [volume, isMuted, playbackRate, isPlaying]
    );

    const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLMediaElement>) => {
        const t = e.currentTarget.currentTime || 0;
        lastKnownTimeRef.current = t;
        setCurrentTime(t);
    }, []);

    const handleMediaPlay = useCallback(() => {
        clearResumeRetryTimers();
        userWantsPlayRef.current = true;
        setIsMiniBarDismissed(false);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'false');
        }
        setIsPlaying(true);
        setPlayerError(null);

        if (typeof navigator !== 'undefined') {
            const navWithAudioSession = navigator as Navigator & {
                audioSession?: { type: string };
            };
            if (navWithAudioSession.audioSession) {
                try {
                    navWithAudioSession.audioSession.type = 'playback';
                } catch (_) {}
            }
        }
    }, [clearResumeRetryTimers]);

    const handleMediaPlaying = useCallback(() => {
        errorRetryCountRef.current = 0;
        consecutiveTrackSkipRef.current = 0;
        setIsBuffering(false);
        setPlayerError(null);
    }, []);

    // 백그라운드(화면 잠금)에서 다음 곡 MP4 헤더 로드 완료(canplay) 시 즉시 재생 시작 보장
    const handleMediaCanPlay = useCallback(
        (e: React.SyntheticEvent<HTMLMediaElement>) => {
            const media = e.currentTarget;
            setIsBuffering(false);
            if ((userWantsPlayRef.current || isPlaying) && media.paused) {
                media.play().catch((err) => {
                    if (err instanceof Error && err.name === 'AbortError') return;
                });
            }
        },
        [isPlaying]
    );

    const handleVideoEnded = useCallback(() => {
        const video = videoRef.current;
        if (repeatMode === 'one' && video) {
            video.currentTime = 0;
            userWantsPlayRef.current = true;
            video.play().catch((err) => {
                if (err instanceof Error && err.name === 'AbortError') return;
                setIsPlaying(false);
            });
            return;
        }
        playNext();
    }, [repeatMode, playNext]);

    const handleMediaError = useCallback(() => {
        setIsBuffering(false);
        if (!currentTrack) return;

        // 1) 현재 곡 최대 2회 자동 재시도 (구글 드라이브 일시적 연결 끊김 및 토큰 갱신 대응)
        if (errorRetryCountRef.current < 2) {
            errorRetryCountRef.current += 1;
            const attempt = errorRetryCountRef.current;
            if (lastKnownTimeRef.current > 0) {
                pendingResumeTimeRef.current = lastKnownTimeRef.current;
            }

            void (async () => {
                // 에러 재시도 시 이전 스트림 잠금(만료된 토큰 URL)을 초기화하여 최신 토큰 URL로 재연결 보장
                activeStreamLockRef.current = { trackId: '', retry: -1, url: '' };
                const prevExpiry = tokenExpiryRef.current;
                const refreshed = await refreshDriveTokenSilently(true);
                if (!refreshed || tokenExpiryRef.current <= prevExpiry) {
                    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                        await silentGsiTokenRefresh();
                    }
                }
                setTimeout(() => {
                    activeStreamLockRef.current = { trackId: '', retry: -1, url: '' };
                    setRetryNonce((prev) => prev + 1);
                    if (userWantsPlayRef.current) {
                        setIsPlaying(true);
                    }
                }, 400 * attempt);
            })();
            return;
        }

        // 2) 2회 재시도 후에도 특정 파일 스트림이 실패하면 재생이 멈추지 않도록 다음 곡으로 자동 스킵
        const maxSkips = Math.min(playlist.length, 5);
        if (playlist.length > 1 && consecutiveTrackSkipRef.current < maxSkips) {
            consecutiveTrackSkipRef.current += 1;
            showNotice(`⚠️ "${currentTrack.name}" 연결이 지연되어 다음 곡으로 자동 이동합니다.`);
            setTimeout(() => {
                playNext();
            }, 800);
            return;
        }

        setPlayerError(
            '구글 드라이브 스트리밍 연결이 원활하지 않습니다. 드라이브 다시 연결 또는 파일 공유 권한을 확인해 주세요.'
        );
    }, [currentTrack, playlist.length, playNext, refreshDriveTokenSilently, silentGsiTokenRefresh, showNotice]);

    // 모바일 화면 잠금 또는 페이지 이동(DOM 언마운트) 시 강제 일시정지 방지 및 자동 백그라운드 인계
    const handleMediaPause = useCallback(
        (e: React.SyntheticEvent<HTMLMediaElement>) => {
            const media = e.currentTarget;
            if (media.ended || isSwitchingTrackRef.current) return;

            // 오디오 전용 MP4에서 오디오 트랙(soun)이 컨테이너 전체 길이(mvhd)보다 0.1~0.45초 먼저 끝날 때 ended 대신 pause가 발생하는 경우 즉시 다음 곡으로 전환!
            if (
                userWantsPlayRef.current &&
                media.duration > 5 &&
                Number.isFinite(media.duration) &&
                media.currentTime >= media.duration - 0.45
            ) {
                handleVideoEnded();
                return;
            }

            // 다른 페이지로 이동하면서 <video> 태그가 언마운트될 때 발생하는 자동 pause 이벤트는 무시하고 재생 위치만 보존
            if (!media.isConnected) {
                if (userWantsPlayRef.current) {
                    pendingResumeTimeRef.current = media.currentTime || lastKnownTimeRef.current || currentTime;
                }
                return;
            }

            if (userWantsPlayRef.current) {
                if (
                    typeof document !== 'undefined' &&
                    document.visibilityState === 'visible' &&
                    document.pictureInPictureElement === media
                ) {
                    clearResumeRetryTimers();
                    userWantsPlayRef.current = false;
                    setIsPlaying(false);
                    return;
                }

                // 스마트폰 전원 버튼(화면 잠금) 또는 백그라운드 전환 시 OS가 강제한 일시정지 복구
                // <video>/<audio> 엘리먼트를 언마운트하지 않고 기존 미디어 인스턴스에서 즉시 재개합니다.
                userWantsPlayRef.current = true;
                setIsPlaying(true);
                media.play().catch(() => {});

                if (typeof window !== 'undefined') {
                    clearResumeRetryTimers();
                    const delays = [80, 220, 500, 1100];
                    for (const delay of delays) {
                        const timerId = window.setTimeout(() => {
                            if (
                                userWantsPlayRef.current &&
                                videoRef.current &&
                                videoRef.current.paused
                            ) {
                                videoRef.current.play().catch(() => {});
                            }
                        }, delay);
                        resumeRetryTimersRef.current.push(timerId);
                    }
                }
                return;
            }

            setIsPlaying(false);
        },
        [currentTime, clearResumeRetryTimers, handleVideoEnded]
    );

    // ─── 마이페이지 전체 플레이어 화면 마운트/언마운트 시 무손실 인계 ───
    const mountFullStage = useCallback(() => {
        if (videoRef.current && videoRef.current.currentTime > 0) {
            pendingResumeTimeRef.current = videoRef.current.currentTime;
        } else if (lastKnownTimeRef.current > 0) {
            pendingResumeTimeRef.current = lastKnownTimeRef.current;
        }
        setIsFullStageMounted(true);
    }, []);

    const unmountFullStage = useCallback(() => {
        if (videoRef.current && videoRef.current.currentTime > 0) {
            pendingResumeTimeRef.current = videoRef.current.currentTime;
        } else if (lastKnownTimeRef.current > 0) {
            pendingResumeTimeRef.current = lastKnownTimeRef.current;
        }
        setIsFullStageMounted(false);
    }, []);

    const dismissMiniBar = useCallback(() => {
        clearResumeRetryTimers();
        userWantsPlayRef.current = false;
        pendingResumeTimeRef.current = null;
        lastKnownTimeRef.current = 0;
        setIsPlaying(false);
        setCurrentTime(0);
        if (videoRef.current) {
            videoRef.current.pause();
            try {
                videoRef.current.currentTime = 0;
            } catch (_) {}
        }
        setIsMiniBarDismissed(true);
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.MINI_BAR_DISMISSED, 'true');
        }
    }, [clearResumeRetryTimers]);

    // 화면 잠금(visibilitychange) 시 백그라운드 재생 보호
    useEffect(() => {
        if (typeof document === 'undefined') return;

        const handleVisibilityChange = () => {
            const media = videoRef.current;
            if (!currentTrack) return;

            if (document.visibilityState === 'hidden' && userWantsPlayRef.current) {
                if (media && media.paused) {
                    media.play().catch(() => {});
                }
                if (typeof window !== 'undefined') {
                    clearResumeRetryTimers();
                    const delays = [80, 250, 600];
                    for (const delay of delays) {
                        const timerId = window.setTimeout(() => {
                            if (
                                userWantsPlayRef.current &&
                                videoRef.current &&
                                videoRef.current.paused
                            ) {
                                videoRef.current.play().catch(() => {});
                            }
                        }, delay);
                        resumeRetryTimersRef.current.push(timerId);
                    }
                }
            } else if (document.visibilityState === 'visible') {
                if (
                    tokenExpiryRef.current > 0 &&
                    Date.now() >= tokenExpiryRef.current - 15 * 60 * 1000
                ) {
                    void refreshDriveTokenSilently(true);
                }
                if (userWantsPlayRef.current && media && media.paused) {
                    media.play().catch(() => {});
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [
        currentTrack,
        clearResumeRetryTimers,
        refreshDriveTokenSilently,
    ]);

    // 트랙 변경 또는 모드/페이지 전환 시 자동 재생 및 볼륨/배속 동기화
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !currentTrack) return;

        video.volume = volume;
        video.muted = isMuted;
        video.playbackRate = playbackRate;

        if ((isPlaying || userWantsPlayRef.current) && video.paused) {
            video.play().catch((err) => {
                // 다음 곡 전환 시 이전 스트림 로드가 취소되면서 발생하는 AbortError는 정상 동작이므로 무시
                if (err instanceof Error && err.name === 'AbortError') return;
                if (
                    typeof document !== 'undefined' &&
                    document.visibilityState === 'hidden' &&
                    userWantsPlayRef.current
                ) {
                    return;
                }
                setIsPlaying(false);
            });
        }
    }, [
        currentTrack?.streamUrl,
        isAudioOnlyMode,
        isCurrentTrackAudio,
        isFullStageMounted,
        isPlaying,
        volume,
        isMuted,
        playbackRate,
    ]);

    // ─── 스마트폰 잠금화면 / 블루투스 이어폰 / 차량 미디어 컨트롤러 (Media Session API) ───
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        if (!currentTrack) {
            navigator.mediaSession.metadata = null;
            navigator.mediaSession.playbackState = 'none';
            return;
        }

        try {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: currentTrack.name,
                artist: currentTrack.folderName || 'VeraNex 클라우드 플레이어',
                album: isAudioOnlyMode ? '🎧 백그라운드 오디오 모드' : 'VeraNex Drive Video',
                artwork: currentTrack.thumbnailUrl
                    ? [{ src: currentTrack.thumbnailUrl, sizes: '512x512', type: 'image/jpeg' }]
                    : [
                          {
                              src: '/icons/icon-192x192.png',
                              sizes: '192x192',
                              type: 'image/png',
                          },
                      ],
            });
        } catch (_) {
            // MediaMetadata 미지원 구형 브라우저 예외 무시
        }

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        const safeSetHandler = (
            action: MediaSessionAction,
            handler: MediaSessionActionHandler | null
        ) => {
            try {
                navigator.mediaSession.setActionHandler(action, handler);
            } catch (_) {
                // 지원하지 않는 액션 무시
            }
        };

        safeSetHandler('play', () => {
            userWantsPlayRef.current = true;
            setIsPlaying(true);
            videoRef.current?.play().catch(() => {});
        });

        safeSetHandler('pause', () => {
            clearResumeRetryTimers();
            userWantsPlayRef.current = false;
            setIsPlaying(false);
            videoRef.current?.pause();
        });

        safeSetHandler('previoustrack', () => {
            playPrev();
        });

        safeSetHandler('nexttrack', () => {
            playNext();
        });

        safeSetHandler('seekbackward', (details) => {
            seekRelative(-(details.seekOffset || 10));
        });

        safeSetHandler('seekforward', (details) => {
            seekRelative(details.seekOffset || 10);
        });

        safeSetHandler('seekto', (details) => {
            if (typeof details.seekTime === 'number') {
                handleSeekChange(details.seekTime);
            }
        });

        return () => {
            safeSetHandler('play', null);
            safeSetHandler('pause', null);
            safeSetHandler('previoustrack', null);
            safeSetHandler('nexttrack', null);
            safeSetHandler('seekbackward', null);
            safeSetHandler('seekforward', null);
            safeSetHandler('seekto', null);
        };
    }, [
        currentTrack,
        isPlaying,
        isAudioOnlyMode,
        playPrev,
        playNext,
        seekRelative,
        handleSeekChange,
        clearResumeRetryTimers,
    ]);

    // 잠금화면 재생바(진행률) 실시간 동기화
    useEffect(() => {
        if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
        if (!('setPositionState' in navigator.mediaSession)) return;
        if (!duration || !Number.isFinite(duration) || duration <= 0) return;

        try {
            navigator.mediaSession.setPositionState({
                duration: Math.max(0, duration),
                playbackRate: playbackRate || 1,
                position: Math.min(Math.max(0, currentTime), duration),
            });
        } catch (_) {
            // position 범위 오류 무시
        }
    }, [currentTime, duration, playbackRate]);

    return {
        videoRef,
        playerContainerRef,
        // Google Drive OAuth & Picker
        googleClientId,
        googleClientSecret,
        hasServerClientSecret,
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
        isCurrentTrackAudio,
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
        isAudioOnlyMode,
        isPipActive,
        isFullStageMounted,
        mountFullStage,
        unmountFullStage,
        isMiniBarDismissed,
        dismissMiniBar,
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
        handleMediaCanPlay,
        handleMediaPause,
        handleMediaError,
        handleVideoEnded,
        removePlaylistItem,
        clearPlaylist,
    };
}
