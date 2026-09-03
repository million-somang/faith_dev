export default function CustomsGuide() {
    return (
        <div className="space-y-6">
            <div className="nm-card p-6 sm:p-8 space-y-6">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl nm-btn flex items-center justify-center text-indigo-600 text-sm">
                            <i className="fas fa-book-open"></i>
                        </span>
                        해외직구 통관 가이드 & 핵심 상식
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        복잡한 관세법과 목록통관·일반통관 기준, 세금을 줄이는 핵심 팁을 확인하세요.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 1. 목록통관 vs 일반통관 */}
                    <div className="nm-inset p-5 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
                            <i className="fas fa-list-check text-indigo-500"></i>
                            목록통관 vs 일반통관 차이점
                        </div>
                        <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                            <li>
                                <strong>목록통관:</strong> 송장(Invoice)만 확인하고 통관하는 간이 절차입니다. <strong>미국은 물품가 $200 이하, 기타 국가는 $150 이하</strong>일 때 관세·부가세가 전액 면제됩니다. (의류, 가전, 신발 등 대부분의 공산품)
                            </li>
                            <li>
                                <strong>일반통관:</strong> 관세청 수입신고서를 직접 제출하는 엄격한 절차입니다. <strong>미국/기타 국가 불문 $150 이하만 면세</strong>이며, 1달러라도 초과 시 전액 과세됩니다. (영양제, 의약품, 식품, 기능성 화장품, 향수 등)
                            </li>
                        </ul>
                    </div>

                    {/* 2. 합산과세 주의사항 */}
                    <div className="nm-inset p-5 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
                            <i className="fas fa-triangle-exclamation text-red-500"></i>
                            합산과세 폭탄 피하는 법
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            각각 $150 미만으로 여러 건을 구매했더라도, <strong>국내 입항일(공항/항만 도착일)이 같은 날</strong>이면 두 화물의 금액이 하나로 합산되어 면세 한도를 훌쩍 넘겨 관·부가세가 부과됩니다.
                        </p>
                        <div className="bg-white/80 p-2.5 rounded-xl text-[11px] text-slate-700 border border-slate-200/50">
                            💡 <strong>해결책:</strong> 앞선 주문이 국내 통관 완료(반출)된 것을 확인한 후 다음 배송대행지 출고를 요청하세요.
                        </div>
                    </div>

                    {/* 3. 영양제 및 건강기능식품 6병 제한 */}
                    <div className="nm-inset p-5 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                            <i className="fas fa-capsules text-emerald-500"></i>
                            영양제/건강기능식품 자가사용 6병 제한
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            비타민, 오메가3, 유산균 등 건강기능식품은 1인당 <strong>최대 6병</strong>까지만 반입 가능합니다. 7병 이상 구매 시 의사 처방전 및 소견서가 없으면 6병을 제외한 초과 수량은 <strong>전량 폐기</strong> 처분되며 폐기 수수료가 발생합니다.
                        </p>
                    </div>

                    {/* 4. 전파법 1인 1대 규정 */}
                    <div className="nm-inset p-5 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                            <i className="fas fa-microchip text-amber-500"></i>
                            전자기기 전파법 1인 1대 규정
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                            블루투스 기기, 스마트폰, 태블릿, PC 부품, 드론 등 무선 전파를 송수신하는 기기는 전파인증 면제 대상으로서 <strong>개인 자가사용 목적으로 모델당 1인 1대</strong>만 반입할 수 있습니다. 동일 모델 2대 이상 구매 시 통관이 불허됩니다.
                        </p>
                    </div>
                </div>

                {/* 관세청 고시환율 안내 */}
                <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 border border-slate-200/70 flex items-start gap-2.5">
                    <i className="fas fa-circle-info text-indigo-500 mt-0.5 shrink-0"></i>
                    <div>
                        <strong>관세청 주간 고시환율이란?</strong><br />
                        통관 시 적용되는 환율은 시중 은행의 실시간 매매기준율이 아니라, 관세청이 매주 금요일 전주 평균환율을 기초로 고시하여 일주일(일요일~토요일) 동안 고정 적용하는 <strong>'과세환율'</strong>입니다. 달러 환산 시 아슬아슬하게 한도 근처($198~$199)인 경우 환율 변동으로 과세될 위험이 있으니 여유를 두시는 것이 안전합니다.
                    </div>
                </div>
            </div>
        </div>
    );
}
