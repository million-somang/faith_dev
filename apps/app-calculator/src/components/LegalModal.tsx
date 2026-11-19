import type { LegalModalType } from '../types/calculator';

interface LegalModalProps {
  modalType: LegalModalType;
  onClose: () => void;
}

export function LegalModal({ modalType, onClose }: LegalModalProps) {
  if (!modalType) return null;

  const titles: Record<Exclude<LegalModalType, null>, string> = {
    about: '서비스 소개 · VeraNex 스마트 계산기',
    privacy: '개인정보처리방침 & 광고 쿠키 안내',
    terms: '이용약관 및 면책 고지',
    contact: '고객 문의 및 기술 지원',
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-[#EBE6DD] shadow-xl p-5 sm:p-6 space-y-4 text-[#2D2A26]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#EBE6DD] pb-3">
          <h3 id="legal-modal-title" className="text-sm sm:text-base font-black">
            {titles[modalType]}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-7 h-7 rounded-full bg-[#FAF8F5] hover:bg-stone-200 text-stone-500 flex items-center justify-center text-xs cursor-pointer"
          >
            <i className="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <div className="text-xs text-stone-600 leading-relaxed space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {modalType === 'about' && (
            <>
              <p>
                <strong>VeraNex 스마트 계산기</strong>는 일상 사칙연산과 공학용 삼각함수·로그·거듭제곱·팩토리얼 연산을 별도 앱 설치 없이 웹과 모바일에서 즉시 사용할 수 있도록 제작된 무료 유틸리티입니다.
              </p>
              <p>
                자체 후위 표기법(Shunting-Yard) 수식 파서와 부동소수점 보정 엔진을 채택해 위험한 동적 코드 실행 없는 안전한 환경과 높은 연산 정확도를 제공합니다.
              </p>
            </>
          )}

          {modalType === 'privacy' && (
            <>
              <p>
                <strong>1. 로컬 전용 연산 원칙</strong>: 사용자가 입력한 모든 수식, 메모리 값, 계산 히스토리는 외부 서버로 전송되지 않으며 사용자 브라우저의 로컬 저장소에만 보관됩니다.
              </p>
              <p>
                <strong>2. Google AdSense 및 DART 쿠키 안내</strong>: 본 웹사이트는 구글(Google)의 애드센스 광고 서비스를 이용할 수 있습니다. 구글은 사용자의 이전 방문 기록을 바탕으로 관심 기반 맞춤형 광고를 제공하기 위해 쿠키(DART 쿠키 등)를 사용할 수 있습니다. 사용자는 Google 광고 설정 페이지에서 맞춤 광고를 거부할 수 있습니다.
              </p>
            </>
          )}

          {modalType === 'terms' && (
            <>
              <p>
                본 계산기가 산출하는 수식 결과와 히스토리 정보는 일반적인 학습·업무 참고용으로 무료 제공됩니다.
              </p>
              <p>
                금융 계약, 세무 신고, 공학 안전 설계 등 법적·재무적 의사결정이 필요한 경우 반드시 관련 기관 및 전문가의 공식 검산을 병행하시기 바랍니다.
              </p>
            </>
          )}

          {modalType === 'contact' && (
            <>
              <p>
                서비스 오류 제보, 수식 개선 제안 및 광고/비즈니스 제휴 문의는 아래 공식 채널로 연락해 주세요.
              </p>
              <div className="bg-[#FAF8F5] rounded-2xl p-3.5 border border-[#EBE6DD] space-y-1.5 font-medium">
                <div>
                  <span className="font-black text-[#2D2A26]">운영 주체:</span> VeraNex
                </div>
                <div>
                  <span className="font-black text-[#2D2A26]">문의 이메일:</span>{' '}
                  <a
                    href="mailto:contact@veranex.app"
                    className="text-indigo-600 font-bold underline"
                  >
                    contact@veranex.app
                  </a>
                </div>
                <div>
                  <span className="font-black text-[#2D2A26]">포털 홈:</span>{' '}
                  <a
                    href="https://veranex.app"
                    target="_top"
                    rel="noopener noreferrer"
                    className="text-indigo-600 font-bold underline"
                  >
                    https://veranex.app
                  </a>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[#2D2A26] hover:bg-stone-800 text-white text-xs font-black cursor-pointer transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default LegalModal;
