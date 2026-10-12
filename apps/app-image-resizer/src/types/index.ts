export type ResizeUnit = 'pixel' | 'percent' | 'longest' | 'target_kb';

export type FitMode = 'cover' | 'contain' | 'stretch';

export type OutputFormat = 'original' | 'image/webp' | 'image/jpeg' | 'image/png';

export interface ResizeSettings {
  unit: ResizeUnit;
  width: number;
  height: number;
  percent: number;
  longestSide: number;
  targetKb: number;
  fitMode: FitMode;
  lockAspectRatio: boolean;
  preventUpscale: boolean;
  format: OutputFormat;
  quality: number; // 0.1 ~ 1.0 (기본 0.85)
  filenameSuffix: string;
}

export interface ImageFileItem {
  id: string;
  file: File;
  name: string;
  originalWidth: number;
  originalHeight: number;
  originalSize: number;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  resizedBlob?: Blob;
  resizedUrl?: string;
  resizedWidth?: number;
  resizedHeight?: number;
  resizedSize?: number;
  errorMessage?: string;
}

export interface PresetOption {
  id: string;
  label: string;
  icon?: string;
  platform: 'naver' | 'youtube' | 'instagram' | 'kakao' | 'facebook' | 'general';
  width: number;
  height: number;
  fitMode: FitMode;
}

export const SNS_PRESETS: PresetOption[] = [
  // 네이버 블로그
  { id: 'naver_thumb', label: '네이버 블로그 썸네일 (800×800)', platform: 'naver', width: 800, height: 800, fitMode: 'cover' },
  { id: 'naver_body', label: '네이버 블로그 본문 최적 (860×0)', platform: 'naver', width: 860, height: 573, fitMode: 'contain' },
  
  // 유튜브
  { id: 'yt_thumb', label: '유튜브 썸네일 (1280×720 HD)', platform: 'youtube', width: 1280, height: 720, fitMode: 'cover' },
  { id: 'yt_banner', label: '유튜브 채널 배너 (2560×1440)', platform: 'youtube', width: 2560, height: 1440, fitMode: 'cover' },
  
  // 인스타그램
  { id: 'insta_square', label: '인스타그램 정사각형 (1080×1080)', platform: 'instagram', width: 1080, height: 1080, fitMode: 'cover' },
  { id: 'insta_portrait', label: '인스타그램 세로 피드 (1080×1350)', platform: 'instagram', width: 1080, height: 1350, fitMode: 'cover' },
  { id: 'insta_story', label: '인스타그램 스토리/릴스 (1080×1920)', platform: 'instagram', width: 1080, height: 1920, fitMode: 'cover' },
  
  // 카카오톡
  { id: 'kakao_profile', label: '카카오톡 프로필 (800×800)', platform: 'kakao', width: 800, height: 800, fitMode: 'cover' },
  { id: 'kakao_share', label: '카카오톡 링크 공유 (800×400)', platform: 'kakao', width: 800, height: 400, fitMode: 'cover' },
  
  // 페이스북
  { id: 'fb_post', label: '페이스북 피드 포스트 (1200×630)', platform: 'facebook', width: 1200, height: 630, fitMode: 'cover' },
  { id: 'fb_cover', label: '페이스북 커버 (851×315)', platform: 'facebook', width: 851, height: 315, fitMode: 'cover' },
  
  // 일반 표준
  { id: 'gen_fhd', label: 'Full HD 웹 표준 (1920×1080)', platform: 'general', width: 1920, height: 1080, fitMode: 'contain' },
  { id: 'gen_hd', label: 'HD 컴팩트 (1280×720)', platform: 'general', width: 1280, height: 720, fitMode: 'contain' },
  { id: 'gen_800', label: '기본 웹 배너 (800×600)', platform: 'general', width: 800, height: 600, fitMode: 'cover' },
];
