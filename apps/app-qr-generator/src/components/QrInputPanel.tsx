import React, { useRef } from 'react';
import {
  CenterBadgeType,
  DotStyle,
  EmailPayload,
  ErrorCorrectionLevel,
  EyeStyle,
  QrDataType,
  QrDesignSettings,
  SmsPayload,
  VCardPayload,
  WifiPayload,
} from '../types';

interface QrInputPanelProps {
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

const DATA_TYPE_TABS: { key: QrDataType; label: string; icon: string }[] = [
  { key: 'url', label: '웹사이트 URL', icon: 'fas fa-link' },
  { key: 'wifi', label: '와이파이', icon: 'fas fa-wifi' },
  { key: 'vcard', label: '스마트 명함', icon: 'fas fa-id-card' },
  { key: 'text', label: '텍스트·메모', icon: 'fas fa-align-left' },
  { key: 'sms', label: 'SMS 문자', icon: 'fas fa-comment-sms' },
  { key: 'email', label: '이메일', icon: 'fas fa-envelope' },
];

const COLOR_PRESETS: { name: string; fg: string; bg: string }[] = [
  { name: '클래식 블랙', fg: '#111827', bg: '#FFFFFF' },
  { name: '베라 인디고', fg: '#3730A3', bg: '#FFFFFF' },
  { name: '에메랄드', fg: '#065F46', bg: '#FFFFFF' },
  { name: '로얄 블루', fg: '#1E40AF', bg: '#FFFFFF' },
  { name: '와인 버건디', fg: '#9F1239', bg: '#FFFFFF' },
  { name: '웜 에스프레소', fg: '#2D2A26', bg: '#FAF8F5' },
];

export default function QrInputPanel({
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

  return (
    <div className="space-y-4">
      {/* 1. 데이터 유형 선택 & 원클릭 샘플 프리셋 카드 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE6DD] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
            <i className="fas fa-layer-group text-indigo-600"></i>
            <span>1. QR코드 용도 및 데이터 입력</span>
          </label>
          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-bold text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <i className="fas fa-rotate-left mr-1"></i>초기화
          </button>
        </div>

        {/* 6대 데이터 유형 그리드 탭 */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {DATA_TYPE_TABS.map((tab) => {
            const active = dataType === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeDataType(tab.key)}
                className={`py-2 px-2 rounded-xl text-[11px] font-extrabold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                  active
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-600 border-[#EBE6DD] hover:bg-stone-100'
                }`}
              >
                <i className={`${tab.icon} text-xs`}></i>
                <span className="truncate w-full text-center">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 원클릭 샘플 퀵 칩 (Quick Chips) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
          <span className="text-[10px] font-extrabold text-stone-400 shrink-0 mr-0.5">
            원클릭 샘플:
          </span>
          <button
            type="button"
            data-screenshot-click="action"
            onClick={() => onLoadPreset('portal')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shrink-0 transition-all cursor-pointer"
          >
            🌐 베라넥스 포털
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('cafe-wifi')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shrink-0 transition-all cursor-pointer"
          >
            📶 카페 와이파이
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('biz-vcard')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shrink-0 transition-all cursor-pointer"
          >
            👤 대표 명함(vCard)
          </button>
          <button
            type="button"
            onClick={() => onLoadPreset('event-coupon')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-[#FAF8F5] border-[#EBE6DD] text-[#2D2A26] hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shrink-0 transition-all cursor-pointer"
          >
            🎁 이벤트 안내문
          </button>
        </div>

        {/* 유형별 맞춤 입력 필드 */}
        {dataType === 'url' && (
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-stone-600">
              연결할 웹사이트 주소 (URL)
            </label>
            <div className="relative">
              <i className="fas fa-globe absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs"></i>
              <input
                type="url"
                value={urlValue}
                onChange={(e) => onChangeUrl(e.target.value)}
                data-screenshot-input="https://veranex.app"
                placeholder="https://veranex.app"
                className="w-full pl-9 pr-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none transition-all"
              />
            </div>
            <p className="text-[11px] text-stone-400">
              • 유효기간이나 광고 경유 없이 입력한 주소로 즉시 연결되는 평생 무료 정적 QR코드입니다.
            </p>
          </div>
        )}

        {dataType === 'wifi' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  와이파이 이름 (SSID)
                </label>
                <input
                  type="text"
                  value={wifiValue.ssid}
                  onChange={(e) => onChangeWifi({ ...wifiValue, ssid: e.target.value })}
                  placeholder="예: VeraNex_Guest_5G"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">
                  와이파이 비밀번호
                </label>
                <input
                  type="text"
                  value={wifiValue.password}
                  onChange={(e) => onChangeWifi({ ...wifiValue, password: e.target.value })}
                  disabled={wifiValue.encryption === 'nopass'}
                  placeholder={wifiValue.encryption === 'nopass' ? '비밀번호 없음' : '비밀번호 입력'}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none disabled:opacity-50"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                  <button
                    key={enc}
                    type="button"
                    onClick={() => onChangeWifi({ ...wifiValue, encryption: enc })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                      wifiValue.encryption === enc
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                        : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-600'
                    }`}
                  >
                    {enc === 'WPA' ? 'WPA/WPA2/WPA3' : enc === 'WEP' ? 'WEP' : '암호 없음'}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wifiValue.hidden}
                  onChange={(e) => onChangeWifi({ ...wifiValue, hidden: e.target.checked })}
                  className="rounded border-stone-300 text-indigo-600"
                />
                <span>숨겨진 네트워크</span>
              </label>
            </div>
          </div>
        )}

        {dataType === 'vcard' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">이름 (성명)</label>
              <input
                type="text"
                value={vcardValue.fullName}
                onChange={(e) => onChangeVcard({ ...vcardValue, fullName: e.target.value })}
                placeholder="홍길동"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">휴대폰 번호</label>
              <input
                type="tel"
                value={vcardValue.phone}
                onChange={(e) => onChangeVcard({ ...vcardValue, phone: e.target.value })}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">소속 회사 / 기관</label>
              <input
                type="text"
                value={vcardValue.organization}
                onChange={(e) => onChangeVcard({ ...vcardValue, organization: e.target.value })}
                placeholder="VeraNex Corp."
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">직함 / 부서</label>
              <input
                type="text"
                value={vcardValue.title}
                onChange={(e) => onChangeVcard({ ...vcardValue, title: e.target.value })}
                placeholder="프로덕트 매니저"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">이메일</label>
              <input
                type="email"
                value={vcardValue.email}
                onChange={(e) => onChangeVcard({ ...vcardValue, email: e.target.value })}
                placeholder="contact@veranex.app"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">웹사이트</label>
              <input
                type="url"
                value={vcardValue.website}
                onChange={(e) => onChangeVcard({ ...vcardValue, website: e.target.value })}
                placeholder="https://veranex.app"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        )}

        {dataType === 'text' && (
          <div>
            <label className="block text-[11px] font-bold text-stone-600 mb-1">
              텍스트 · 메모 · 쿠폰 코드 입력 (한글 UTF-8 지원)
            </label>
            <textarea
              rows={3}
              value={textValue}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="스캔 시 화면에 표시할 문구, 시리얼 번호, 안내 사항을 입력하세요."
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {dataType === 'sms' && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">수신 전화번호</label>
              <input
                type="tel"
                value={smsValue.phone}
                onChange={(e) => onChangeSms({ ...smsValue, phone: e.target.value })}
                placeholder="010-1234-5678"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">자동 입력될 문자 내용</label>
              <input
                type="text"
                value={smsValue.message}
                onChange={(e) => onChangeSms({ ...smsValue, message: e.target.value })}
                placeholder="예: 이벤트 참여 신청합니다!"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        )}

        {dataType === 'email' && (
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">수신 이메일 주소</label>
                <input
                  type="email"
                  value={emailValue.email}
                  onChange={(e) => onChangeEmail({ ...emailValue, email: e.target.value })}
                  placeholder="contact@veranex.app"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-stone-600 mb-1">메일 제목</label>
                <input
                  type="text"
                  value={emailValue.subject}
                  onChange={(e) => onChangeEmail({ ...emailValue, subject: e.target.value })}
                  placeholder="제휴 문의드립니다"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">메일 본문</label>
              <input
                type="text"
                value={emailValue.body}
                onChange={(e) => onChangeEmail({ ...emailValue, body: e.target.value })}
                placeholder="안녕하세요, 관련 내용 문의드립니다."
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. 커스텀 디자인 & 로고 스튜디오 카드 */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#EBE6DD] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-[#2D2A26] flex items-center gap-1.5">
            <i className="fas fa-palette text-indigo-600"></i>
            <span>2. 컬러 · 도트 모양 · 중앙 로고 디자인</span>
          </label>
          <span className="text-[10px] font-bold text-stone-400">실시간 반영</span>
        </div>

        {/* 컬러 프리셋 칩 & 커스텀 피커 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-stone-600">컬러 테마</span>
            <div className="flex items-center gap-3 text-[11px] font-bold text-stone-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span>도트색</span>
                <input
                  type="color"
                  value={design.fgColor}
                  onChange={(e) => onUpdateDesign({ fgColor: e.target.value })}
                  className="w-5 h-5 rounded border border-[#EBE6DD] cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <span>배경색</span>
                <input
                  type="color"
                  value={design.bgColor}
                  onChange={(e) => onUpdateDesign({ bgColor: e.target.value })}
                  className="w-5 h-5 rounded border border-[#EBE6DD] cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {COLOR_PRESETS.map((preset) => {
              const isSelected =
                design.fgColor.toLowerCase() === preset.fg.toLowerCase() &&
                design.bgColor.toLowerCase() === preset.bg.toLowerCase();
              return (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => onUpdateDesign({ fgColor: preset.fg, bgColor: preset.bg })}
                  className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 border border-black/10"
                    style={{ backgroundColor: preset.fg }}
                  />
                  <span className="truncate">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 도트 모양 & 모서리 파인더 스타일 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-[11px] font-bold text-stone-600 mb-1.5">도트 모듈 스타일</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: 'square', label: '정사각형' },
                  { key: 'rounded', label: '라운드' },
                  { key: 'dots', label: '도트 원형' },
                ] as { key: DotStyle; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onUpdateDesign({ dotStyle: item.key })}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                    design.dotStyle === item.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-[#FAF8F5] text-stone-600 border-[#EBE6DD] hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-stone-600 mb-1.5">모서리(Eye) 프레임</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { key: 'square', label: '스퀘어' },
                  { key: 'rounded', label: '라운드' },
                  { key: 'circle', label: '서클형' },
                ] as { key: EyeStyle; label: string }[]
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onUpdateDesign({ eyeStyle: item.key })}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                    design.eyeStyle === item.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-[#FAF8F5] text-stone-600 border-[#EBE6DD] hover:bg-stone-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 중앙 배지 / 커스텀 로고 삽입 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-stone-600">중앙 로고 · 심볼 배지 오버레이</span>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
            >
              <i className="fas fa-upload text-[10px]"></i>
              <span>내 로고 이미지 업로드</span>
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoFileChange}
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {(
              [
                { key: 'none', label: '없음' },
                { key: 'link', label: '🔗 링크' },
                { key: 'wifi', label: '📶 WiFi' },
                { key: 'vcard', label: '👤 명함' },
                { key: 'message', label: '💬 문자' },
                { key: 'star', label: '⭐ 스타' },
              ] as { key: CenterBadgeType; label: string }[]
            ).map((badge) => (
              <button
                key={badge.key}
                type="button"
                onClick={() =>
                  onUpdateDesign({
                    centerBadge: badge.key,
                    ecLevel: badge.key === 'none' ? design.ecLevel : 'H',
                  })
                }
                className={`py-1.5 px-1 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${
                  design.centerBadge === badge.key
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                    : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-600 hover:bg-stone-100'
                }`}
              >
                {badge.label}
              </button>
            ))}
          </div>
        </div>

        {/* 해상도 및 오류 복원 레벨 설정 */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-[#EBE6DD]">
          <div>
            <span className="block text-[11px] font-bold text-stone-600 mb-1">출력 해상도 (px)</span>
            <div className="grid grid-cols-3 gap-1">
              {([512, 1024, 2048] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => onUpdateDesign({ size: sz })}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                    design.size === sz
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-600'
                  }`}
                >
                  {sz}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-[11px] font-bold text-stone-600 mb-1">오류 복원력 (ECC)</span>
            <div className="grid grid-cols-4 gap-1">
              {(['L', 'M', 'Q', 'H'] as ErrorCorrectionLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => onUpdateDesign({ ecLevel: lvl })}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer ${
                    design.ecLevel === lvl
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-800'
                      : 'bg-[#FAF8F5] border-[#EBE6DD] text-stone-600'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 인쇄용 안내 프레임 (상하단 캡션) 토글 */}
        <div className="pt-2 border-t border-[#EBE6DD] space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-bold text-[#2D2A26] flex items-center gap-1.5">
              <i className="fas fa-print text-indigo-600"></i>
              <span>인쇄용 상·하단 안내 문구 프레임 포함</span>
            </span>
            <input
              type="checkbox"
              checked={design.showFrameLabel}
              onChange={(e) => onUpdateDesign({ showFrameLabel: e.target.checked })}
              className="rounded border-stone-300 text-indigo-600 w-4 h-4 cursor-pointer"
            />
          </label>

          {design.showFrameLabel && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <input
                type="text"
                value={design.frameTitle}
                onChange={(e) => onUpdateDesign({ frameTitle: e.target.value })}
                placeholder="상단 타이틀 (예: SCAN ME / 와이파이 연결)"
                className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
              <input
                type="text"
                value={design.frameSubtitle}
                onChange={(e) => onUpdateDesign({ frameSubtitle: e.target.value })}
                placeholder="하단 안내 (예: 카메라로 스캔해 주세요)"
                className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#EBE6DD] rounded-xl text-xs font-bold text-[#2D2A26] focus:bg-white focus:border-indigo-600 outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
