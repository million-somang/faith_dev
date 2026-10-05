import { useState } from 'react';

export default function Faq2048Tab() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            q: '2048 타일을 만든 후에도 게임을 계속 이어갈 수 있나요?',
            a: '네, 가능합니다! 베라 2048은 2048 타일을 완성하더라도 즉시 종료되지 않으며, [계속하기]를 눌러 4096, 8192, 16384 타일까지 자신의 한계에 도전하며 최고 득점을 경신할 수 있는 엔드리스 모드를 지원합니다.'
        },
        {
            q: '신규 타일은 2와 4 중 어떤 비율로 생성되나요?',
            a: '베라 2048은 오리지널 수학적 확률 규칙을 엄격히 준수하여 매 슬라이드마다 빈칸에 2가 90%, 4가 10%의 확률로 무작위 생성됩니다.'
        },
        {
            q: '모바일 환경에서 조작은 어떻게 하나요?',
            a: '화면 어디든 손가락으로 가볍게 원하는 방향으로 스와이프(밀기)하거나, 하단 가상 D-Pad 컨트롤러 버튼을 터치하여 한 손으로 정밀하게 조작할 수 있습니다.'
        },
        {
            q: '되돌리기(Undo)는 몇 번까지 가능한가요?',
            a: '1게임당 최대 3회까지 되돌릴 수 있으며, 치명적인 오작동이 발생했을 때 직전 1수 전으로 즉시 보드를 롤백합니다.'
        },
        {
            q: '게임 기록과 최고 점수는 어디에 저장되나요?',
            a: '모든 점수와 설정은 이용자의 브라우저 로컬 저장소(LocalStorage)에 100% 암호화 저장되어 서버로 유출되지 않으며, 언제든 페이지를 재방문해도 안전하게 유지됩니다.'
        }
    ];

    return (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 custom-scrollbar">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs mb-1">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <h2 className="text-sm font-black text-slate-900 tracking-tight">
                        자주 묻는 질문 (FAQ)
                    </h2>
                </div>
                <p className="text-xs text-slate-500">
                    베라 2048의 메커니즘과 플레이 규칙에 대한 공식 답변입니다.
                </p>
            </div>

            {faqs.map((faq, idx) => {
                const isOpen = openIndex === idx;
                return (
                    <div
                        key={idx}
                        className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden transition-colors"
                    >
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                            className="w-full text-left p-3.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition-colors cursor-pointer"
                        >
                            <span className="text-xs font-black text-slate-800 flex items-center gap-2">
                                <span className="text-rose-600 font-black">Q.</span>
                                {faq.q}
                            </span>
                            <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180 text-rose-500' : ''}`}></i>
                        </button>
                        {isOpen && (
                            <div className="px-3.5 pb-3.5 pt-1 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                                <p className="font-semibold text-slate-700">
                                    <span className="text-blue-600 font-black mr-1">A.</span>
                                    {faq.a}
                                </p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
