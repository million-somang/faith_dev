import React, { useState, useEffect } from 'react';
import { ResizeSettings, ImageFileItem } from './types/index';
import {
  loadImageDimensions,
  resizeSingleImage,
  createZipArchive,
  getOutputFilename,
} from './utils/imageResizer';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import DropZone from './components/DropZone';
import ResizeOptionsPanel from './components/ResizeOptionsPanel';
import AdvancedSettings from './components/AdvancedSettings';
import { ImageItemCard } from './components/ImageItemCard';
import { ActionBar } from './components/ActionBar';
import { HowToGuide } from './components/HowToGuide';
import { FaqSection } from './components/FaqSection';

const DEFAULT_SETTINGS: ResizeSettings = {
  unit: 'pixel',
  width: 1200,
  height: 630,
  percent: 75,
  longestSide: 1200,
  targetKb: 500,
  fitMode: 'cover',
  lockAspectRatio: true,
  preventUpscale: false,
  format: 'original',
  quality: 0.85,
  filenameSuffix: '_resized',
};

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'app' | 'guide' | 'faq'>('app');
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // 설정 부분 업데이트 헬퍼
  const handleUpdateSettings = (updated: Partial<ResizeSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  // 컴포넌트 언마운트 시 ObjectURL 정리
  useEffect(() => {
    return () => {
      items.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl);
      });
    };
  }, [items]);

  // 파일 추가 핸들러
  const handleFilesAdded = async (newFiles: File[]) => {
    const remainingSlots = 50 - items.length;
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
      } catch (err) {
        console.error('Failed to load image:', file.name, err);
      }
    }

    setItems((prev) => [...prev, ...loadedItems]);
  };

  // 개별 파일 삭제
  const handleRemoveItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target) {
        if (target.previewUrl) URL.revokeObjectURL(target.previewUrl);
        if (target.resizedUrl) URL.revokeObjectURL(target.resizedUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
  };

  // 전체 비우기
  const handleClearAll = () => {
    if (isProcessing) return;
    items.forEach((it) => {
      if (it.previewUrl) URL.revokeObjectURL(it.previewUrl);
      if (it.resizedUrl) URL.revokeObjectURL(it.resizedUrl);
    });
    setItems([]);
  };

  // 일괄 리사이즈 처리
  const handleStartProcess = async () => {
    if (isProcessing || items.length === 0) return;
    setIsProcessing(true);

    const updated = [...items];

    for (let i = 0; i < updated.length; i++) {
      const current = updated[i];
      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'processing', progress: 50 } : it))
      );

      try {
        const result = await resizeSingleImage(current, settings);
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'done',
                  progress: 100,
                  resizedBlob: result.blob,
                  resizedUrl: result.url,
                  resizedWidth: result.width,
                  resizedHeight: result.height,
                  resizedSize: result.size,
                }
              : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i
              ? {
                  ...it,
                  status: 'error',
                  progress: 0,
                  errorMessage: err?.message || '변환 오류가 발생했습니다.',
                }
              : it
          )
        );
      }
    }

    setIsProcessing(false);
  };

  // 개별 이미지 다운로드
  const handleDownloadSingle = (item: ImageFileItem) => {
    if (!item.resizedBlob || !item.resizedUrl) return;
    const filename = getOutputFilename(item.name, settings);
    const link = document.createElement('a');
    link.href = item.resizedUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ZIP 일괄 다운로드
  const handleDownloadZip = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const zipBlob = await createZipArchive(items, settings);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `veranex_resized_images_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      console.error('ZIP creation error:', err);
      alert('ZIP 파일 생성 중 오류가 발생했습니다.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 4초 스플래시 화면 */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
        {/* 상단 헤더 */}
        <Header />

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-1 border-b border-[#EBE6DD] mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('app')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'app'
                ? 'border-indigo-600 text-indigo-600 bg-white/70 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <i className="fas fa-sliders-h"></i>
            변환기
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'guide'
                ? 'border-indigo-600 text-indigo-600 bg-white/70 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <i className="fas fa-book-open"></i>
            사용 가이드
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              activeTab === 'faq'
                ? 'border-indigo-600 text-indigo-600 bg-white/70 rounded-t-lg'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <i className="far fa-question-circle"></i>
            자주 묻는 질문
          </button>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 pb-10">
          {activeTab === 'app' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* 왼쪽 패널: 리사이즈 옵션 및 고급 설정 (5열) */}
              <div className="lg:col-span-5 space-y-4">
                <ResizeOptionsPanel settings={settings} onChange={handleUpdateSettings} />
                <AdvancedSettings settings={settings} onChange={handleUpdateSettings} />
              </div>

              {/* 오른쪽 패널: 업로드 영역 및 이미지 리스트 (7열) */}
              <div className="lg:col-span-7 space-y-4">
                <DropZone
                  onFilesSelected={handleFilesAdded}
                  disabled={isProcessing}
                />

                {/* 이미지 목록 */}
                {items.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-stone-500">
                        등록된 이미지 목록 ({items.length}/50)
                      </span>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs text-stone-400 hover:text-rose-500 transition-colors"
                      >
                        전체 비우기
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                      {items.map((item) => (
                        <ImageItemCard
                          key={item.id}
                          item={item}
                          settings={settings}
                          onRemove={handleRemoveItem}
                          onDownloadSingle={handleDownloadSingle}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* 하단 액션 바 */}
                <ActionBar
                  items={items}
                  isProcessing={isProcessing}
                  isZipping={isZipping}
                  onStartProcess={handleStartProcess}
                  onDownloadZip={handleDownloadZip}
                  onClearAll={handleClearAll}
                />
              </div>
            </div>
          )}

          {activeTab === 'guide' && <HowToGuide />}

          {activeTab === 'faq' && <FaqSection />}
        </main>
      </div>

      {/* 하단 스폰서 배너 및 푸터 */}
      <footer className="mt-auto border-t border-[#EBE6DD] bg-white/70 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 VeraNex. 100% Client-Side Safe Image Processing.</p>
          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1">
              <i className="fas fa-shield-alt text-emerald-600"></i>
              무손실 로컬 엔진
            </span>
            <span>•</span>
            <span>최대 50장 동시 변환</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
