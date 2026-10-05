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
          <div className="space-y-3 text-xs text-[#2D2A26] leading-relaxed">
            <h4 className="font-black text-sm text-[#2D2A26]">Pro JSON Studio 소개</h4>
            <p>
              Pro JSON Studio는 <strong>VeraNex</strong> 엔터프라이즈 스마트 개발자 도구 제품군에서 제공하는 공인 표준 브라우저 기반 고속 JSON 처리 유틸리티입니다.
            </p>
            <p>
              복잡하고 들여쓰기가 깨진 JSON 텍스트를 즉각 표준 포맷으로 정렬하고, 문법 에러의 라인 번호를 실시간 추적하며, 따옴표나 trailing comma 오류를 1클릭으로 복구하는 자동 수정(Auto Fix) 엔진 및 TypeScript / YAML / XML / CSV 다중 변환기를 탑재하고 있습니다.
            </p>
            <p className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EBE6DD]">
              <strong>운영 표준:</strong> 2026 VeraNex Developer Standard Utility Engine<br />
              <strong>제공사:</strong> VeraNex Team
            </p>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-3 text-xs text-[#2D2A26] leading-relaxed">
            <h4 className="font-black text-sm text-[#2D2A26]">개인정보처리방침 (Privacy Policy)</h4>
            <p>
              본 서비스는 사용자의 기밀 코드 및 데이터 프라이버시 보호, 구글 애드센스 퍼블리셔 운영 정책을 엄격히 준수합니다.
            </p>
            <div className="space-y-2">
              <h5 className="font-bold text-[#2D2A26]">1. 데이터 100% 로컬 브라우저 격리 처리</h5>
              <p>
                사용자가 에디터에 붙여넣거나 입력하는 모든 JSON, API 키, 개인 식별 데이터는 외부 서버로 일절 전송되지 않으며, 사용자 컴퓨터의 브라우저 로컬 메모리에서만 100% 안전하게 파싱 및 변환됩니다.
              </p>
              <h5 className="font-bold text-[#2D2A26]">2. 구글 DART 쿠키 및 제3자 광고 안내</h5>
              <p>
                본 사이트는 Google AdSense를 통해 타사 광고 쿠키를 사용할 수 있으며, 관심사 기반 광고가 게재될 수 있습니다. 사용자는 언제든지 브라우저 및 Google 광고 설정에서 맞춤 설정을 변경할 수 있습니다.
              </p>
            </div>
          </div>
        );
      case 'terms':
        return (
          <div className="space-y-3 text-xs text-[#2D2A26] leading-relaxed">
            <h4 className="font-black text-sm text-[#2D2A26]">서비스 이용약관 (Terms of Service)</h4>
            <p>
              본 약관은 VeraNex가 제공하는 Pro JSON Studio 웹 도구의 이용 조건 및 절차를 규정합니다.
            </p>
            <p>
              1. 본 유틸리티는 개발자 및 일반 사용자의 업무 효율을 위한 무료 서비스로 제공됩니다.<br />
              2. 비정상적인 매크로 스크래핑이나 디도스 등 서비스 안정성을 해치는 행위를 금지합니다.<br />
              3. 변환 알고리즘 및 소프트웨어 UI에 대한 지식재산권은 VeraNex에 귀속됩니다.
            </p>
          </div>
        );
      case 'contact':
        return (
          <div className="space-y-3 text-xs text-[#2D2A26] leading-relaxed">
            <h4 className="font-black text-sm text-[#2D2A26]">고객 지원 및 문의 (Contact Us)</h4>
            <p>
              JSON 파싱 오류 제보, 기능 개선 아이디어, 엔터프라이즈 B2B 연동 문의는 아래 공식 채널을 이용해 주시기 바랍니다.
            </p>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EBE6DD] space-y-1.5 font-medium">
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
      <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-[#EBE6DD] shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-[#F5F2EB] pb-3 shrink-0">
          <h3 className="font-black text-base text-[#2D2A26]">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#F5F2EB] text-[#7A7369] hover:bg-[#EBE6DD] flex items-center justify-center text-xs transition-colors cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
          {renderContent()}
        </div>

        <div className="pt-2 border-t border-[#F5F2EB] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2D2A26] text-white font-bold rounded-xl text-xs hover:bg-[#1A1816] transition-colors cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
