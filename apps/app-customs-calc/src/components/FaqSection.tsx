import { useState } from 'react';

interface FaqItem {
    q: string;
    a: string;
}

const FAQS: FaqItem[] = [
    {
        q: '미국 직구인데 $180 어치 영양제를 샀는데 왜 세금이 나오나요?',
        a: '미국 직구의 $200 면세 혜택은 "목록통관" 품목에만 적용됩니다. 영양제, 비타민, 식품, 의약품, 기능성 화장품 등은 국민 건강 보호 목적으로 "일반통관" 대상이며, 일반통관은 구매 국가와 상관없이 총 물품가격 $150 이하만 면세됩니다. 따라서 $180 구매 시 관세 8%와 부가세 10%가 부과됩니다.'
    },
    {
        q: '면세 한도를 1달러라도 넘으면 초과한 금액에 대해서만 세금을 내나요?',
        a: '아닙니다! 면세 한도를 단 1센트라도 초과하게 되면, 초과분이 아니라 "전체 결제 금액(물품가격 + 운임)" 전액에 대해 관세와 부가세가 부과됩니다. 따라서 한도 경계선에 걸치지 않도록 주의해야 합니다.'
    },
    {
        q: '해외 배송비도 관세 계산 시 포함되나요?',
        a: '면세 한도($200 또는 $150) 판정 시에는 "순수 물품가격 + 현지 세금 + 현지 배송비"만 합산합니다. 즉, 미국 내 배송비는 포함되지만 한국으로 오는 국제 배송비는 면세 한도 판단 시 제외됩니다. 단, 면세 한도를 초과하여 과세가 확정되면 국제 배송비(관세청 고시 과세운임)까지 합산된 CIF 금액에 세금이 매겨집니다.'
    },
    {
        q: '엔화(JPY)나 유로화(EUR) 결제 시 면세 기준은 어떻게 되나요?',
        a: '관세법상 모든 면세 한도는 미화 달러($) 기준입니다. 결제하신 엔화나 유로화 금액을 관세청 고시환율로 달러($)로 환산했을 때 $150 이하인지를 판정합니다.'
    },
    {
        q: '관·부가세는 언제, 어떻게 납부하나요?',
        a: '물품이 국내 공항/항만에 도착하여 세관 심사를 마친 후, 배송대행지(몰테일, 오마이집 등) 또는 특송업체(페덱스, DHL, 우체국)로부터 카카오톡 알림톡이나 문자로 가상계좌 또는 카드로택스 납부 안내가 옵니다. 세금을 납부하셔야 세관에서 물품이 반출되어 국내 택배 배송이 시작됩니다.'
    }
];

export default function FaqSection() {
    const [openIdx, setOpenIdx] = useState<number | null>(0);

    return (
        <div className="nm-card p-6 sm:p-8 space-y-5">
            <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl nm-btn flex items-center justify-center text-indigo-600 text-sm">
                        <i className="fas fa-question-circle"></i>
                    </span>
                    해외직구 관·부가세 자주 묻는 질문 (FAQ)
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    직구 초보자부터 알뜰 직구족까지 가장 많이 묻는 통관 질문을 모았습니다.
                </p>
            </div>

            <div className="space-y-3">
                {FAQS.map((faq, idx) => {
                    const isOpen = openIdx === idx;
                    return (
                        <div key={idx} className="nm-card-sm overflow-hidden transition-all duration-200">
                            <button
                                type="button"
                                onClick={() => setOpenIdx(isOpen ? null : idx)}
                                className="w-full p-4 sm:p-4.5 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-slate-800 hover:text-indigo-600 cursor-pointer"
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono shrink-0">
                                        Q
                                    </span>
                                    {faq.q}
                                </span>
                                <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}></i>
                            </button>

                            {isOpen && (
                                <div className="p-4 pt-1 sm:p-4.5 sm:pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-200/50 bg-slate-50/50">
                                    <div className="flex items-start gap-2.5">
                                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-mono shrink-0 mt-0.5 font-bold">
                                            A
                                        </span>
                                        <p className="flex-1">{faq.a}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
