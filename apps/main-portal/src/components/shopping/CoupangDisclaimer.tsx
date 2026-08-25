import React from 'react';

export const CoupangDisclaimer: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <aside 
            aria-label="제휴마케팅 안내"
            className={`bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-3 shadow-sm ${className}`}
        >
            <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <i className="fas fa-info text-[11px]"></i>
            </div>
            <div className="space-y-1">
                <p className="font-semibold text-slate-700">
                    공정거래위원회 제휴마케팅 안내 고지
                </p>
                <p className="leading-relaxed">
                    이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다. 구매자에게는 어떠한 추가 비용도 발생하지 않으며, 상품 가격 및 혜택은 쿠팡 공식 판매가와 동일합니다.
                </p>
            </div>
        </aside>
    );
};

export default CoupangDisclaimer;
