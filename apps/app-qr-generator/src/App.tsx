import React, { useMemo, useState } from 'react';
import {
  EmailPayload,
  QrDataType,
  QrDesignSettings,
  SmsPayload,
  VCardPayload,
  WifiPayload,
  WizardStep,
} from './types';
import { encodeQrMatrix } from './utils/qrMatrixEncoder';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import Header from './components/Header';
import QrInputPanel from './components/QrInputPanel';
import QrPreviewCard from './components/QrPreviewCard';
import HowToGuide from './components/HowToGuide';
import FaqSection from './components/FaqSection';

const DEFAULT_DESIGN: QrDesignSettings = {
  fgColor: '#111827',
  bgColor: '#FFFFFF',
  dotStyle: 'rounded',
  eyeStyle: 'rounded',
  ecLevel: 'M',
  size: 1024,
  margin: 2,
  centerBadge: 'none',
  customLogoDataUrl: null,
  showFrameLabel: false,
  frameTitle: 'SCAN ME',
  frameSubtitle: '스마트폰 카메라로 스캔해 주세요',
};

const WIZARD_STEPS: { step: WizardStep; title: string; subtitle: string }[] = [
  { step: 1, title: '용도 · 데이터', subtitle: '내용 입력하기' },
  { step: 2, title: '컬러 · 도트 모양', subtitle: '디자인 꾸미기' },
  { step: 3, title: 'QR코드 완성', subtitle: '스캔 · 파일 저장' },
];

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'app' | 'guide' | 'faq'>('app');
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [toastMessage, setToastMessage] = useState('');

  const [dataType, setDataType] = useState<QrDataType>('url');
  const [urlValue, setUrlValue] = useState('https://veranex.app');
  const [textValue, setTextValue] = useState(
    '베라넥스(VeraNex) 스마트 QR코드 스튜디오 - 평생 유효기간 없는 무료 QR코드'
  );
  const [wifiValue, setWifiValue] = useState<WifiPayload>({
    ssid: 'VeraNex_Guest_5G',
    password: 'veranex2026!',
    encryption: 'WPA',
    hidden: false,
  });
  const [vcardValue, setVcardValue] = useState<VCardPayload>({
    fullName: '김베라',
    phone: '010-1234-5678',
    organization: 'VeraNex',
    title: '프로덕트 총괄',
    email: 'contact@veranex.app',
    website: 'https://veranex.app',
  });
  const [smsValue, setSmsValue] = useState<SmsPayload>({
    phone: '010-1234-5678',
    message: '안녕하세요! QR코드를 통해 문의드립니다.',
  });
  const [emailValue, setEmailValue] = useState<EmailPayload>({
    email: 'contact@veranex.app',
    subject: '베라넥스 비즈니스 제휴 문의',
    body: '안녕하세요, QR코드를 통해 연락드립니다.',
  });

  const [design, setDesign] = useState<QrDesignSettings>(DEFAULT_DESIGN);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2600);
  };

  const handleGoToStep = (nextStep: WizardStep) => {
    setCurrentStep(nextStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateDesign = (partial: Partial<QrDesignSettings>) => {
    setDesign((prev) => ({ ...prev, ...partial }));
  };

  // 데이터 유형별 표준 페이로드 문자열 조합
  const payloadText = useMemo(() => {
    switch (dataType) {
      case 'url': {
        const trimmed = urlValue.trim();
        if (!trimmed) return 'https://veranex.app';
        return trimmed;
      }
      case 'wifi': {
        const escapeWifi = (s: string) => s.replace(/([\\;,:])/g, '\\$1');
        const ssid = escapeWifi(wifiValue.ssid.trim() || 'VeraNex_WiFi');
        const pass = wifiValue.encryption === 'nopass' ? '' : escapeWifi(wifiValue.password);
        return `WIFI:T:${wifiValue.encryption};S:${ssid};P:${pass};H:${wifiValue.hidden ? 'true' : 'false'};;`;
      }
      case 'vcard': {
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${vcardValue.fullName.trim() || 'VeraNex'}`,
          vcardValue.organization.trim() ? `ORG:${vcardValue.organization.trim()}` : '',
          vcardValue.title.trim() ? `TITLE:${vcardValue.title.trim()}` : '',
          vcardValue.phone.trim() ? `TEL;TYPE=CELL:${vcardValue.phone.trim()}` : '',
          vcardValue.email.trim() ? `EMAIL:${vcardValue.email.trim()}` : '',
          vcardValue.website.trim() ? `URL:${vcardValue.website.trim()}` : '',
          'END:VCARD',
        ].filter(Boolean);
        return lines.join('\n');
      }
      case 'sms': {
        const phone = smsValue.phone.trim() || '010-0000-0000';
        return `SMSTO:${phone}:${smsValue.message.trim()}`;
      }
      case 'email': {
        const to = emailValue.email.trim() || 'contact@veranex.app';
        return `MATMSG:TO:${to};SUB:${emailValue.subject.trim()};BODY:${emailValue.body.trim()};;`;
      }
      case 'text':
      default:
        return textValue.trim() || 'https://veranex.app';
    }
  }, [dataType, urlValue, wifiValue, vcardValue, smsValue, emailValue, textValue]);

  // ISO/IEC 18004 행렬 생성
  const matrix = useMemo(() => {
    try {
      return encodeQrMatrix(payloadText, design.ecLevel);
    } catch (_e) {
      return encodeQrMatrix(payloadText.slice(0, 400), 'L');
    }
  }, [payloadText, design.ecLevel]);

  const handleLoadPreset = (presetKey: string) => {
    if (presetKey === 'portal') {
      setDataType('url');
      setUrlValue('https://veranex.app/lifestyle');
    }
  };

  const handleReset = () => {
    setDataType('url');
    setUrlValue('https://veranex.app');
    setDesign(DEFAULT_DESIGN);
    setCurrentStep(1);
    showToast('처음 상태로 초기화되었습니다.');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: '스마트 QR코드 생성기 & 디자인 스튜디오 | VeraNex',
          text: '유효기간 없는 평생 무료 고화질 QR코드 생성기 (URL, 와이파이, 명함, PNG/SVG)',
          url: shareUrl,
        });
        return;
      } catch (_e) {
        // 사용자 취소 시 무시
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('🔗 QR코드 생성기 주소가 클립보드에 복사되었습니다.');
    } catch (_e) {
      showToast('주소 복사에 실패했습니다.');
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#FAF8F5] text-[#2D2A26] flex flex-col font-sans antialiased selection:bg-indigo-600 selection:text-white">
        {/* 4초 불투명 스플래시 화면 */}
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

        {/* 토스트 알림 */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2D2A26] text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-fade-in">
            <i className="fas fa-circle-check text-emerald-400"></i>
            <span>{toastMessage}</span>
          </div>
        )}

        <div className="max-w-3xl w-full mx-auto px-3 sm:px-6 pt-4 flex-1 flex flex-col">
          {/* Zone 1: 상단 공식 헤더 & 메뉴 탭 통합 컨테이너 (샌드 베이지 배경으로 메인 영역과 확실히 분리) */}
          <Header
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            onShare={handleShare}
          />

          {/* 메인 콘텐츠 영역 */}
          <main className="flex-1 pb-8 space-y-5">
            {activeTab === 'app' && (
              <>
                {/* Zone 2: 연결선형 3단계 진행 표시줄 (버튼들과 헷갈리지 않고 글자가 잘리지 않는 정통 스텝퍼) */}
                <div className="relative px-3 sm:px-8 py-3.5 bg-gradient-to-r from-indigo-50/70 via-white to-emerald-50/60 rounded-2xl border border-indigo-100/90 shadow-2xs">
                  {/* 뒤쪽 연결 진행선 */}
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

                {/* Zone 3: 단계별 메인 작업 영역 카드 (상단 굵은 인디고 보더로 주인공 작업창 강조) */}
                {currentStep !== 3 ? (
                  <QrInputPanel
                    step={currentStep}
                    onGoToStep={handleGoToStep}
                    matrix={matrix}
                    payloadText={payloadText}
                    dataType={dataType}
                    onChangeDataType={setDataType}
                    urlValue={urlValue}
                    onChangeUrl={setUrlValue}
                    textValue={textValue}
                    onChangeText={setTextValue}
                    wifiValue={wifiValue}
                    onChangeWifi={setWifiValue}
                    vcardValue={vcardValue}
                    onChangeVcard={setVcardValue}
                    smsValue={smsValue}
                    onChangeSms={setSmsValue}
                    emailValue={emailValue}
                    onChangeEmail={setEmailValue}
                    design={design}
                    onUpdateDesign={handleUpdateDesign}
                    onLoadPreset={handleLoadPreset}
                    onReset={handleReset}
                  />
                ) : (
                  <QrPreviewCard
                    matrix={matrix}
                    payloadText={payloadText}
                    design={design}
                    onUpdateDesign={handleUpdateDesign}
                    onGoToStep={handleGoToStep}
                    onShowToast={showToast}
                  />
                )}

                {/* 하단 스폰서 광고 슬롯 (CLS 제로) */}
                <div
                  aria-label="SPONSORED AD"
                  className="bg-[#EFECE6]/70 border border-[#DFD9CE] rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[9px] font-black text-stone-600 bg-white border border-[#DFD9CE] px-1.5 py-0.5 rounded shrink-0">
                      SPONSORED AD
                    </span>
                    <span className="text-xs font-bold text-[#2D2A26] truncate">
                      고해상도 명함·배너 디자인은 VeraNex 이미지 리사이저와 함께!
                    </span>
                  </div>
                  <a
                    href="https://veranex.app/lifestyle"
                    target="_top"
                    className="text-[11px] font-extrabold text-indigo-600 hover:underline shrink-0"
                  >
                    열기 →
                  </a>
                </div>
              </>
            )}

            {activeTab === 'guide' && <HowToGuide />}
            {activeTab === 'faq' && <FaqSection />}
          </main>
        </div>

        {/* 하단 공식 저작권 및 E-E-A-T 보안 고지 푸터 */}
        <footer className="mt-auto border-t border-[#EBE6DD] bg-white/70 py-4 px-4 text-center text-xs text-stone-500">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="font-bold text-[#2D2A26]">
              © 2026 VeraNex. All rights reserved. (100% Client-Side QR Matrix Engine)
            </p>
            <div className="flex items-center gap-3 text-[11px] text-stone-400 font-medium">
              <span className="flex items-center gap-1">
                <i className="fas fa-shield-halved text-emerald-600"></i>
                서버 전송 0% 개인정보 보호
              </span>
              <span>•</span>
              <span>ISO/IEC 18004 국제 표준</span>
              <span>•</span>
              <span>유효기간 무제한</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
