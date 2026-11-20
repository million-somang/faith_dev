export type LegalDocType = 'about' | 'privacy' | 'terms' | 'contact' | null;

interface LegalFooterModalProps {
  readonly docType: LegalDocType;
  readonly onClose: () => void;
}

const DOC_CONTENT: Record<Exclude<LegalDocType, null>, { title: string; body: readonly string[] }> = {
  about: {
    title: '서비스 소개 (About VeraNex To-Do)',
    body: [
      'VeraNex 스마트 투두(TO-DO) 할일 플래너는 회원가입이나 앱 설치 없이 누구나 1초 만에 오늘의 할 일을 체계적으로 정리할 수 있도록 설계된 무료 웹 생산성 도구입니다.',
      '아이젠하워 우선순위 원칙(긴급·중요·보통)과 서브태스크 세분화, 25분 포모도로 집중 타이머를 결합했으며, 모든 연산과 데이터 저장은 100% 사용자 기기의 브라우저 로컬 메모리에서 완결됩니다.',
    ],
  },
  privacy: {
    title: '개인정보처리방침 (Privacy Policy)',
    body: [
      '1. 로컬 저장 원칙: 사용자가 입력하는 할 일 제목, 메모, 마감일, 집중 타이머 기록은 외부 서버로 일절 전송되거나 저장되지 않으며, 오직 사용자의 브라우저 LocalStorage에만 보관됩니다.',
      '2. Google AdSense 및 DART 쿠키 안내: 본 웹사이트는 구글(Google)의 애드센스 광고 서비스를 이용합니다. 구글은 사용자의 이전 방문 기록을 바탕으로 관심 기반 맞춤형 광고를 제공하기 위해 쿠키(DART 쿠키 등)를 사용할 수 있습니다. 사용자는 Google 광고 설정 페이지(https://adssettings.google.com)에서 맞춤 광고를 언제든지 거부할 수 있습니다.',
    ],
  },
  terms: {
    title: '이용약관 (Terms of Service)',
    body: [
      '본 할일 정리 도구는 개인 및 업무 생산성 보조를 위해 무료로 제공됩니다. 브라우저 캐시 삭제나 기기 초기화 시 로컬 데이터가 지워질 수 있으므로 중요한 목록은 주기적으로 [JSON 백업] 기능을 이용해 별도 저장하시기 바랍니다.',
      '서비스는 있는 그대로 제공되며, 로컬 저장소 삭제 등으로 발생한 데이터 손실에 대해 법적 책임을 부담하지 않습니다.',
    ],
  },
  contact: {
    title: '고객 문의 (Contact)',
    body: [
      '운영 주체: VeraNex (베라넥스)',
      '공식 이메일: contact@veranex.app',
      '운영 시간: 평일 09:00 ~ 18:00 (주말 및 공휴일 제외)',
      '기능 개선 제안이나 오류 제보는 위 공식 이메일 또는 VeraNex 포털 고객 문의를 통해 접수해 주시면 신속하게 답변드리겠습니다.',
    ],
  },
};

export default function LegalFooterModal({ docType, onClose }: LegalFooterModalProps) {
  if (!docType) return null;
  const content = DOC_CONTENT[docType];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2D2A26]/45 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={content.title}
    >
      <div className="bg-white rounded-3xl border border-[#EBE6DD] shadow-xl max-w-md w-full p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0EBE2] pb-3">
          <h3 className="text-sm font-black text-[#2D2A26]">{content.title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="문서 닫기"
            className="w-7 h-7 rounded-xl bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#EBE6DD] text-[#57514A] flex items-center justify-center text-xs cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="space-y-2.5 text-xs text-[#57514A] leading-relaxed">
          {content.body.map((paragraph, idx) => (
            <p key={idx}>{paragraph}</p>
          ))}
        </div>
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
