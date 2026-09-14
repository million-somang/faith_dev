import React from 'react';

export default function OcrGuide() {
  const tips = [
    {
      icon: 'fas fa-camera',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      title: '고화질 및 명확한 초점 확보',
      desc: '흐릿하거나 저화질 이미지보다 글자의 외곽선이 뚜렷하고 픽셀 깨짐이 적은 고해상도 이미지일수록 99% 이상의 높은 정확도를 보입니다.'
    },
    {
      icon: 'fas fa-sun',
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50',
      title: '높은 명암 대비(Contrast)',
      desc: '배경색과 글자색의 명암 차이가 클수록 글자 외곽선 인식이 정밀해집니다. 어두운 배경에 흰 글자, 또는 흰 배경에 검정 글자가 최적입니다.'
    },
    {
      icon: 'fas fa-crop-simple',
      iconColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      title: '불필요한 여백 및 기울기 보정',
      desc: '사진이 심하게 회전되어 있거나 기울어진 경우 스마트폰 사진 편집기로 수평을 맞춘 뒤 텍스트 영역만 잘라내어(Crop) 올리시면 추출 속도와 정확도가 대폭 향상됩니다.'
    },
    {
      icon: 'fas fa-language',
      iconColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      title: '정확한 언어 모드 설정',
      desc: '한글과 영어가 혼용된 문서는 [한국어 + 영어], 영문 영수증이나 해외 문서는 [영어 전용]으로 설정하시면 오인식률을 현저히 줄일 수 있습니다.'
    },
    {
      icon: 'fas fa-paste',
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      title: '화면 캡처 즉시 Ctrl+V 활용',
      desc: '윈도우 캡처 도구(Win + Shift + S)나 맥 캡처로 화면의 글자를 복사한 뒤, 파일로 저장할 필요 없이 본 앱에서 곧바로 Ctrl+V를 누르면 1초 만에 추출됩니다.'
    }
  ];

  return (
    <article className="space-y-4 w-full text-slate-800 animate-fade-in">
      <header className="nm-card-sm p-4 bg-white border border-slate-200/80 space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            <i className="fas fa-book-open"></i>
          </span>
          <h2 className="text-sm font-black text-slate-900">OCR 인식률을 극대화하는 5가지 팁</h2>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tesseract.js 광학 문자 인식(OCR) 엔진의 특성을 이해하고 아래 팁을 적용하시면 영수증, 책, 문서의 글자를 완벽에 가깝게 추출할 수 있습니다.
        </p>
      </header>

      <div className="space-y-2.5">
        {tips.map((tip, idx) => (
          <section key={idx} className="nm-card-sm p-3.5 bg-white border border-slate-200/80 space-y-1">
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg ${tip.bgColor} ${tip.iconColor} flex items-center justify-center text-xs shrink-0 font-bold shadow-2xs`}>
                <i className={tip.icon}></i>
              </div>
              <h3 className="text-xs font-bold text-slate-900">{tip.title}</h3>
            </div>
            <p className="text-[11px] text-slate-600 pl-9.5 leading-relaxed">
              {tip.desc}
            </p>
          </section>
        ))}
      </div>

      <section className="nm-card-sm p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200/80 space-y-2">
        <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <i className="fas fa-shield-cat text-blue-600"></i>
          <span>보안 및 프라이버시 원칙</span>
        </h3>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          본 브라우저 OCR 도구는 구글/네이버 등 외부 클라우드 API로 사진을 전송하지 않고 사용자의 브라우저 내 WebAssembly 환경에서 전적으로 처리됩니다. 주민등록번호, 계좌번호, 계약서 등 민감한 개인정보가 담긴 서류도 안심하고 텍스트 변환하실 수 있습니다.
        </p>
      </section>
    </article>
  );
}
