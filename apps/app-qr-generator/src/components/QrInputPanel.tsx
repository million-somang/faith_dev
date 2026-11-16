import React, { useEffect, useRef } from 'react';
import {
  CenterBadgeType,
  DotStyle,
  EmailPayload,
  EyeStyle,
  QrDataType,
  QrDesignSettings,
  QrMatrixResult,
  SmsPayload,
  VCardPayload,
  WifiPayload,
  WizardStep,
} from '../types';
import { renderQrToCanvas } from '../utils/qrRenderer';

interface QrInputPanelProps {
  step: 1 | 2;
  onGoToStep: (step: WizardStep) => void;
  matrix: QrMatrixResult;
  payloadText: string;
  dataType: QrDataType;
  onChangeDataType: (type: QrDataType) => void;
  urlValue: string;
  onChangeUrl: (val: string) => void;
  textValue: string;
  onChangeText: (val: string) => void;
  wifiValue: WifiPayload;
  onChangeWifi: (val: WifiPayload) => void;
  vcardValue: VCardPayload;
  onChangeVcard: (val: VCardPayload) => void;
  smsValue: SmsPayload;
  onChangeSms: (val: SmsPayload) => void;
  emailValue: EmailPayload;
  onChangeEmail: (val: EmailPayload) => void;
  design: QrDesignSettings;
  onUpdateDesign: (partial: Partial<QrDesignSettings>) => void;
  onLoadPreset: (presetKey: string) => void;
  onReset: () => void;
}

const DATA_TYPE_TABS: { key: QrDataType; label: string; desc: string; icon: string }[] = [
  { key: 'url', label: '웹사이트 주소', desc: '홈페이지 · 유튜브 · 블로그 링크', icon: 'fas fa-link' },
  { key: 'wifi', label: '와이파이 연결', desc: '스캔 즉시 비밀번호 없이 접속', icon: 'fas fa-wifi' },
  { key: 'vcard', label: '스마트 명함', desc: '휴대폰 연락처에 바로 저장', icon: 'fas fa-id-card' },
  { key: 'text', label: '텍스트 · 메모', desc: '안내 문구 · 쿠폰 · 시리얼 번호', icon: 'fas fa-align-left' },
  { key: 'sms', label: 'SMS 문자', desc: '번호와 문자 내용 자동 입력', icon: 'fas fa-comment-sms' },
  { key: 'email', label: '이메일 발송', desc: '수신 메일 주소와 제목 자동 작성', icon: 'fas fa-envelope' },
];

const COLOR_PRESETS: { name: string; fg: string; bg: string }[] = [
  { name: '클래식 블랙', fg: '#111827', bg: '#FFFFFF' },
  { name: '베라 인디고', fg: '#3730A3', bg: '#FFFFFF' },
  { name: '에메랄드 그린', fg: '#065F46', bg: '#FFFFFF' },
  { name: '로얄 블루', fg: '#1E40AF', bg: '#FFFFFF' },
  { name: '와인 버건디', fg: '#9F1239', bg: '#FFFFFF' },
  { name: '웜 에스프레소', fg: '#2D2A26', bg: '#FAF8F5' },
];

export default function QrInputPanel({
  step,
  onGoToStep,
  matrix,
  payloadText,
  dataType,
  onChangeDataType,
  urlValue,
  onChangeUrl,
  textValue,
  onChangeText,
  wifiValue,
  onChangeWifi,
  vcardValue,
  onChangeVcard,
  smsValue,
  onChangeSms,
  emailValue,
  onChangeEmail,
  design,
  onUpdateDesign,
  onLoadPreset,
  onReset,
}: QrInputPanelProps) {
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step 2에서 실시간 미니 QR 미리보기 캔버스 렌더링
  useEffect(() => {
    if (step !== 2 || !miniCanvasRef.current) return;
    void renderQrToCanvas(miniCanvasRef.current, matrix, {
      ...design,
      size: 512,
      showFrameLabel: false,
    });
  }, [step, matrix, design]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateDesign({
          centerBadge: 'custom',
          customLogoDataUrl: reader.result,
          ecLevel: 'H',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // ============================================================================
  // [STEP 1] QR 용도 선택 및 데이터 입력 화면
  // ============================================================================
  if (step === 1) {
    return (
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] shadow-xs space-y-6 animate-fade-in">
        {/* 상단 헤더 */}
        <div className="flex items-start justify-between gap-3 border-b border-[#EBE6DD] pb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-200 mb-1.5">
              STEP 1 OF 3
            </span>
            <h2 className="text-base sm:text-lg font-black text-[#2D2A26]">
              어떤 용도의 QR코드를 만드시겠어요?
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              원하는 용도를 고르고 내용을 입력한 뒤 아래 <strong>[다음 스텝]</strong> 버튼을 눌러주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-bold text-stone-400 hover:text-rose-600 transition-colors cursor-pointer shrink-0 pt-1"
          >
            <i className="fas fa-rotate-left mr-1"></i>초기화
          </button>
        </div>

        {/* 1. 원클릭 예시 샘플 버튼 바 */}
        <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#EBE6DD] flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-extrabold text-[#2D2A26] flex items-center gap-1.5">
            <i className="fas fa-wand-magic-sparkles text-indigo-600"></i>
            <span>빠른 예시 자동 입력:</span>
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              data-screenshot-click="action"
              onClick={() => onLoadPreset('portal')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
            >
              🌐 웹사이트 예시
            </button>
            <button
              type="button"
              onClick={() => onLoadPreset('cafe-wifi')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
            >
              📶 카페 와이파이 예시
            </button>
            <button
              type="button"
              onClick={() => onLoadPreset('biz-vcard')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all cursor-pointer shadow-2xs"
            >
              👤 명함(연락처) 예시
            </button>
          </div>
        </div>

        {/* 2. 6대 QR 용도 선택 그리드 (2x3 큼직한 카드) */}
        <div>
          <label className="block text-xs font-black text-[#2D2A26] mb-2.5">
            1. QR코드 종류 선택
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DATA_TYPE_TABS.map((tab) => {
              const active = dataType === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onChangeDataType(tab.key)}
                  className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3 ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-[#FAF8F5] text-[#2D2A26] border-[#EBE6DD] hover:bg-stone-100'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                      active ? 'bg-white/20 text-white' : 'bg-white text-indigo-600 border border-[#EBE6DD]'
                    }`}
                  >
                    <i className={tab.icon}></i>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-black truncate">{tab.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 line-clamp-1 ${
                        active ? 'text-indigo-100' : 'text-stone-500'
                      }`}
                    >
                      {tab.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. 선택된 용도별 입력 폼 */}
        <div className="bg-[#FAF8F5] rounded-2xl p-4 sm:p-5 border border-[#EBE6DD] space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
              <i className="fas fa-pen-to-square text-indigo-600"></i>
              <span>2. QR코드에 담을 내용 입력</span>
            </span>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              유효기간 평생 무제한
            </span>
          </div>

          {dataType === 'url' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">
                연결할 인터넷 주소 (URL)
              </label>
              <div className="relative">
                <i className="fas fa-globe absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm"></i>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(e) => onChangeUrl(e.target.value)}
                  data-screenshot-input="https://veranex.app"
                  placeholder="예: https://veranex.app"
                  className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#EBE6DD] rounded-xl text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-stone-500">
                💡 스마트폰 카메라로 스캔하면 위 웹사이트 주소로 즉시 이동합니다.
              </p>
            </div>
          )}

          {dataType === 'wifi' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    와이파이 이름 (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiValue.ssid}
                    onChange={(e) => onChangeWifi({ ...wifiValue, ssid: e.target.value })}
                    placeholder="예: Cafe_VeraNex_5G"
                    className="w-full px-3.5 py-3 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    와이파이 비밀번호
                  </label>
                  <input
                    type="text"
                    value={wifiValue.password}
                    onChange={(e) => onChangeWifi({ ...wifiValue, password: e.target.value })}
                    disabled={wifiValue.encryption === 'nopass'}
                    placeholder={wifiValue.encryption === 'nopass' ? '비밀번호 없음' : '비밀번호 입력'}
                    className="w-full px-3.5 py-3 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none disabled:opacity-50"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-stone-500 mr-1">보안 방식:</span>
                  {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                    <button
                      key={enc}
                      type="button"
                      onClick={() => onChangeWifi({ ...wifiValue, encryption: enc })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                        wifiValue.encryption === enc
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'bg-white border-[#EBE6DD] text-stone-600'
                      }`}
                    >
                      {enc === 'WPA' ? '일반 (WPA/WPA2)' : enc === 'WEP' ? 'WEP' : '암호 없음'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {dataType === 'vcard' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">이름 (성명)</label>
                <input
                  type="text"
                  value={vcardValue.fullName}
                  onChange={(e) => onChangeVcard({ ...vcardValue, fullName: e.target.value })}
                  placeholder="홍길동"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">휴대폰 번호</label>
                <input
                  type="tel"
                  value={vcardValue.phone}
                  onChange={(e) => onChangeVcard({ ...vcardValue, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">회사 · 소속</label>
                <input
                  type="text"
                  value={vcardValue.organization}
                  onChange={(e) => onChangeVcard({ ...vcardValue, organization: e.target.value })}
                  placeholder="VeraNex"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">직함 · 부서</label>
                <input
                  type="text"
                  value={vcardValue.title}
                  onChange={(e) => onChangeVcard({ ...vcardValue, title: e.target.value })}
                  placeholder="대표 / 매니저"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">이메일</label>
                <input
                  type="email"
                  value={vcardValue.email}
                  onChange={(e) => onChangeVcard({ ...vcardValue, email: e.target.value })}
                  placeholder="contact@veranex.app"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">웹사이트</label>
                <input
                  type="url"
                  value={vcardValue.website}
                  onChange={(e) => onChangeVcard({ ...vcardValue, website: e.target.value })}
                  placeholder="https://veranex.app"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
            </div>
          )}

          {dataType === 'text' && (
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                표시할 텍스트 · 메모 · 쿠폰 번호
              </label>
              <textarea
                rows={3}
                value={textValue}
                onChange={(e) => onChangeText(e.target.value)}
                placeholder="스캔했을 때 화면에 보여줄 문구를 자유롭게 입력하세요."
                className="w-full px-3.5 py-3 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none resize-none leading-relaxed"
              />
            </div>
          )}

          {dataType === 'sms' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">받는 사람 전화번호</label>
                <input
                  type="tel"
                  value={smsValue.phone}
                  onChange={(e) => onChangeSms({ ...smsValue, phone: e.target.value })}
                  placeholder="010-1234-5678"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">문자 메시지 내용</label>
                <input
                  type="text"
                  value={smsValue.message}
                  onChange={(e) => onChangeSms({ ...smsValue, message: e.target.value })}
                  placeholder="예: 이벤트 신청합니다!"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
            </div>
          )}

          {dataType === 'email' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">받는 이메일 주소</label>
                  <input
                    type="email"
                    value={emailValue.email}
                    onChange={(e) => onChangeEmail({ ...emailValue, email: e.target.value })}
                    placeholder="contact@veranex.app"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">이메일 제목</label>
                  <input
                    type="text"
                    value={emailValue.subject}
                    onChange={(e) => onChangeEmail({ ...emailValue, subject: e.target.value })}
                    placeholder="문의드립니다"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">이메일 본문</label>
                <input
                  type="text"
                  value={emailValue.body}
                  onChange={(e) => onChangeEmail({ ...emailValue, body: e.target.value })}
                  placeholder="내용을 입력하세요."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EBE6DD] rounded-xl text-xs sm:text-sm font-bold text-[#2D2A26] focus:border-indigo-600 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* 하단 스텝 이동 액션 버튼 */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => onGoToStep(2)}
            className="flex-1 py-4 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>다음 스텝: 컬러 · 도트 모양 설정하기</span>
            <i className="fas fa-arrow-right"></i>
          </button>

          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="py-4 px-5 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs font-black rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <i className="fas fa-bolt text-amber-500"></i>
            <span>디자인 건너뛰고 바로 QR 생성</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // [STEP 2] 컬러 · 도트 모양 · 로고 설정 화면
  // ============================================================================
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] shadow-xs space-y-6 animate-fade-in">
      {/* 상단 헤더 + 실시간 미니 프리뷰 박스 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FAF8F5] p-4 rounded-2xl border border-[#EBE6DD]">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-black border border-indigo-200">
            STEP 2 OF 3
          </span>
          <h2 className="text-base sm:text-lg font-black text-[#2D2A26]">
            컬러와 도트 모양을 선택해 주세요
          </h2>
          <p className="text-xs text-stone-500">
            우측 미니 미리보기로 스타일을 확인한 뒤 <strong>[다음 스텝: QR코드 생성]</strong>을 눌러주세요.
          </p>
          <p className="text-[11px] font-mono text-stone-400 truncate max-w-md">
            입력 데이터: {payloadText}
          </p>
        </div>

        {/* 실시간 미니 QR 미리보기 */}
        <div className="flex items-center gap-3 self-center sm:self-auto bg-white p-2.5 rounded-2xl border border-[#EBE6DD] shadow-2xs shrink-0">
          <canvas
            ref={miniCanvasRef}
            className="w-20 h-20 rounded-lg object-contain border border-stone-100"
          />
          <div className="text-left pr-1 sm:hidden">
            <span className="text-[10px] font-black text-indigo-600 block">실시간 미리보기</span>
            <span className="text-[11px] text-stone-500">선택 즉시 반영됩니다</span>
          </div>
        </div>
      </div>

      {/* 1. 컬러 테마 선택 */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
            <i className="fas fa-palette text-indigo-600"></i>
            <span>1. QR코드 컬러 테마</span>
          </label>
          <div className="flex items-center gap-3 text-xs font-bold text-stone-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span>도트색 직접 선택</span>
              <input
                type="color"
                value={design.fgColor}
                onChange={(e) => onUpdateDesign({ fgColor: e.target.value })}
                className="w-6 h-6 rounded border border-[#EBE6DD] cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <span>배경색</span>
              <input
                type="color"
                value={design.bgColor}
                onChange={(e) => onUpdateDesign({ bgColor: e.target.value })}
                className="w-6 h-6 rounded border border-[#EBE6DD] cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const isSelected =
              design.fgColor.toLowerCase() === preset.fg.toLowerCase() &&
              design.bgColor.toLowerCase() === preset.bg.toLowerCase();
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => onUpdateDesign({ fgColor: preset.fg, bgColor: preset.bg })}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center gap-2.5 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-2xs'
                    : 'bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-stone-100'
                }`}
              >
                <span
                  className="w-4 h-4 rounded-full shrink-0 border border-black/15"
                  style={{ backgroundColor: preset.fg }}
                />
                <span className="truncate">{preset.name}</span>
                {isSelected && <i className="fas fa-check text-indigo-600 ml-auto text-[10px]"></i>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 도트 모양 & 모서리 모양 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EBE6DD]">
        <div>
          <label className="block text-xs font-black text-[#2D2A26] mb-2">
            2. 도트(점) 모양 선택
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: 'square', label: '정사각형', icon: 'fas fa-square-full' },
                { key: 'rounded', label: '부드러운형', icon: 'fas fa-square' },
                { key: 'dots', label: '동그라미 점', icon: 'fas fa-circle' },
              ] as { key: DotStyle; label: string; icon: string }[]
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onUpdateDesign({ dotStyle: item.key })}
                className={`py-3 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  design.dotStyle === item.key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-700 border-[#EBE6DD] hover:bg-stone-100'
                }`}
              >
                <i className={`${item.icon} text-xs`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-black text-[#2D2A26] mb-2">
            3. 모서리 테두리 모양 선택
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: 'square', label: '각진 네모', icon: 'far fa-square' },
                { key: 'rounded', label: '둥근 네모', icon: 'fas fa-vector-square' },
                { key: 'circle', label: '원형 프레임', icon: 'far fa-circle' },
              ] as { key: EyeStyle; label: string; icon: string }[]
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onUpdateDesign({ eyeStyle: item.key })}
                className={`py-3 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all flex flex-col items-center gap-1.5 ${
                  design.eyeStyle === item.key
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-700 border-[#EBE6DD] hover:bg-stone-100'
                }`}
              >
                <i className={`${item.icon} text-xs`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 중앙 아이콘 / 로고 삽입 (선택 사항) */}
      <div className="pt-2 border-t border-[#EBE6DD] space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#2D2A26]">
            4. 중앙 아이콘 또는 내 로고 넣기 (선택)
          </label>
          <button
            type="button"
            onClick={() => logoInputRef.current?.click()}
            className="text-xs font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
          >
            <i className="fas fa-upload text-[10px]"></i>
            <span>내 로고 이미지 올리기</span>
          </button>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoFileChange}
            className="hidden"
          />
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(
            [
              { key: 'none', label: '로고 없음' },
              { key: 'link', label: '🔗 링크' },
              { key: 'wifi', label: '📶 와이파이' },
              { key: 'vcard', label: '👤 명함' },
              { key: 'message', label: '💬 메시지' },
              { key: 'star', label: '⭐ 스타' },
            ] as { key: CenterBadgeType; label: string }[]
          ).map((badge) => (
            <button
              key={badge.key}
              type="button"
              onClick={() =>
                onUpdateDesign({
                  centerBadge: badge.key,
                  ecLevel: badge.key === 'none' ? 'M' : 'H',
                })
              }
              className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                design.centerBadge === badge.key
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xs'
                  : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-700 hover:bg-stone-100'
              }`}
            >
              {badge.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. 인쇄용 상하단 안내 문구 테두리 (선택 사항) */}
      <div className="pt-2 border-t border-[#EBE6DD] space-y-2.5">
        <label className="flex items-center justify-between cursor-pointer bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#EBE6DD]">
          <div>
            <span className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
              <i className="fas fa-print text-indigo-600"></i>
              <span>매장 인쇄용 안내 문구 테두리 추가하기</span>
            </span>
            <span className="text-[11px] text-stone-500 block mt-0.5">
              QR코드 위·아래에 "와이파이 연결", "카메라로 스캔해 주세요" 같은 제목을 함께 넣어줍니다.
            </span>
          </div>
          <input
            type="checkbox"
            checked={design.showFrameLabel}
            onChange={(e) => onUpdateDesign({ showFrameLabel: e.target.checked })}
            className="rounded border-stone-300 text-indigo-600 w-5 h-5 cursor-pointer shrink-0"
          />
        </label>

        {design.showFrameLabel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">상단 큰 제목</label>
              <input
                type="text"
                value={design.frameTitle}
                onChange={(e) => onUpdateDesign({ frameTitle: e.target.value })}
                placeholder="예: 무료 와이파이 연결"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">하단 안내 문구</label>
              <input
                type="text"
                value={design.frameSubtitle}
                onChange={(e) => onUpdateDesign({ frameSubtitle: e.target.value })}
                placeholder="예: 스마트폰 카메라로 스캔해 주세요"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 하단 이전/다음 스텝 버튼 */}
      <div className="pt-3 flex gap-2.5">
        <button
          type="button"
          onClick={() => onGoToStep(1)}
          className="py-4 px-5 bg-[#FAF8F5] hover:bg-stone-200/70 text-[#2D2A26] border border-[#EBE6DD] text-xs sm:text-sm font-black rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <i className="fas fa-arrow-left"></i>
          <span>이전 스텝</span>
        </button>

        <button
          type="button"
          data-screenshot-click="result"
          onClick={() => onGoToStep(3)}
          className="flex-1 py-4 px-5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <i className="fas fa-qrcode"></i>
          <span>다음 스텝: QR코드 생성 결과 보기</span>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
