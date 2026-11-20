import { Badge } from '@astryxdesign/core/Badge';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { HOW_TO_STEPS, KEYBOARD_SHORTCUTS } from '../constants/todoMeta';

export default function HowToGuide() {
  return (
    <Card padding={4} elevation="low" className="rounded-3xl bg-white border-[#E5DDD0] space-y-5 animate-fade-in">
      <div className="space-y-1.5">
        <Badge
          variant="info"
          icon={<i className="fas fa-book-open text-[9px]"></i>}
          label="HOW-TO GUIDE"
        />
        <h2 className="text-base sm:text-lg font-black text-[#24211D]">
          스마트 투두(TO-DO) 플래너 · 반복 루틴 3단계 가이드
        </h2>
        <p className="text-xs text-[#6C655B] leading-relaxed">
          매일·매주(요일별)·매월·매년 반복되는 습관과 업무를 DB에 안전하게 저장하고, 우선순위와 25분 집중 타이머로 하루를 가볍게 완결해 보세요.
        </p>
      </div>

      <Divider variant="subtle" />

      {/* 3단계 핵심 사용법 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {HOW_TO_STEPS.map((step) => (
          <Card
            key={step.step}
            padding={3}
            variant="muted"
            className="rounded-2xl flex flex-col justify-between gap-2.5"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                  {step.step}
                </span>
                <h3 className="text-xs sm:text-sm font-black text-[#24211D]">{step.title}</h3>
              </div>
              <p className="text-xs text-[#4D473F] leading-relaxed">{step.desc}</p>
            </div>
            <div className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-2 font-semibold">
              💡 {step.tip}
            </div>
          </Card>
        ))}
      </div>

      {/* 반복 주기 요약 & 키보드 단축키 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-2">
          <h3 className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
            <i className="fas fa-repeat text-indigo-600"></i>
            매일 · 주단위 · 월단위 · 년단위 반복 안내
          </h3>
          <ul className="text-xs text-[#4D473F] space-y-1.5 leading-relaxed">
            <li>
              <strong className="text-indigo-700">• 매일 반복:</strong> 1일(매일)부터 N일 간격까지 매일 루틴 자동 생성
            </li>
            <li>
              <strong className="text-indigo-700">• 주단위 반복:</strong> 월~일 다중 요일 선택 및 평일·주말 원클릭 프리셋
            </li>
            <li>
              <strong className="text-indigo-700">• 월단위 반복:</strong> 매월 1~31일 지정 (2월·4월 등 짧은 달은 말일로 자동 보정)
            </li>
            <li>
              <strong className="text-indigo-700">• 년단위 반복:</strong> 매년 M월 D일 기념일·연례 점검 (윤년 2/29 자동 보정)
            </li>
          </ul>
        </div>

        <div className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E5DDD0] space-y-2">
          <h3 className="text-xs sm:text-sm font-black text-[#24211D] flex items-center gap-1.5">
            <i className="fas fa-keyboard text-indigo-600"></i>
            빠른 작업을 위한 키보드 단축키
          </h3>
          <div className="space-y-1.5">
            {KEYBOARD_SHORTCUTS.map((sc) => (
              <div
                key={sc.keyLabel}
                className="flex items-center justify-between gap-2 text-[11px] bg-white px-2.5 py-1.5 rounded-xl border border-[#E5DDD0]"
              >
                <kbd className="px-2 py-0.5 rounded-md bg-[#F2EDE4] border border-[#D9D0C1] font-mono font-black text-indigo-700 text-[10px]">
                  {sc.keyLabel}
                </kbd>
                <span className="text-[#4D473F] font-medium text-right">{sc.actionLabel}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
