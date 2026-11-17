import React, { useState, useEffect, useRef } from 'react';
import { ResizeSettings, ImageFileItem } from './types/index';
import {
  loadImageDimensions,
  resizeSingleImage,
  getOutputFilename,
  formatBytes,
} from './utils/imageResizer';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import DropZone from './components/DropZone';
import ResizeOptionsPanel from './components/ResizeOptionsPanel';
import { ImageItemCard } from './components/ImageItemCard';
import { HowToGuide } from './components/HowToGuide';
import { FaqSection } from './components/FaqSection';

type WizardStep = 1 | 2 | 3;

const WIZARD_STEPS: { step: WizardStep; title: string; subtitle: string }[] = [
  { step: 1, title: '이미지 올리기', subtitle: '최대 50장 사진 선택' },
  { step: 2, title: '크기 · 파일형식 선택', subtitle: 'JPG/PNG/WebP · 해상도' },
  { step: 3, title: '변환 결과 · 파일 저장', subtitle: '파일 그대로 즉시 저장' },
];

const DEFAULT_SETTINGS: ResizeSettings = {
  unit: 'percent',
  width: 1200,
  height: 630,
  percent: 100,
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
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [settings, setSettings] = useState<ResizeSettings>(DEFAULT_SETTINGS);
  const [items, setItems] = useState<ImageFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const itemsRef = useRef<ImageFileItem[]>([]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const handleUpdateSettings = (updated: Partial<ResizeSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  // 컴포넌트 언마운트 시에만 ObjectURL 정리
  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        if (item.resizedUrl) URL.revokeObjectURL(item.resizedUrl);
      });
    };
  }, []);

  const handleGoToStep = (nextStep: WizardStep) => {
    if (nextStep > 1 && items.length === 0) {
      alert('먼저 변환할 이미지를 1장 이상 올려주세요.');
      return;
    }
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setCurrentStep(1);
  };

  // 일괄 리사이즈 및 포맷 변환 실행 -> 완료 후 자동으로 Step 3(결과 화면)로 이동!
  const handleStartProcess = async () => {
    if (isProcessing || items.length === 0) return;
    setIsProcessing(true);

    const snapshot = [...items];

    for (let i = 0; i < snapshot.length; i++) {
      const current = snapshot[i];
      setItems((prev) =>
        prev.map((it) =>
          it.id === current.id ? { ...it, status: 'processing', progress: 50 } : it
        )
      );

      try {
        const result = await resizeSingleImage(current, settings);
        setItems((prev) =>
          prev.map((it) =>
            it.id === current.id
              ? {
                  ...it,
                  status: 'done',
                  progress: 100,
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
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === current.id
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
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 개별 이미지 파일 그대로 다운로드
  const handleDownloadSingle = (item: ImageFileItem) => {
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
  };

  // ZIP 압축 없이 변환된 이미지 파일들을 원본 파일 형태 그대로 일괄 저장
  const handleDownloadAllFiles = async () => {
    if (isSavingAll) return;
    const doneItems = items.filter((it) => it.status === 'done' && it.resizedBlob);
    if (doneItems.length === 0) return;

    setIsSavingAll(true);
    try {
      for (let i = 0; i < doneItems.length; i++) {
        handleDownloadSingle(doneItems[i]);
        if (i < doneItems.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  const doneCount = items.filter((it) => it.status === 'done').length;
  const totalOriginalSize = items.reduce((sum, it) => sum + (it.originalSize || 0), 0);
  const totalResizedSize = items
    .filter((it) => it.status === 'done' && it.resizedSize)
    .reduce((sum, it) => sum + (it.resizedSize || 0), 0);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 4초 스플래시 화면 */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="max-w-3xl w-full mx-auto px-3 sm:px-6 pt-4 flex-1 flex flex-col">
        {/* Zone 1: 상단 샌드 베이지 헤더 & 메뉴 탭 */}
        <Header activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* 메인 콘텐츠 영역 */}
        <main className="flex-1 pb-10 space-y-5">
          {activeTab === 'app' && (
            <>
              {/* Zone 2: 연결선형 3단계 진행 스텝퍼 */}
              <div className="relative px-3 sm:px-8 py-3.5 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/60 rounded-2xl border border-indigo-100/90 shadow-2xs">
                <div className="absolute top-7 left-[18%] right-[18%] h-1 bg-[#E5E0D5] rounded-full overflow-hidden pointer-events-none">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{
                      width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                    }}
                  />
                </div>

                <div className="relative z-10 grid grid-cols-3 text-center">
                  {WIZARD_STEPS.map((item) => {
                    const isCurrent = currentStep === item.step;
                    const isDone = currentStep > item.step;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => handleGoToStep(item.step)}
                        className="group flex flex-col items-center cursor-pointer focus:outline-none"
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black flex items-center justify-center transition-all border-2 ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-100 scale-105 shadow-xs'
                              : isDone
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white text-stone-400 border-[#D8D1C5] group-hover:border-indigo-300 group-hover:text-stone-600'
                          }`}
                        >
                          {isDone ? <i className="fas fa-check text-[10px]"></i> : item.step}
                        </div>
                        <span
                          className={`mt-1.5 text-[11px] sm:text-xs font-black tracking-tight whitespace-nowrap ${
                            isCurrent
                              ? 'text-indigo-700'
                              : isDone
                              ? 'text-emerald-800'
                              : 'text-stone-500'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span
                          className={`text-[10px] font-medium hidden sm:block ${
                            isCurrent ? 'text-indigo-500 font-bold' : 'text-stone-400'
                          }`}
                        >
                          {item.subtitle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ================================================================= */}
              {/* [STEP 1] 1단계: 이미지 올리기 화면 */}
              {/* ================================================================= */}
              {currentStep === 1 && (
                <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] border-t-4 border-t-indigo-600 shadow-md space-y-5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3 border-b border-[#EBE6DD] pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black mb-1.5 shadow-2xs">
                        STEP 1 · 이미지 올리기
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-[#2D2A26]">
                        변환할 이미지를 올려주세요 (최대 50장)
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        여러 장을 한꺼번에 끌어다 놓거나 클릭해서 선택한 뒤 아래 <strong>[다음 스텝]</strong> 버튼을 눌러주세요.
                      </p>
                    </div>
                    {items.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAll}
                        className="text-xs font-bold text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 pt-1"
                      >
                        <i className="fas fa-trash-can mr-1"></i>전체 비우기
                      </button>
                    )}
                  </div>

                  {/* 드롭존 */}
                  <DropZone onFilesSelected={handleFilesAdded} disabled={isProcessing} />

                  {/* 등록된 이미지 미리보기 리스트 */}
                  {items.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-[#EBE6DD]">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs sm:text-sm font-black text-indigo-700">
                          <i className="fas fa-images mr-1.5"></i>
                          총 {items.length}장의 이미지가 준비되었습니다 ({formatBytes(totalOriginalSize)})
                        </span>
                      </div>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
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

                  {/* 하단 다음 스텝 이동 버튼 */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={items.length === 0}
                      onClick={() => handleGoToStep(2)}
                      className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white text-sm sm:text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
                    >
                      <span>
                        {items.length > 0
                          ? `다음 스텝: 크기 · 파일형식 선택하기 (${items.length}장)`
                          : '먼저 위 박스를 눌러 이미지를 1장 이상 올려주세요'}
                      </span>
                      {items.length > 0 && <i className="fas fa-arrow-right"></i>}
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* [STEP 2] 2단계: 크기 · 파일형식 선택 및 변환 시작 화면 */}
              {/* ================================================================= */}
              {currentStep === 2 && (
                <ResizeOptionsPanel
                  settings={settings}
                  onChange={handleUpdateSettings}
                  itemCount={items.length}
                  isProcessing={isProcessing}
                  onBackToStep1={() => handleGoToStep(1)}
                  onStartProcess={handleStartProcess}
                />
              )}

              {/* ================================================================= */}
              {/* [STEP 3] 3단계: 변환 결과 확인 및 파일 그대로 저장 화면 */}
              {/* ================================================================= */}
              {currentStep === 3 && (
                <div
                  data-screenshot-point="result"
                  className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] border-t-4 border-t-emerald-600 shadow-md space-y-5 animate-fade-in"
                >
                  {/* 상단 완료 리포트 헤더 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DD] pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black mb-1.5 shadow-2xs">
                        <i className="fas fa-circle-check"></i> STEP 3 · 변환 완료 ({doneCount} / {items.length}장)
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-[#2D2A26]">
                        이미지 변환이 완료되었습니다!
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        아래 초록색 버튼을 누르면 <strong>압축파일(ZIP)이 아닌 이미지 파일 그대로</strong> 즉시 저장됩니다.
                      </p>
                    </div>

                    {doneCount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2 text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 block">총 용량 변화</span>
                        <div className="text-xs font-mono font-black text-emerald-950">
                          {formatBytes(totalOriginalSize)} ➔ {formatBytes(totalResizedSize)}
                          {totalOriginalSize > totalResizedSize && (
                            <span className="ml-1 text-emerald-600">
                              (↓{Math.round(((totalOriginalSize - totalResizedSize) / totalOriginalSize) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 최상단 대형 일괄 저장 버튼 (압축 없이 이미지 파일 그대로 저장) */}
                  {doneCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadAllFiles}
                      disabled={isSavingAll}
                      className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                    >
                      {isSavingAll ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>이미지 파일 저장 중...</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download"></i>
                          <span>
                            {doneCount > 1
                              ? `변환된 이미지 파일 그대로 모두 저장하기 (${doneCount}장)`
                              : '변환된 이미지 파일 저장하기'}
                          </span>
                        </>
                      )}
                    </button>
                  )}

                  {/* 변환된 개별 파일 목록 */}
                  <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
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

                  {/* 하단 네비게이션 버튼 */}
                  <div className="pt-3 border-t border-[#EBE6DD] flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleGoToStep(2)}
                      className="flex-1 py-3.5 px-4 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fas fa-sliders-h text-indigo-600"></i>
                      <span>← 이전 스텝: 크기 · 파일형식 다시 설정하기</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="flex-1 py-3.5 px-4 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <i className="fas fa-rotate-right text-emerald-600"></i>
                      <span>처음부터 새 이미지 올리기 (Step 1)</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'guide' && <HowToGuide />}
          {activeTab === 'faq' && <FaqSection />}
        </main>
      </div>

      {/* 하단 푸터 */}
      <footer className="mt-auto border-t border-[#EBE6DD] bg-white/70 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-bold text-[#2D2A26]">
            © 2026 VeraNex. 100% Client-Side Safe Image Processing.
          </p>
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
