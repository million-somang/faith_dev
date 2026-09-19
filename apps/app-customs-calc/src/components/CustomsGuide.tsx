export default function CustomsGuide() {
    return (
        <section className="min-h-[calc(850px-140px)] bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
            {/* 상단 헤더 */}
            <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">HOW-TO & KNOWLEDGE</span>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <i className="fas fa-book-open text-indigo-600"></i>
                    <span>해외직구 통관 가이드 & 핵심 절세 팁</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                    2026년 최신 관세법 기준 목록통관·일반통관 구분과 세금 폭탄 예방법
                </p>
            </div>

            {/* 본문 안내 카드 목록 */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
                
                {/* 1. 목록통관 vs 일반통관 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
                        <i className="fas fa-list-check text-indigo-600"></i>
                        <span>1. 목록통관 vs 일반통관 핵심 차이</span>
                    </div>
                    <div className="space-y-1.5 text-[11px] text-slate-600">
                        <p>
                            • <strong className="text-slate-900">목록통관:</strong> 송장만 확인하는 간이 절차. <strong>미국은 물품가 $200 이하, 기타 국가(중국·일본·유럽 등)는 $150 이하</strong>일 때 관세·부가세가 전액 면제됩니다. (의류, 신발, 전자제품 등 대부분의 일반 공산품)
                        </p>
                        <p>
                            • <strong className="text-slate-900">일반통관:</strong> 수입신고서를 제출하는 정밀 심사 절차. <strong>구매 국가 불문 총 물품가격 $150 이하만 면세</strong>되며, 1센트라도 넘으면 전액 과세됩니다. (영양제, 식품, 의약품, 기능성 화장품, 향수 등)
                        </p>
                    </div>
                </div>

                {/* 2. 합산과세 폭탄 방지 */}
                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs">
                        <i className="fas fa-triangle-exclamation text-rose-600"></i>
                        <span>2. 합산과세 폭탄 피하는 법</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                        각각 $150 이하로 따로 주문했더라도, <strong>국내 공항/항만에 같은 날 입항(도착)</strong>하면 두 화물의 결제 금액이 하나로 합산되어 면세 한도를 훌쩍 초과해 전액 과세됩니다.
                    </p>
                    <div className="p-2 bg-white rounded-xl border border-rose-100 text-[10px] text-rose-950 font-medium">
                        💡 <strong>예방 팁:</strong> 앞선 주문 물품이 관세청 통관 완료(반출)된 것을 확인한 후 다음 배송대행지 출고를 결제하세요.
                    </div>
                </div>

                {/* 3. 영양제 6병 제한 규정 */}
                <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
                        <i className="fas fa-capsules text-emerald-600"></i>
                        <span>3. 영양제 · 건강기능식품 6병 제한</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                        비타민, 오메가3, 프로바이오틱스 등 건강기능식품은 1인당 <strong>최대 6병까지만 자가사용 면세 통관</strong>이 허용됩니다. 7병 이상 반입 시 의사 소견서가 없으면 초과분은 <strong>전량 폐기</strong> 처분되며 수수료가 청구됩니다.
                    </p>
                </div>

                {/* 4. 전파법 1인 1대 규정 */}
                <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs">
                        <i className="fas fa-microchip text-amber-600"></i>
                        <span>4. 전자기기 전파법 1인 1대 규정</span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                        스마트폰, 태블릿, 블루투스 이어폰, PC 부품 등 무선 통신 기기는 전파인증 면제 대상으로서 <strong>개인 자가사용 1인당 동일 모델 1대</strong>만 반입할 수 있습니다. 동일 기기 2대 구매 시 통관이 불허됩니다.
                    </p>
                </div>

                {/* 5. 관세청 고시환율 안내 */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-[11px]">
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                        <i className="fas fa-circle-info text-indigo-600"></i>
                        <span>관세청 주간 고시환율이란?</span>
                    </div>
                    <p className="text-slate-500">
                        통관 시 적용되는 환율은 시중 은행 실시간 환율이 아니라 관세청이 매주 금요일 고시하여 일주일간 고정 적용하는 '과세환율'입니다. 한도 경계선($198~$199)에 걸치는 경우 환율 변동으로 과세될 위험이 있으므로 여유를 두시는 것이 안전합니다.
                    </p>
                </div>

            </div>
        </section>
    );
}
