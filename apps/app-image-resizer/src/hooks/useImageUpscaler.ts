import { useCallback, useEffect, useRef, useState } from 'react';
import { ImageFileItem, ResizeSettings } from '../types/index';
import {
  downloadAllAsSingleZip,
  getOutputFilename,
  loadImageDimensions,
  resizeSingleImage,
  saveAllToSingleDirectory,
  supportsDirectoryPicker,
} from '../utils/imageResizer';

export type WizardStep = 1 | 2 | 3;

export const DEFAULT_SETTINGS: ResizeSettings = {
  unit: 'upscale',
  upscaleEngine: 'ai-esrgan',
  upscaleTarget: '2x',
  sharpenLevel: 'natural',
  width: 1200,
  height: 630,
  percent: 100,
  longestSide: 1200,
  targetKb: 500,
  fitMode: 'cover',
  lockAspectRatio: true,
  preventUpscale: false,
  format: 'original',
  quality: 0.95,
  filenameSuffix: '_resized',
};

export interface SaveNotice {
  readonly type: 'success' | 'info' | 'error';
  readonly text: string;
}

export function useImageUpscaler() {
  const [activeTab, setActiveTab] = useState<'app' | 'guide' | 'faq'>('app');
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);
  const itemsRef = useRef<ImageFileItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl);
      });
    };
  }, []);

  const handleUpdateSettings = useCallback((updated: Partial<ResizeSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  }, []);

  const handleGoToStep = useCallback(
    (nextStep: WizardStep) => {
      if (nextStep > 1 && itemsRef.current.length === 0) {
        alert('먼저 업스케일 또는 변환할 이미지를 1장 이상 올려주세요.');
        return;
      }
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    []
  );

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const remainingSlots = 50 - itemsRef.current.length;
    if (remainingSlots <= 0) {
      alert('최대 50장까지 한 번에 등록할 수 있습니다.');
      return;
    }

    const filesToProcess = newFiles.slice(0, remainingSlots);
    const loadedItems: ImageFileItem[] = [];

    for (const file of filesToProcess) {
      try {
        const { width, height, previewUrl } = await loadImageDimensions(file);
        loadedItems.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          file,
          name: file.name,
          originalWidth: width,
          originalHeight: height,
          originalSize: file.size,
          previewUrl,
          status: 'idle',
          progress: 0,
        });
      } catch (err: unknown) {
        console.error('Failed to load image:', file.name, err);
      }
    }

    if (loadedItems.length > 0) {
      setItems((prev) => [...prev, ...loadedItems]);
    }
  }, []);

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.resizedUrl) URL.revokeObjectURL(target.resizedUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
    setCompareItemId((prevId) => (prevId === id ? null : prevId));
  }, []);

  const handleClearAll = useCallback(() => {
    if (isProcessing) return;
    itemsRef.current.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      if (it.resizedUrl) URL.revokeObjectURL(it.resizedUrl);
    });
    setSaveNotice(null);
    setCompareItemId(null);
    setItems([]);
    setCurrentStep(1);
  }, [isProcessing]);

  const handleStartProcess = useCallback(async () => {
    const snapshot = [...itemsRef.current];
    if (isProcessing || snapshot.length === 0) return;

    setSaveNotice(null);
    setIsProcessing(true);

    let firstDoneId: string | null = null;

    for (let i = 0; i < snapshot.length; i += 1) {
      const current = snapshot[i]!;
      const oldResizedUrl = current.resizedUrl;

      setItems((prev) =>
        prev.map((it) =>
          it.id === current.id
            ? {
                ...it,
                status: 'processing',
                progress: 5,
                statusText:
                  settings.unit === 'upscale'
                    ? settings.upscaleEngine === 'ai-esrgan'
                      ? 'AI 초해상도 준비 중...'
                      : 'Lanczos-3 업스케일 시작...'
                    : '이미지 변환 중...',
              }
            : it
        )
      );

      try {
        const result = await resizeSingleImage(current, settings, (percent, statusText) => {
          setItems((prev) =>
            prev.map((it) =>
              it.id === current.id ? { ...it, progress: percent, statusText } : it
            )
          );
        });

        if (oldResizedUrl) {
          URL.revokeObjectURL(oldResizedUrl);
        }

        if (!firstDoneId) {
          firstDoneId = current.id;
        }

        setItems((prev) =>
          prev.map((it) =>
            it.id === current.id
              ? {
                  ...it,
                  status: 'done',
                  progress: 100,
                  statusText: '변환 완료',
                  wasCappedForMemory: result.wasCappedForMemory,
                  usedEngine: result.usedEngine,
                  resizedBlob: result.blob,
                  resizedUrl: result.url,
                  resizedWidth: result.width,
                  resizedHeight: result.height,
                  resizedSize: result.size,
                  errorMessage: undefined,
                }
              : it
          )
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : '변환 오류가 발생했습니다.';
        setItems((prev) =>
          prev.map((it) =>
            it.id === current.id
              ? {
                  ...it,
                  status: 'error',
                  progress: 0,
                  statusText: undefined,
                  errorMessage: message,
                }
              : it
          )
        );
      }
    }

    if (firstDoneId) {
      setCompareItemId(firstDoneId);
    }
    setIsProcessing(false);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isProcessing, settings]);

  const handleDownloadSingle = useCallback(
    (item: ImageFileItem) => {
      if (!item.resizedBlob) return;
      const filename = getOutputFilename(item.name, settings);
      const downloadUrl = URL.createObjectURL(item.resizedBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 4000);
    },
    [settings]
  );

  const handleDownloadAllFiles = useCallback(async () => {
    if (isSavingAll || isZipping) return;
    const doneItems = itemsRef.current.filter((it) => it.status === 'done' && it.resizedBlob);
    if (doneItems.length === 0) return;

    if (doneItems.length === 1 && !supportsDirectoryPicker() && doneItems[0]) {
      handleDownloadSingle(doneItems[0]);
      return;
    }

    setIsSavingAll(true);
    setSaveNotice(null);
    setSaveProgress({ current: 0, total: doneItems.length });
    try {
      const result = await saveAllToSingleDirectory(doneItems, settings, (saved, total) => {
        setSaveProgress({ current: saved, total });
      });

      if (result.status === 'saved') {
        setSaveNotice({
          type: 'success',
          text: `선택한 "${result.folderName}" 폴더에 ${result.count}장의 이미지가 한꺼번에 저장되었습니다.`,
        });
      } else if (result.status === 'unsupported') {
        await downloadAllAsSingleZip(doneItems, settings);
        setSaveNotice({
          type: 'info',
          text: `현재 브라우저는 폴더 직접 저장을 지원하지 않아 ${doneItems.length}장을 ZIP 파일 1개로 묶어 저장했습니다.`,
        });
      }
    } catch {
      setSaveNotice({
        type: 'error',
        text: '폴더 저장 중 오류가 발생했습니다. 폴더 쓰기 권한을 확인하거나 아래 ZIP 저장을 이용해 주세요.',
      });
    } finally {
      setIsSavingAll(false);
      setSaveProgress(null);
    }
  }, [handleDownloadSingle, isSavingAll, isZipping, settings]);

  const handleDownloadZipAll = useCallback(async () => {
    if (isSavingAll || isZipping) return;
    const doneItems = itemsRef.current.filter((it) => it.status === 'done' && it.resizedBlob);
    if (doneItems.length === 0) return;

    setIsZipping(true);
    setSaveNotice(null);
    try {
      const count = await downloadAllAsSingleZip(doneItems, settings);
      setSaveNotice({
        type: 'info',
        text: `변환된 이미지 ${count}장이 ZIP 파일 1개로 저장되었습니다.`,
      });
    } catch {
      setSaveNotice({
        type: 'error',
        text: 'ZIP 압축 저장 중 오류가 발생했습니다.',
      });
    } finally {
      setIsZipping(false);
    }
  }, [isSavingAll, isZipping, settings]);

  const doneItems = items.filter((it) => it.status === 'done' && it.resizedUrl);
  const activeCompareItem =
    doneItems.find((it) => it.id === compareItemId) ?? doneItems[0] ?? null;

  return {
    activeTab,
    setActiveTab,
    currentStep,
    settings,
    items,
    doneItems,
    activeCompareItem,
    setCompareItemId,
    isProcessing,
    isSavingAll,
    isZipping,
    saveProgress,
    saveNotice,
    handleUpdateSettings,
    handleGoToStep,
    handleFilesAdded,
    handleRemoveItem,
    handleClearAll,
    handleStartProcess,
    handleDownloadSingle,
    handleDownloadAllFiles,
    handleDownloadZipAll,
  };
}
