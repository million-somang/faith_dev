import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImageFileItem,
  ResizeSettings,
  UpscaleProcessingStage,
  UpscaleProcessingState,
} from '../types/index';
import {
  calculateTargetSize,
  downloadAllAsSingleZip,
  getOutputFilename,
  isAbortError,
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

function resolveStageIndex(percent: number): UpscaleProcessingStage {
  if (percent < 16) return 0;
  if (percent < 89) return 1;
  if (percent < 97) return 2;
  return 3;
}

function resolveEngineLabel(settings: ResizeSettings): string {
  if (settings.unit === 'upscale') {
    return settings.upscaleEngine === 'ai-esrgan'
      ? `AI 초해상도 (${settings.upscaleTarget.toUpperCase()})`
      : `초고속 Lanczos-3 (${settings.upscaleTarget.toUpperCase()})`;
  }
  if (settings.unit === 'target_kb') return `목표 용량 맞춤 (${settings.targetKb}KB)`;
  if (settings.unit === 'pixel') return '픽셀 · SNS 규격 변환';
  if (settings.percent === 100) return '포맷 변환 (원본 크기)';
  return `비율 축소 (${settings.percent}%)`;
}

export function useImageUpscaler() {
  const [activeTab, setActiveTab] = useState<'app' | 'guide' | 'faq'>('app');
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [compareItemId, setCompareItemId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingState, setProcessingState] = useState<UpscaleProcessingState | null>(null);
  const [processNotice, setProcessNotice] = useState<SaveNotice | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [saveNotice, setSaveNotice] = useState<SaveNotice | null>(null);

  const itemsRef = useRef<ImageFileItem[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const elapsedTimerRef = useRef<number | null>(null);
  const completionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const stopElapsedTimer = useCallback(() => {
    if (elapsedTimerRef.current !== null) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      stopElapsedTimer();
      if (completionTimerRef.current !== null) {
        window.clearTimeout(completionTimerRef.current);
      }
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl);
      });
    };
  }, [stopElapsedTimer]);

  const handleUpdateSettings = useCallback((updated: Partial<ResizeSettings>) => {
    setProcessNotice(null);
    setSettings((prev) => ({ ...prev, ...updated }));
  }, []);

  const handleGoToStep = useCallback(
    (nextStep: WizardStep) => {
      if (isProcessing) return;
      if (nextStep > 1 && itemsRef.current.length === 0) {
        alert('먼저 업스케일 또는 변환할 이미지를 1장 이상 올려주세요.');
        return;
      }
      setCurrentStep(nextStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [isProcessing]
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
      setProcessNotice(null);
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
    setProcessNotice(null);
    setCompareItemId(null);
    setItems([]);
    setCurrentStep(1);
  }, [isProcessing]);

  const handleCancelProcess = useCallback(() => {
    if (!abortControllerRef.current) return;
    setProcessingState((prev) =>
      prev
        ? {
            ...prev,
            statusText: '작업을 안전하게 중단하는 중...',
          }
        : null
    );
    abortControllerRef.current.abort();
  }, []);

  const handleStartProcess = useCallback(async () => {
    const snapshot = [...itemsRef.current];
    if (isProcessing || snapshot.length === 0) return;

    setSaveNotice(null);
    setProcessNotice(null);
    setIsProcessing(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const startTime = Date.now();
    const engineLabel = resolveEngineLabel(settings);

    const firstTarget = calculateTargetSize(
      snapshot[0]!.originalWidth,
      snapshot[0]!.originalHeight,
      settings
    );

    setProcessingState({
      isActive: true,
      isCompleting: false,
      totalCount: snapshot.length,
      currentIndex: 1,
      currentItemId: snapshot[0]!.id,
      currentFileName: snapshot[0]!.name,
      currentPreviewUrl: snapshot[0]!.previewUrl,
      currentOriginalDims: `${snapshot[0]!.originalWidth}×${snapshot[0]!.originalHeight}`,
      currentTargetDims: `${firstTarget.targetW}×${firstTarget.targetH}`,
      overallPercent: 1,
      itemPercent: 1,
      stageIndex: 0,
      statusText:
        settings.unit === 'upscale'
          ? settings.upscaleEngine === 'ai-esrgan'
            ? 'AI 초해상도 엔진 초기화 중...'
            : 'Lanczos-3 워커 초기화 중...'
          : '이미지 변환 준비 중...',
      engineLabel,
      elapsedMs: 0,
    });

    stopElapsedTimer();
    elapsedTimerRef.current = window.setInterval(() => {
      setProcessingState((prev) =>
        prev && !prev.isCompleting ? { ...prev, elapsedMs: Date.now() - startTime } : prev
      );
    }, 100);

    let firstDoneId: string | null = null;
    let completedCountInRun = 0;
    let wasAborted = false;

    for (let i = 0; i < snapshot.length; i += 1) {
      if (controller.signal.aborted) {
        wasAborted = true;
        break;
      }

      const current = snapshot[i]!;
      const oldResizedUrl = current.resizedUrl;
      const targetSize = calculateTargetSize(
        current.originalWidth,
        current.originalHeight,
        settings
      );

      const initialBatchPct = Math.max(1, Math.min(99, Math.round((i / snapshot.length) * 100)));
      setProcessingState((prev) =>
        prev
          ? {
              ...prev,
              currentIndex: i + 1,
              currentItemId: current.id,
              currentFileName: current.name,
              currentPreviewUrl: current.previewUrl,
              currentOriginalDims: `${current.originalWidth}×${current.originalHeight}`,
              currentTargetDims: `${targetSize.targetW}×${targetSize.targetH}`,
              overallPercent: Math.max(prev.overallPercent, initialBatchPct),
              itemPercent: 2,
              stageIndex: 0,
              statusText: `${current.name} 분석 및 준비 중...`,
            }
          : prev
      );

      setItems((prev) =>
        prev.map((it) =>
          it.id === current.id
            ? {
                ...it,
                status: 'processing',
                progress: 2,
                statusText: '처리 준비 중...',
              }
            : it
        )
      );

      try {
        const result = await resizeSingleImage(
          current,
          settings,
          (percent, statusText) => {
            if (controller.signal.aborted) return;
            const safeItemPct = Math.max(1, Math.min(99, Math.round(percent)));
            const overallPct = Math.max(
              1,
              Math.min(99, Math.round(((i + safeItemPct / 100) / snapshot.length) * 100))
            );
            const stageIndex = resolveStageIndex(safeItemPct);

            setProcessingState((prev) =>
              prev
                ? {
                    ...prev,
                    overallPercent: Math.max(prev.overallPercent, overallPct),
                    itemPercent: safeItemPct,
                    stageIndex,
                    statusText,
                  }
                : prev
            );

            setItems((prev) =>
              prev.map((it) =>
                it.id === current.id ? { ...it, progress: safeItemPct, statusText } : it
              )
            );
          },
          controller.signal
        );

        if (oldResizedUrl) {
          URL.revokeObjectURL(oldResizedUrl);
        }

        if (!firstDoneId) {
          firstDoneId = current.id;
        }
        completedCountInRun += 1;

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
        if (isAbortError(err) || controller.signal.aborted) {
          wasAborted = true;
          setItems((prev) =>
            prev.map((it) =>
              it.id === current.id
                ? {
                    ...it,
                    status: 'idle',
                    progress: 0,
                    statusText: undefined,
                  }
                : it
            )
          );
          break;
        }

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

    stopElapsedTimer();
    abortControllerRef.current = null;

    if (wasAborted) {
      setProcessingState(null);
      setIsProcessing(false);
      setProcessNotice({
        type: 'info',
        text:
          completedCountInRun > 0
            ? `작업이 중단되었습니다. (이미 완료된 ${completedCountInRun}장은 보존되었습니다)`
            : '업스케일 작업이 중단되었습니다. 옵션을 변경한 뒤 다시 시작할 수 있습니다.',
      });
      return;
    }

    if (firstDoneId) {
      setCompareItemId(firstDoneId);
    }

    // 100% 도달 축하 연출(0.6초) 후 STEP 3 자동 전환
    setProcessingState((prev) =>
      prev
        ? {
            ...prev,
            isCompleting: true,
            overallPercent: 100,
            itemPercent: 100,
            stageIndex: 3,
            elapsedMs: Date.now() - startTime,
            statusText: '처리가 완료되었습니다! 비교 화면으로 이동합니다...',
          }
        : prev
    );

    await new Promise<void>((resolve) => {
      completionTimerRef.current = window.setTimeout(() => {
        completionTimerRef.current = null;
        resolve();
      }, 600);
    });

    setProcessingState(null);
    setIsProcessing(false);
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isProcessing, settings, stopElapsedTimer]);

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
    processingState,
    processNotice,
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
    handleCancelProcess,
    handleDownloadSingle,
    handleDownloadAllFiles,
    handleDownloadZipAll,
  };
}
