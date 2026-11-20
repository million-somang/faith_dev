import { TODO_FAQ_ITEMS } from '../constants/todoMeta';

export default function FaqSection() {
  return (
    <section
      aria-label="자주 묻는 질문"
      className="bg-white rounded-3xl p-4 sm:p-6 border border-[#EBE6DD] shadow-xs space-y-4 animate-fade-in"
    >
      <div className="space-y-1 border-b border-[#F0EBE2] pb-3">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
          <i className="fas fa-circle-question"></i> FAQ · DIRECT ANSWERS
        </span>
        <h2 className="text-base sm:text-lg font-black text-[#2D2A26]">
          자주 묻는 질문 (FAQ)
        </h2>
        <p className="text-xs text-[#6B645B]">
          데이터 보관 방식, 마이페이지 연동, 휴지통 복구 및 백업과 관련해 자주 묻는 질문입니다.
        </p>
      </div>

      <div className="space-y-2.5">
        {TODO_FAQ_ITEMS.map((faq, idx) => (
          <details
            key={faq.question}
            open={idx < 2}
            className="group bg-[#FAF8F5] border border-[#EBE6DD] rounded-2xl p-3.5 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex items-center justify-between gap-2 cursor-pointer text-xs sm:text-sm font-black text-[#2D2A26] list-none">
              <span className="flex items-center gap-2">
                <span className="text-indigo-600 font-black">Q{idx + 1}.</span>
                <span>{faq.question}</span>
              </span>
              <i className="fas fa-chevron-down text-xs text-[#948D82] group-open:rotate-180 transition-transform shrink-0"></i>
            </summary>
            <p className="mt-2.5 pt-2.5 border-t border-[#E6E0D6] text-xs text-[#57514A] leading-relaxed pl-6">
              <strong className="text-emerald-700">A. </strong>
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
