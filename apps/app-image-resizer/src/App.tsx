import React, { useState } from 'react';
import { formatBytes, supportsSaveFilePicker } from './utils/imageResizer';
import { useImageUpscaler, type WizardStep } from './hooks/useImageUpscaler';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import DropZone from './components/DropZone';
import ResizeOptionsPanel from './components/ResizeOptionsPanel';
import { ImageItemCard } from './components/ImageItemCard';
import { BeforeAfterComparePanel } from './components/BeforeAfterCompareModal';
import { UpscaleProgressStage } from './components/UpscaleProgressStage';
import { HowToGuide } from './components/HowToGuide';
import { FaqSection } from './components/FaqSection';

const WIZARD_STEPS: readonly {
  readonly step: WizardStep;
  readonly title: string;
  readonly subtitle: string;
}[] = [
  { step: 1, title: '이미지 올리기', subtitle: '최대 50장 사진 선택' },
  { step: 2, title: '업스케일 · 포맷 선택', subtitle: 'AI 초해상도 · Lanczos-3' },
  { step: 3, title: '비교 · 파일 저장', subtitle: 'Before/After 확인 · 저장' },
];

export const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {
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
    handleSaveToChosenFolder,
    handleDownloadIndividualAll,
  } = useImageUpscaler();

  const doneCount = doneItems.length;
  const totalOriginalSize = items.reduce((sum, it) => sum + (it.originalSize || 0), 0);
  const totalResizedSize = items
    .filter((it) => it.status === 'done' && it.resizedSize)
    .reduce((sum, it) => sum + (it.resizedSize || 0), 0);

  const progressWidthClass =
    currentStep === 1 ? 'w-0' : currentStep === 2 ? 'w-1/2' : 'w-full';

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* 4초 스플래시 화면 */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="max-w-3xl lg:max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 flex-1 flex flex-col">
        {/* Zone 1: 상단 샌드 베이지 헤더 & 메뉴 탭 */}
        <Header activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* 메인 콘텐츠 영역 (내부 중첩 스크롤 금지 -> 브라우저 단일 스크롤 흐름) */}
        <main className="flex-1 pb-10 space-y-5">
          {activeTab === 'app' && (
            <>
              {/* Zone 2: 연결선형 3단계 진행 스텝퍼 */}
              <div className="relative px-3 sm:px-8 py-3.5 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/60 rounded-2xl border border-indigo-100/90 shadow-2xs">
                <div className="absolute top-7 left-[18%] right-[18%] h-1 bg-[#E5E0D5] rounded-full overflow-hidden pointer-events-none">
                  <div
                    className={`h-full bg-indigo-600 transition-all duration-300 ${progressWidthClass}`}
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

              {/* 전용 포커스 프로그레스 스테이지 (1~100% 3D 로고 & 컬러 채움 연출) */}
              {processingState?.isActive ? (
                <UpscaleProgressStage
                  state={processingState}
                  onCancel={handleCancelProcess}
                />
              ) : (
                <>
                  {/* STEP 1: 이미지 올리기 */}
                  {currentStep === 1 && (
                    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] border-t-4 border-t-indigo-600 shadow-md space-y-5 animate-fade-in">
                  <div className="flex items-start justify-between gap-3 border-b border-[#EBE6DD] pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-600 text-white text-[11px] font-black mb-1.5 shadow-2xs">
                        STEP 1 · 이미지 올리기
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-[#2D2A26]">
                        업스케일 · 변환할 이미지를 올려주세요 (최대 50장)
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        여러 장을 한꺼번에 끌어다 놓거나 선택한 뒤 아래{' '}
                        <strong>[다음 스텝]</strong> 버튼을 눌러주세요.
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

                  <DropZone onFilesSelected={handleFilesAdded} disabled={isProcessing} />

                  {items.length > 0 && (
                    <div className="space-y-3 pt-2 border-t border-[#EBE6DD]">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs sm:text-sm font-black text-indigo-700">
                          <i className="fas fa-images mr-1.5"></i>
                          총 {items.length}장의 이미지가 준비되었습니다 ({formatBytes(totalOriginalSize)})
                        </span>
                      </div>

                      <div className="space-y-2">
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

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={items.length === 0}
                      onClick={() => handleGoToStep(2)}
                      className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-stone-300 text-white text-sm sm:text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
                    >
                      <span>
                        {items.length > 0
                          ? `다음 스텝: 업스케일 · 포맷 설정하기 (${items.length}장)`
                          : '먼저 위 박스를 눌러 이미지를 1장 이상 올려주세요'}
                      </span>
                      {items.length > 0 && <i className="fas fa-arrow-right"></i>}
                    </button>
                  </div>
                </div>
              )}

                  {/* STEP 2: 업스케일 · 크기 · 파일형식 선택 */}
                  {currentStep === 2 && (
                    <div className="space-y-3">
                      {processNotice && (
                        <div className="rounded-2xl px-4 py-3 text-xs font-bold border bg-indigo-50 border-indigo-200 text-indigo-900 flex items-center gap-2 animate-fade-in">
                          <i className="fas fa-circle-info text-indigo-600"></i>
                          <span>{processNotice.text}</span>
                        </div>
                      )}
                      <ResizeOptionsPanel
                        settings={settings}
                        sampleItem={items[0]}
                        onChange={handleUpdateSettings}
                        itemCount={items.length}
                        isProcessing={isProcessing}
                        onBackToStep1={() => handleGoToStep(1)}
                        onStartProcess={handleStartProcess}
                      />
                    </div>
                  )}

              {/* STEP 3: Before/After 비교 및 파일 저장 */}
              {currentStep === 3 && (
                <div
                  data-screenshot-point="result"
                  className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] border-t-4 border-t-emerald-600 shadow-md space-y-5 animate-fade-in"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EBE6DD] pb-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-black mb-1.5 shadow-2xs">
                        <i className="fas fa-circle-check"></i> STEP 3 · 처리 완료 ({doneCount} /{' '}
                        {items.length}장)
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-[#2D2A26]">
                        {settings.unit === 'upscale'
                          ? '고화질 업스케일이 완료되었습니다!'
                          : '이미지 변환이 완료되었습니다!'}
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5">
                        아래 Before/After 분할 비교기에서 결과를 확인한 뒤 바로 저장하거나 원하는 폴더에 저장하세요.
                      </p>
                    </div>

                    {doneCount > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-3.5 py-2 text-right shrink-0">
                        <span className="text-[10px] font-bold text-emerald-700 block">
                          총 파일 용량 변화
                        </span>
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

                  {/* Before/After 드래그 분할 비교기 */}
                  {activeCompareItem && (
                    <BeforeAfterComparePanel
                      item={activeCompareItem}
                      allDoneItems={doneItems}
                      onSelectCompareItem={setCompareItemId}
                    />
                  )}

                  {/* 일괄 저장 액션 */}
                  {doneCount > 0 && (
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={handleDownloadAllFiles}
                        disabled={isSavingAll || isZipping}
                        className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 text-white text-sm sm:text-base font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                      >
                        {isZipping ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>ZIP 파일 생성 중...</span>
                          </>
                        ) : isSavingAll ? (
                          <>
                            <i className="fas fa-spinner fa-spin"></i>
                            <span>
                              {saveProgress && doneCount > 1
                                ? `저장 중... (${saveProgress.current} / ${saveProgress.total}장)`
                                : '저장 중...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <i className={doneCount > 1 ? 'fas fa-file-zipper' : 'fas fa-download'}></i>
                            <span>
                              {doneCount > 1
                                ? `ZIP 파일로 한꺼번에 저장하기 (${doneCount}장)`
                                : '변환된 이미지 바로 저장하기'}
                            </span>
                          </>
                        )}
                      </button>

                      {(supportsSaveFilePicker() || doneCount > 1) && (
                        <div
                          className={`grid gap-2 ${
                            supportsSaveFilePicker() && doneCount > 1
                              ? 'grid-cols-1 sm:grid-cols-2'
                              : 'grid-cols-1'
                          }`}
                        >
                          {supportsSaveFilePicker() && (
                            <button
                              type="button"
                              onClick={handleSaveToChosenFolder}
                              disabled={isSavingAll || isZipping}
                              className="w-full py-2.5 px-4 bg-[#FAF8F5] hover:bg-indigo-50/70 text-[#2D2A26] border border-[#EBE6DD] hover:border-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <i className="fas fa-folder-open text-indigo-600"></i>
                              <span>
                                {doneCount > 1
                                  ? `원하는 폴더에 ZIP 저장하기 (${doneCount}장)`
                                  : '원하는 폴더에 저장하기 (다른 이름으로 저장)'}
                              </span>
                            </button>
                          )}

                          {doneCount > 1 && (
                            <button
                              type="button"
                              onClick={handleDownloadIndividualAll}
                              disabled={isSavingAll || isZipping}
                              className="w-full py-2.5 px-4 bg-[#FAF8F5] hover:bg-emerald-50/70 text-[#2D2A26] border border-[#EBE6DD] hover:border-emerald-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <i className="fas fa-images text-emerald-600"></i>
                              <span>이미지 1장씩 개별 저장 ({doneCount}장)</span>
                            </button>
                          )}
                        </div>
                      )}

                      {saveNotice && (
                        <div
                          className={`rounded-2xl px-4 py-3 text-xs font-bold border flex items-center gap-2 ${
                            saveNotice.type === 'success'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                              : saveNotice.type === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-900'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                          }`}
                        >
                          <i
                            className={`fas ${
                              saveNotice.type === 'success'
                                ? 'fa-circle-check text-emerald-600'
                                : saveNotice.type === 'error'
                                  ? 'fa-circle-exclamation text-rose-600'
                                  : 'fa-circle-info text-indigo-600'
                            }`}
                          ></i>
                          <span>{saveNotice.text}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 변환된 개별 파일 목록 (중첩 스크롤 없음) */}
                  <div className="space-y-2.5">
                    {items.map((item) => (
                      <ImageItemCard
                        key={item.id}
                        item={item}
                        settings={settings}
                        onRemove={handleRemoveItem}
                        onDownloadSingle={handleDownloadSingle}
                        onCompare={setCompareItemId}
                        isComparing={activeCompareItem?.id === item.id}
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
                      <span>← 이전 스텝: 업스케일 · 포맷 다시 설정하기</span>
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
            </>
          )}

          {activeTab === 'guide' && <HowToGuide />}
          {activeTab === 'faq' && <FaqSection />}
        </main>
      </div>

      {/* 하단 푸터 */}
      <footer className="mt-auto border-t border-[#EBE6DD] bg-white/70 py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-3xl lg:max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-bold text-[#2D2A26]">
            © 2026 VeraNex. 100% Client-Side AI &amp; Lanczos Image Processing.
          </p>
          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1">
              <i className="fas fa-shield-alt text-emerald-600"></i>
              로컬 AI CSR 엔진
            </span>
            <span>•</span>
            <span>최대 50장 일괄 업스케일</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
