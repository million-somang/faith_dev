import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Collapsible, CollapsibleGroup } from '@astryxdesign/core/Collapsible';
import { Divider } from '@astryxdesign/core/Divider';
import { TODO_FAQ_ITEMS } from '../constants/todoMeta';

export default function FaqSection() {
  return (
    <Card padding={4} elevation="low" className="rounded-3xl bg-white border-[#E5DDD0] space-y-4 animate-fade-in">
      <div className="space-y-1">
        <Badge
          variant="success"
          icon={<i className="fas fa-circle-question text-[9px]"></i>}
          label="FAQ · DIRECT ANSWERS"
        />
        <h2 className="text-base sm:text-lg font-black text-[#24211D]">
          자주 묻는 질문 (FAQ)
        </h2>
        <p className="text-xs text-[#6C655B]">
          DB 영구 저장, 매일·주·월·년 반복 스케줄러, 마이페이지 실시간 동기화 및 휴지통 복구 안내입니다.
        </p>
      </div>

      <Divider variant="subtle" />

      <Card padding={2} variant="muted" className="rounded-2xl">
        <CollapsibleGroup type="multiple" defaultValue={['faq-0', 'faq-1']} hasDividers>
          {TODO_FAQ_ITEMS.map((faq, idx) => (
            <Collapsible
              key={faq.question}
              value={`faq-${idx}`}
              trigger={
                <span className="text-xs sm:text-sm font-black text-[#24211D] text-left">
                  <span className="text-indigo-600 mr-1.5">Q{idx + 1}.</span>
                  {faq.question}
                </span>
              }
            >
              <p className="text-xs text-[#4D473F] leading-relaxed py-1">
                <strong className="text-emerald-700 mr-1">A.</strong>
                {faq.answer}
              </p>
            </Collapsible>
          ))}
        </CollapsibleGroup>
      </Card>
    </Card>
  );
}
