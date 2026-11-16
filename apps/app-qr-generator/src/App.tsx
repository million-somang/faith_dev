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
  { step: 1, title: '1. QR 용도 및 데이터', subtitle: '주소 · 와이파이 · 명함 입력' },
  { step: 2, title: '2. 컬러 · 도트 모양', subtitle: '색상 · 점 모양 · 로고 꾸미기' },
  { step: 3, title: '3. QR코드 생성 완료', subtitle: '스캔 테스트 및 고화질 저장' },
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

  // 원클릭 샘플 프리셋 로더
  const handleLoadPreset = (presetKey: string) => {
    if (presetKey === 'portal') {
      setDataType('url');
      setUrlValue('https://veranex.app/lifestyle');
      handleUpdateDesign({
        fgColor: '#3730A3',
        bgColor: '#FFFFFF',
        dotStyle: 'rounded',
        eyeStyle: 'rounded',
        centerBadge: 'link',
        ecLevel: 'H',
        showFrameLabel: true,
        frameTitle: 'VERANEX SMART HUB',
        frameSubtitle: '스캔하여 스마트 생활도구를 만나보세요',
      });
      showToast('🌐 웹사이트 예시 데이터가 입력되었습니다.');
    } else if (presetKey === 'cafe-wifi') {
      setDataType('wifi');
      setWifiValue({
        ssid: 'Cafe_VeraNex_5G',
        password: 'americano2026',
        encryption: 'WPA',
        hidden: false,
      });
      handleUpdateDesign({
        fgColor: '#065F46',
        bgColor: '#FFFFFF',
        dotStyle: 'rounded',
        eyeStyle: 'circle',
        centerBadge: 'wifi',
        ecLevel: 'H',
        showFrameLabel: true,
        frameTitle: '무료 와이파이 연결',
        frameSubtitle: '카메라로 스캔하면 비밀번호 없이 즉시 연결됩니다',
      });
      showToast('📶 카페 와이파이 예시 데이터가 입력되었습니다.');
    } else if (presetKey === 'biz-vcard') {
      setDataType('vcard');
      setVcardValue({
        fullName: '이현우 대표',
        phone: '010-9876-5432',
        organization: 'VeraNex Studio',
        title: 'CEO / Founder',
        email: 'ceo@veranex.app',
        website: 'https://veranex.app',
      });
      handleUpdateDesign({
        fgColor: '#111827',
        bgColor: '#FFFFFF',
        dotStyle: 'square',
        eyeStyle: 'rounded',
        centerBadge: 'vcard',
        ecLevel: 'H',
        showFrameLabel: true,
        frameTitle: '스마트 전자명함',
        frameSubtitle: '스캔하여 연락처를 휴대폰에 바로 저장하세요',
      });
      showToast('👤 스마트 명함 예시 데이터가 입력되었습니다.');
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
          {/* 상단 공식 VERANEX 헤더 */}
          <Header onShare={handleShare} />

          {/* 3단 메뉴 탭 (QR 만들기 / 사용 가이드 / 자주 묻는 질문) */}
          <nav className="flex items-center gap-1 border-b border-[#EBE6DD] mb-4">
            <button
              type="button"
              onClick={() => setActiveTab('app')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
                activeTab === 'app'
                  ? 'border-indigo-600 text-indigo-600 bg-white/80 rounded-t-xl'
                  : 'border-transparent text-stone-500 hover:text-[#2D2A26]'
              }`}
            >
              <i className="fas fa-qrcode"></i>
              <span>QR코드 만들기</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
                activeTab === 'guide'
                  ? 'border-indigo-600 text-indigo-600 bg-white/80 rounded-t-xl'
                  : 'border-transparent text-stone-500 hover:text-[#2D2A26]'
              }`}
            >
              <i className="fas fa-book-open"></i>
              <span>사용 가이드</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black border-b-2 transition-all cursor-pointer ${
                activeTab === 'faq'
                  ? 'border-indigo-600 text-indigo-600 bg-white/80 rounded-t-xl'
                  : 'border-transparent text-stone-500 hover:text-[#2D2A26]'
              }`}
            >
              <i className="far fa-circle-question"></i>
              <span>자주 묻는 질문</span>
            </button>
          </nav>

          {/* 메인 콘텐츠 영역 */}
          <main className="flex-1 pb-8 space-y-4">
            {activeTab === 'app' && (
              <>
                {/* 상단 3단계 프로그레스 스텝 바 (클릭하여 단계 이동 가능) */}
                <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded-2xl border border-[#EBE6DD] shadow-2xs">
                  {WIZARD_STEPS.map((item) => {
                    const isCurrent = currentStep === item.step;
                    const isDone = currentStep > item.step;
                    return (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => handleGoToStep(item.step)}
                        className={`p-2.5 sm:p-3 rounded-xl text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
                          isCurrent
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : isDone
                            ? 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:bg-emerald-50'
                            : 'bg-[#FAF8F5] text-stone-500 border-transparent hover:bg-stone-100'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-white text-indigo-600'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {isDone ? <i className="fas fa-check text-[10px]"></i> : item.step}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] sm:text-xs font-black truncate">
                            {item.title}
                          </div>
                          <div
                            className={`text-[10px] truncate hidden sm:block ${
                              isCurrent ? 'text-indigo-100' : isDone ? 'text-emerald-700' : 'text-stone-400'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 단계별 단일 화면 렌더링 (Step 1 / Step 2 / Step 3) */}
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
                  className="bg-white border border-[#EBE6DD] rounded-2xl p-3.5 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shrink-0">
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
