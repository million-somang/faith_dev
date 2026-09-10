export interface ImageFileItem {
    id: string;
    file: File;
    name: string;
    originalSize: number;
    originalDimensions?: { width: number; height: number };
    previewUrl: string;
    status: 'idle' | 'converting' | 'done' | 'error';
    convertedBlob?: Blob;
    convertedUrl?: string;
    convertedSize?: number;
    convertedDimensions?: { width: number; height: number };
    reductionPercent?: number;
    errorMessage?: string;
}

export interface ConversionSettings {
    quality: number; // 0.1 to 1.0 (default: 0.8)
    maxWidth: number; // 0: 원본 유지, or 1920, 1280, 800
    lossless: boolean;
}

export type ActiveTab = 'converter' | 'howto' | 'faq';
export type ViewMode = 'input' | 'result';
