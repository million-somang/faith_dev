export type RepeatMode = 'off' | 'all' | 'one';

export type DriveExplorerTab = 'my-drive' | 'shared' | 'all-videos' | 'all-audio';

export type MyPageSectionId =
    | 'dashboard'
    | 'schedule'
    | 'video'
    | 'news'
    | 'stocks'
    | 'games'
    | 'utils'
    | 'home-customize';

export interface DriveFolderBreadcrumb {
    id: string;
    name: string;
}

export interface DriveVideoMediaMetadata {
    width?: number;
    height?: number;
    durationMillis?: string;
}

export interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    size?: string;
    thumbnailLink?: string;
    iconLink?: string;
    modifiedTime?: string;
    videoMediaMetadata?: DriveVideoMediaMetadata;
}

export interface DriveFilesListResponse {
    files?: DriveItem[];
    nextPageToken?: string;
}

export interface VideoPlaylistItem {
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: number | null;
    durationMs: number | null;
    thumbnailUrl: string | null;
    sourceType: 'google-drive' | 'local';
    streamUrl: string;
    folderName?: string;
}

export interface GoogleTokenResponse {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
}

export interface GoogleTokenClient {
    requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

export interface GoogleAccountsOAuth2 {
    initTokenClient: (config: {
        client_id: string;
        scope: string;
        callback: (response: GoogleTokenResponse) => void;
        error_callback?: (error: { type?: string; message?: string }) => void;
    }) => GoogleTokenClient;
    revoke: (token: string, done?: () => void) => void;
}

export interface WindowWithGoogleGsi extends Window {
    google?: {
        accounts?: {
            oauth2?: GoogleAccountsOAuth2;
        };
    };
}
