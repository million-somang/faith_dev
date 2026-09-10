import React, { useState } from 'react';

interface FaqItem {
    q: string;
    a: string;
}

export default function FaqSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs: FaqItem[] = [
        {
            q: 'WebP 파일은 어떤 브라우저와 프로그램에서 지원되나요?',
            a: '현재 Chrome, Safari, Edge, Firefox, Whale, 모바일 iOS/Android 등 전 세계 웹 브라우저의 97% 이상이 WebP를 완벽 지원합니다. 또한 포토샵, 피그마, 윈도우 뷰어에서도 기본 지원됩니다.',
        },
        {
            q: 'PNG 이미지의 투명 배경(누끼)이 그대로 유지되나요?',
            a: '네, 100% 보존됩니다. WebP는 8비트 알파 채널(투명도)을 기본 지원하여 PNG의 투명 영역을 완벽히 유지하면서도 파일 용량을 획기적으로 줄여줍니다.',
        },
        {
            q: '정말로 이미지가 서버로 전송되지 않나요?',
            a: '네, 절대 전송되지 않습니다. 본 앱은 HTML5 Canvas API를 이용하여 브라우저 자체 로컬 메모리상에서만 이미지 압축/인코딩을 수행하므로 외부 서버 업로드가 전혀 발생하지 않습니다. F12 개발자 도구의 네트워크 탭에서 업로드 트래픽이 0임을 직접 확인하실 수 있습니다.',
        },
        {
            q: '여러 장의 이미지를 한 번에 변환할 수 있나요?',
            a: '네, 드래그 앤 드롭으로 여러 파일을 한 번에 업로드할 수 있으며, 변환 완료 후 [ZIP 일괄 다운로드] 버튼을 누르면 모든 WebP 파일이 압축된 단일 ZIP 파일로 즉시 저장됩니다.',
        },
        {
            q: '압축 품질은 몇 %가 가장 적당한가요?',
            a: '일반적으로 80% 설정을 권장합니다. 육안으로는 원본과 전혀 구별되지 않으면서도 용량이 최대 75~80% 이상 줄어들어 가장 균형 잡힌 최적의 결과를 얻을 수 있습니다.',
        },
    ];

    return (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4 animate-fade-in text-xs">
            <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1">
                    <i className="fas fa-question-circle text-indigo-600"></i>
                    <span>자주 묻는 질문 (FAQ)</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                    WebP 변환 및 이미지 압축과 관련하여 궁금하신 점을 확인해 보세요.
                </p>
            </div>

            <div className="space-y-2">
                {faqs.map((faq, idx) => {
                    const isOpen = openIndex === idx;
                    return (
                        <div
                            key={idx}
                            className="border border-slate-200/90 rounded-2xl overflow-hidden transition-colors"
                        >
                            <button
                                type="button"
                                onClick={() => setOpenIndex(isOpen ? null : idx)}
                                className="w-full p-3.5 text-left font-bold text-slate-800 bg-slate-50/70 hover:bg-slate-100 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0">
                                        Q
                                    </span>
                                    <span>{faq.q}</span>
                                </span>
                                <i
                                    className={`fas fa-chevron-down text-[10px] text-slate-400 transition-transform duration-200 ${
                                        isOpen ? 'rotate-180 text-indigo-600' : ''
                                    }`}
                                ></i>
                            </button>

                            {isOpen && (
                                <div className="p-3.5 bg-white border-t border-slate-100 text-slate-600 text-[11px] leading-relaxed">
                                    {faq.a}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
