import React from 'react';

export const VacationTipsTab: React.FC = () => {
  const tips = [
    {
      icon: 'fa-calendar-day',
      title: '화요일/목요일 공휴일 샌드위치 공략법',
      tag: '가성비 극대화',
      desc: '화요일이나 목요일이 공휴일일 때 월요일 또는 금요일 단 1일만 연차를 신청하면 주말을 포함해 즉시 4일 연속 황금연휴가 완성됩니다. 단 하루로 제주도나 일본 등 단거리 해외여행이 가능합니다.',
    },
    {
      icon: 'fa-plane-departure',
      title: '금요일 vs 월요일 연차 효율 비교',
      tag: '여행 경비 절감',
      desc: '항공권 및 숙박비는 보통 목요일 저녁 출발 ~ 일요일 귀국보다 일요일 출발 ~ 화요일 귀국이 최대 30~40% 저렴합니다. 인파를 피하고 예산을 아끼려면 월요일 연차를 활용한 일-월-화 여행을 추천합니다.',
    },
    {
      icon: 'fa-scale-balanced',
      title: '근로기준법 제60조 연차 소멸 시효 주의',
      tag: '법적 권리',
      desc: '발생한 연차휴가는 발생일로부터 1년간 행사하지 않으면 원칙적으로 소멸됩니다. 회사가 법정 연차사용촉진 조치를 정상적으로 완료한 경우 미사용 수당 청구권도 소멸되므로 기한 내 계획적으로 소진해야 합니다.',
    },
    {
      icon: 'fa-users',
      title: '명절 및 성수기 연차 조기 선점 노하우',
      tag: '직장 처세술',
      desc: '설날/추석 등 대형 명절 앞뒤 연차는 팀 내 동료들과 일정이 겹치기 쉽습니다. 항공권 예약 전 팀 캘린더를 확인하고 최소 2~3개월 전 사내 협의 후 연차를 먼저 올려두는 것이 안전합니다.',
    },
  ];

  return (
    <div className="space-y-3 pb-2">
      <div className="bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-2xl p-3.5 shadow-xs">
        <h4 className="font-black text-sm mb-1 flex items-center gap-1.5">
          <i className="fas fa-lightbulb text-amber-200"></i>
          스마트 직장인을 위한 연차 200% 활용 꿀팁
        </h4>
        <p className="text-xs text-white/90 font-medium leading-relaxed">
          법정 연차를 버리지 않고 가장 길고 알차게 쉴 수 있는 실전 노하우를 확인하세요.
        </p>
      </div>

      <div className="space-y-2.5">
        {tips.map((tip, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl p-3 border border-[#EBE6DD] shadow-2xs hover:shadow-xs transition-shadow"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200/80">
                {tip.tag}
              </span>
              <span className="text-[#A39C90] text-xs">
                <i className={`fas ${tip.icon}`}></i>
              </span>
            </div>
            <h5 className="font-extrabold text-xs text-[#2D2A26] mb-1 leading-snug">
              {tip.title}
            </h5>
            <p className="text-[11px] text-[#7A7369] leading-relaxed font-normal">
              {tip.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
