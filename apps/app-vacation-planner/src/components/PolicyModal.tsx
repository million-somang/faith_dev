import React from 'react';

export type PolicyType = 'about' | 'privacy' | 'terms' | 'contact' | null;

interface PolicyModalProps {
  type: PolicyType;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ type, onClose }) => {
  if (!type) return null;

  const renderContent = () => {
    switch (type) {
      case 'about':
        return (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-black text-sm text-slate-900">베라 연차 극대화 플래너 소개</h4>
            <p>
              베라 연차 극대화 플래너(황금연휴 루팡기)는 <strong>VeraNex</strong> 직장인 라이프스타일 생산성 엔진에서 제공하는 공인 스마트 휴가 최적화 도구입니다.
            </p>
            <p>
              대한민국 관공서의 공휴일에 관한 규정 및 대체공휴일 법령을 전수 분석하여, 보유한 연차 일수를 가장 가성비 높게 소진하여 최장 연속 휴가를 만들 수 있는 황금 루트를 자동 연산합니다.
            </p>
            <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <strong>운영 표준:</strong> 2026 VeraNex Life Productivity Standard Engine<br />
              <strong>제공사:</strong> VeraNex Team
            </p>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-black text-sm text-slate-900">개인정보처리방침 (Privacy Policy)</h4>
            <p>
              본 서비스는 사용자의 개인정보 보호 및 구글 애드센스 퍼블리셔 운영 정책을 엄격히 준수합니다.
            </p>
            <div className="space-y-2">
              <h5 className="font-bold text-slate-900">1. 사용자 연차 및 일정 데이터 로컬 격리</h5>
              <p>
                사용자가 입력하는 남은 연차 일수 및 선택한 휴가 계획은 서버로 전송되지 않고 브라우저 로컬 메모리에서만 즉시 계산됩니다.
              </p>
              <h5 className="font-bold text-slate-900">2. 구글 DART 쿠키 및 제3자 광고 안내</h5>
              <p>
                본 사이트는 타사 광고 서비스(Google AdSense 등)를 통해 쿠키를 사용하여 사용자의 웹 서핑 관심사에 기반한 광고를 표시할 수 있습니다. 사용자는 Google 광고 설정에서 맞춤 광고 게재를 비활성화할 수 있습니다.
              </p>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-black text-sm text-slate-900">서비스 이용약관 (Terms of Service)</h4>
            <p>
              본 약관은 VeraNex가 제공하는 연차 극대화 플래너의 이용 조건 및 절차를 규정합니다.
            </p>
            <p>
              1. 본 서비스에서 산출되는 공휴일 및 대체휴일은 현행 법령을 기반으로 하며, 기업별 내규나 임시공휴일 지정에 따라 실제 휴무일과 차이가 있을 수 있습니다.<br />
              2. 계산 결과는 휴가 계획 수립의 참고용 가이드로 제공됩니다.<br />
              3. 알고리즘 및 소프트웨어 지식재산권은 VeraNex에 귀속됩니다.
            </p>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
            <h4 className="font-black text-sm text-slate-900">고객 지원 및 문의 (Contact Us)</h4>
            <p>
              공휴일 데이터 정정 제보, 휴가 플래너 기능 제안, 기업 복지 제휴 문의는 아래 공식 지원 창구로 연락 주시기 바랍니다.
            </p>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 font-medium">
              <div>📧 <strong>이메일:</strong> support@veranex.app</div>
              <div>🏢 <strong>운영:</strong> VeraNex 디지털 플랫폼 사업부</div>
              <div>⏰ <strong>운영 시간:</strong> 평일 10:00 ~ 18:00 (KST)</div>
            </div>
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'about': return '서비스 소개';
      case 'privacy': return '개인정보처리방침';
      case 'terms': return '이용약관';
      case 'contact': return '고객 지원 & 문의';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
          <h3 className="font-black text-base text-slate-900">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          {renderContent()}
        </div>

        <div className="pt-2 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
