import React, { useState, useEffect, useRef } from 'react';
import { createWorker } from 'tesseract.js';

// 샘플 테스트 이미지 생성 유틸 (Canvas로 즉시 생성하여 네트워크 의존성 없이 100% 동작)
function createSampleImage(type: 'receipt' | 'business_card' | 'notice'): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = 600;
  canvas.height = 360;

  // 배경
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 테두리
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

  ctx.fillStyle = '#0f172a';

  if (type === 'receipt') {
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('베라 마트 (Vera Mart) 영수증', 40, 55);
    ctx.font = '16px monospace';
    ctx.fillStyle = '#475569';
    ctx.fillText('------------------------------------------------', 40, 85);
    ctx.fillText('품목명                    수량           금액', 40, 115);
    ctx.fillText('------------------------------------------------', 40, 140);
    ctx.fillStyle = '#0f172a';
    ctx.fillText('유기농 사과 1box             1        18,500원', 40, 170);
    ctx.fillText('프리미엄 원두커피 500g        2        24,000원', 40, 200);
    ctx.fillText('제주 삼다수 2L x 6          1         5,800원', 40, 230);
    ctx.fillStyle = '#475569';
    ctx.fillText('------------------------------------------------', 40, 260);
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('합계 금액 (TOTAL):             48,300원', 40, 300);
  } else if (type === 'business_card') {
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('김베라 수석 엔지니어', 40, 70);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('VeraNex Platform AI Innovation Team', 40, 105);
    ctx.fillStyle = '#334155';
    ctx.font = '16px monospace';
    ctx.fillText('TEL: 010-1234-5678', 40, 165);
    ctx.fillText('EMAIL: vera.kim@veranex.app', 40, 200);
    ctx.fillText('WEB: https://veranex.app', 40, 235);
    ctx.fillText('ADDR: 서울특별시 강남구 테헤란로 123 베라타워', 40, 270);
  } else {
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('2026년 정기 안전 점검 안내문', 40, 60);
    ctx.font = '17px sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('1. 일시: 2026년 9월 25일(금) 10:00 ~ 17:00', 40, 110);
    ctx.fillText('2. 대상: 건물 전체 공용 시설 및 엘리베이터', 40, 150);
    ctx.fillText('3. 협조사항: 점검 시간 중 소음이 발생할 수 있으니', 40, 190);
    ctx.fillText('   입주민 여러분의 너른 양해 부탁드립니다.', 40, 225);
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#2563eb';
    ctx.fillText('VeraNex 종합 관리사무소 배상', 40, 290);
  }

  return canvas.toDataURL('image/png');
}

export default function OcrExtractor() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [language, setLanguage] = useState<string>('kor+eng');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [extractedText, setExtractedText] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // 토스트 메시지 표시
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2400);
  };

  // 클립보드 붙여넣기(Ctrl+V / Cmd+V) 전역 감지
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            showToast('클립보드 이미지가 첨부되었습니다.');
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // 파일 처리
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, WEBP, BMP 등)만 업로드할 수 있습니다.');
      return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
        setExtractedText('');
      }
    };
    reader.readAsDataURL(file);
  };

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // 샘플 이미지 불러오기
  const handleLoadSample = (type: 'receipt' | 'business_card' | 'notice', label: string) => {
    const dataUrl = createSampleImage(type);
    setSelectedImage(dataUrl);
    setImageName(`${label}_샘플.png`);
    setExtractedText('');
    showToast(`${label} 샘플 이미지가 로드되었습니다.`);
  };

  // OCR 추출 실행
  const handleRecognize = async () => {
    if (!selectedImage) {
      alert('추출할 이미지를 먼저 선택하거나 드래그 앤 드롭해주세요.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatusMessage('OCR 엔진 초기화 중...');

    try {
      // Tesseract.js Worker 생성
      const worker = await createWorker(language, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            const p = Math.round(m.progress * 100);
            setProgress(p);
            setStatusMessage(`문자 인식 중... (${p}%)`);
          } else if (m.status === 'loading tesseract core') {
            setStatusMessage('WebAssembly 코어 로딩 중...');
          } else if (m.status === 'loading language traineddata') {
            setStatusMessage('언어 모델 다운로드 및 준비 중...');
          } else if (m.status === 'initializing api') {
            setStatusMessage('인식 엔진 설정 중...');
          }
        },
      });

      setStatusMessage('문자 분석 및 텍스트 조합 중...');
      const ret = await worker.recognize(selectedImage);
      const text = ret.data.text.trim();

      await worker.terminate();

      if (!text) {
        setExtractedText('(이미지에서 인식된 텍스트가 없습니다. 더 선명한 이미지를 사용해보세요.)');
      } else {
        setExtractedText(text);
      }

      showToast('텍스트 추출이 완료되었습니다!');

      // 결과 영역으로 스크롤 이동
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('OCR Error:', err);
      alert('텍스트 인식 중 오류가 발생했습니다. 브라우저 콘솔을 확인해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 텍스트 클립보드 복사
  const handleCopyText = async () => {
    if (!extractedText) return;
    try {
      await navigator.clipboard.writeText(extractedText);
      showToast('텍스트가 클립보드에 복사되었습니다!');
    } catch {
      showToast('복사에 실패했습니다. 수동으로 복사해주세요.');
    }
  };

  // 텍스트 파일 (.txt) 다운로드
  const handleDownloadTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    link.href = url;
    link.download = `ocr_extracted_${dateStr}_${timeStr}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('텍스트 파일(.txt)이 다운로드되었습니다.');
  };

  // 통계 계산
  const charCountWithSpaces = extractedText.length;
  const charCountNoSpaces = extractedText.replace(/\s/g, '').length;
  const wordCount = extractedText.trim() ? extractedText.trim().split(/\s+/).length : 0;
  const lineCount = extractedText ? extractedText.split('\n').length : 0;

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4 w-full">
      {/* 1단계 마케팅 자동 캡처 진입 포인트 */}
      <div className="space-y-4">
        
        {/* 상단 보안 안내 배너 */}
        <div className="nm-card-sm p-3.5 bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <i className="fas fa-shield-halved text-sm"></i>
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>100% 브라우저 로컬 안전 구동</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">보안 보장</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                이미지가 외부 서버로 전송되지 않고 기기 안에서만 즉시 처리됩니다.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-white px-2 py-1 rounded-lg border border-blue-100 shadow-2xs shrink-0">
            WASM
          </span>
        </div>

        {/* 퀵 샘플 테스트 칩 바 (2단계 마케팅 조작 포인트) */}
        <div className="nm-card-sm p-3 bg-white border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span className="flex items-center gap-1.5">
              <i className="fas fa-wand-magic-sparkles text-amber-500"></i>
              <span>원클릭 샘플 테스트 칩</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">체험용 프리셋</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              data-screenshot-click="action"
              onClick={() => handleLoadSample('receipt', '영수증')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/70 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fas fa-receipt text-slate-400"></i>
              <span>영수증 샘플</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('business_card', '명함')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/70 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fas fa-id-card text-slate-400"></i>
              <span>명함 샘플</span>
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample('notice', '안내문')}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200/70 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="fas fa-bullhorn text-slate-400"></i>
              <span>안내문 샘플</span>
            </button>
          </div>
        </div>

        {/* 언어 선택 및 옵션 바 */}
        <div className="flex items-center justify-between gap-2 nm-card-sm p-3 bg-white border border-slate-200/80">
          <label htmlFor="lang-select" className="text-xs font-bold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
            <i className="fas fa-language text-blue-600"></i>
            <span>인식 언어</span>
          </label>
          <select
            id="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="kor+eng">🇰🇷 한국어 + 🇺🇸 영어 (권장)</option>
            <option value="kor">🇰🇷 한국어 전용</option>
            <option value="eng">🇺🇸 영어 전용</option>
            <option value="jpn">🇯🇵 일본어</option>
            <option value="chi_sim">🇨🇳 중국어 (간체)</option>
          </select>
        </div>

        {/* 이미지 드래그 앤 드롭 영역 */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !selectedImage && fileInputRef.current?.click()}
          className={`relative nm-card p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
              : selectedImage
              ? 'border-emerald-300 bg-white'
              : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {selectedImage ? (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative max-h-48 w-full flex items-center justify-center rounded-xl overflow-hidden bg-slate-100 border border-slate-200 p-2">
                <img
                  src={selectedImage}
                  alt="업로드된 대상 이미지 미리보기"
                  className="max-h-44 max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between w-full px-1 text-xs">
                <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={imageName}>
                  📄 {imageName || '선택된 이미지'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    사진 변경
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setImageName('');
                      setExtractedText('');
                    }}
                    className="text-red-500 hover:text-red-700 font-bold underline cursor-pointer ml-1"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-2xl shadow-xs">
                <i className="fas fa-cloud-arrow-up"></i>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-black text-slate-900">
                  여기로 이미지를 드래그하거나 클릭하여 선택
                </p>
                <p className="text-xs text-slate-500">
                  캡처 후 <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono font-bold text-slate-700">Ctrl+V</kbd> 로 바로 붙여넣을 수도 있습니다
                </p>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                지원 형식: PNG, JPG, JPEG, WEBP, BMP, GIF
              </p>
            </div>
          )}
        </div>

        {/* 추출 실행 버튼 (3단계 결과 스크린샷 트리거) */}
        <button
          type="button"
          data-screenshot-click="result"
          disabled={!selectedImage || isProcessing}
          onClick={handleRecognize}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
            !selectedImage
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : isProcessing
              ? 'bg-blue-400 text-white cursor-wait animate-pulse'
              : 'nm-btn-accent text-white hover:shadow-lg'
          }`}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              <span>{statusMessage || '텍스트 추출 분석 중...'}</span>
            </>
          ) : (
            <>
              <i className="fas fa-file-lines"></i>
              <span>이미지에서 글자 추출하기</span>
            </>
          )}
        </button>

        {/* 진행 상태 프로그레스 바 */}
        {isProcessing && (
          <div className="nm-card-sm p-3.5 bg-white border border-blue-200/80 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="text-blue-600 flex items-center gap-1.5">
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>{statusMessage}</span>
              </span>
              <span className="font-mono text-blue-700">{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 추출 결과 패널 (3단계 마케팅 스크린샷 결과 타겟) */}
        {extractedText && (
          <div
            ref={resultRef}
            data-screenshot-point="result"
            className="nm-card p-4 sm:p-5 bg-white border border-slate-200/90 rounded-2xl space-y-3.5 animate-fade-in-up"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                <h3 className="text-sm font-black text-slate-900">추출된 텍스트 결과</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="fas fa-copy"></i>
                  <span>복사</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="fas fa-download"></i>
                  <span>.txt 다운로드</span>
                </button>
              </div>
            </div>

            {/* 통계 배너 */}
            <div className="grid grid-cols-4 gap-2 py-1 text-center bg-slate-50 rounded-xl p-2 border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block">공백포함</span>
                <span className="font-extrabold text-slate-800 stock-number">{charCountWithSpaces.toLocaleString()}자</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">공백제외</span>
                <span className="font-extrabold text-blue-600 stock-number">{charCountNoSpaces.toLocaleString()}자</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">단어수</span>
                <span className="font-extrabold text-slate-800 stock-number">{wordCount.toLocaleString()}개</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">줄수</span>
                <span className="font-extrabold text-slate-800 stock-number">{lineCount}줄</span>
              </div>
            </div>

            {/* 텍스트 편집 영역 */}
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              rows={8}
              className="w-full p-3 text-xs sm:text-sm font-mono text-slate-800 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed resize-y"
              placeholder="추출된 텍스트가 여기에 표시되며 직접 수정할 수도 있습니다."
            ></textarea>
          </div>
        )}
      </div>

      {/* 하단 푸터 / 저작권 및 상태 표시 */}
      <footer className="pt-4 border-t border-slate-200/80 text-center space-y-1">
        <p className="text-[11px] text-slate-400">
          Powered by Tesseract.js WebAssembly • 100% Client-Side Engine
        </p>
        <p className="text-[10px] text-slate-400">
          © 2026 VeraNex. All rights reserved.
        </p>
      </footer>

      {/* 토스트 알림 팝업 */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <i className="fas fa-check-circle text-emerald-400"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
