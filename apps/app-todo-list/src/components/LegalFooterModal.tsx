import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';

export type LegalDocType = 'about' | 'privacy' | 'terms' | 'contact' | null;

interface LegalFooterModalProps {
  readonly docType: LegalDocType;
  readonly onClose: () => void;
}

const DOC_CONTENT: Record<Exclude<LegalDocType, null>, { title: string; body: readonly string[] }> = {
  about: {
    title: '서비스 소개 (About VeraNex To-Do)',
    body: [
      'VeraNex 스마트 투두(TO-DO) 할일 플래너는 Meta Astryx 디자인 시스템으로 새롭게 설계되어 매일·주단위·월단위·년단위 반복 루틴과 25분 포모도로 집중 타이머를 제공하는 생산성 도구입니다.',
      'VeraNex 회원 로그인 시 작성한 모든 할 일과 반복 이력은 안전한 DB에 영구 저장되어 마이페이지 및 여러 기기에서 실시간으로 동기화되며, 비로그인 방문자도 브라우저 로컬 모드로 즉시 체험할 수 있습니다.',
    ],
  },
  privacy: {
    title: '개인정보처리방침 (Privacy Policy)',
    body: [
      '1. 하이브리드 저장 원칙: 비로그인 상태의 할 일 데이터는 오직 사용자 브라우저의 LocalStorage에만 보관되며 외부 서버로 전송되지 않습니다. 로그인 회원의 경우 본인 계정 식별자(user_id)로 엄격하게 격리된 DB에 저장되며 타 사용자에게 절대 노출되지 않습니다.',
      '2. Soft Delete 보호: 삭제된 항목은 영구 파기 대신 휴지통에 보관되어 실수 시 1클릭 복구가 가능합니다.',
      '3. Google AdSense 및 DART 쿠키 안내: 본 서비스는 구글(Google)의 애드센스 광고 서비스를 이용할 수 있으며, 사용자는 Google 광고 설정 페이지(https://adssettings.google.com)에서 맞춤 광고를 언제든지 거부할 수 있습니다.',
    ],
  },
  terms: {
    title: '이용약관 (Terms of Service)',
    body: [
      '본 할일 정리 도구는 개인 및 업무 생산성 향상을 위해 무료로 제공됩니다. 비회원 로컬 체험 모드에서는 브라우저 캐시 삭제 시 데이터가 초기화될 수 있으므로 중요한 목록은 로그인 후 DB에 동기화하거나 [JSON 백업] 기능을 이용해 저장하시기 바랍니다.',
      '서비스는 있는 그대로 제공되며, 불가항력적 데이터 손실에 대해 법적 책임을 부담하지 않습니다.',
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
  const content = docType ? DOC_CONTENT[docType] : null;

  return (
    <Dialog
      isOpen={Boolean(docType)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={420}
      purpose="info"
      aria-label={content?.title || '법적 안내'}
    >
      {content && (
        <Layout
          header={
            <DialogHeader
              title={content.title}
              hasDivider
              onOpenChange={(open) => {
                if (!open) onClose();
              }}
            />
          }
          content={
            <LayoutContent>
              <div className="space-y-2.5 text-xs text-[#4D473F] leading-relaxed py-1">
                {content.body.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </LayoutContent>
          }
          footer={
            <LayoutFooter hasDivider>
              <div className="w-full flex justify-end">
                <Button label="확인" variant="primary" size="sm" onClick={onClose} />
              </div>
            </LayoutFooter>
          }
        />
      )}
    </Dialog>
  );
}
