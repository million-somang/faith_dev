import JSZip from 'jszip';
import type { ConversionSettings, ImageFileItem } from '../types/index';

/**
 * 브라우저 메모리상에서 이미지를 WebP로 즉시 변환 및 압축합니다. (서버 전송 $0)
 */
export async function convertImageToWebP(
    file: File,
    settings: ConversionSettings
): Promise<{
    blob: Blob;
    width: number;
    height: number;
    size: number;
    reductionPercent: number;
}> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            let targetWidth = img.naturalWidth || img.width;
            let targetHeight = img.naturalHeight || img.height;

            // 가로 너비 리사이징 계산
            if (settings.maxWidth > 0 && targetWidth > settings.maxWidth) {
                const ratio = settings.maxWidth / targetWidth;
                targetWidth = Math.round(settings.maxWidth);
                targetHeight = Math.round(targetHeight * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetWidth;
            canvas.height = targetHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.'));
                return;
            }

            // 고품질 이미지 스케일링 설정
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // WebP 인코딩 (quality: 0.1 ~ 1.0)
            const quality = settings.lossless ? 1.0 : settings.quality;
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error('WebP Blob 인코딩에 실패했습니다.'));
                        return;
                    }

                    const originalSize = file.size;
                    const convertedSize = blob.size;
                    const diff = originalSize - convertedSize;
                    const reductionPercent = Math.max(0, Math.round((diff / originalSize) * 100));

                    resolve({
                        blob,
                        width: targetWidth,
                        height: targetHeight,
                        size: convertedSize,
                        reductionPercent,
                    });
                },
                'image/webp',
                quality
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error('이미지 파일을 읽을 수 없습니다. 지원되지 않는 포맷이거나 손상된 파일입니다.'));
        };

        img.src = objectUrl;
    });
}

/**
 * 바이트 단위를 가독성 높은 문자열로 변환 (KB, MB)
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 단일 파일 다운로드 트리거
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * 다중 WebP 파일 일괄 ZIP 압축 다운로드
 */
export async function downloadAllAsZip(items: ImageFileItem[]): Promise<void> {
    const validItems = items.filter((item) => item.status === 'done' && item.convertedBlob);
    if (validItems.length === 0) return;

    if (validItems.length === 1 && validItems[0]?.convertedBlob) {
        const item = validItems[0];
        const newName = item.name.replace(/\.[^/.]+$/, '') + '.webp';
        downloadBlob(item.convertedBlob, newName);
        return;
    }

    const zip = new JSZip();
    validItems.forEach((item) => {
        if (item.convertedBlob) {
            const baseName = item.name.replace(/\.[^/.]+$/, '');
            zip.file(`${baseName}.webp`, item.convertedBlob);
        }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    downloadBlob(content, `webp_converted_${timestamp}.zip`);
}
