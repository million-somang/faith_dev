import React from 'react';

export default function HowToGuide() {
    return (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs text-slate-700 space-y-5 text-xs leading-relaxed animate-fade-in">
            <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-1.5">
                    <i className="fas fa-book-open text-indigo-600"></i>
                    <span>차세대 WebP 포맷 &amp; 이미지 압축 완벽 가이드</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                    구글이 개발한 고효율 이미지 규격 WebP를 활용하여 웹사이트 속도를 높이고 트래픽을 대폭 절감하는 방법을 소개합니다.
                </p>
            </div>

            <div className="space-y-3.5">
                {/* 1. WebP란 무엇인가? */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <h4 className="font-extrabold text-indigo-950 text-xs flex items-center gap-1.5">
                        <i className="fas fa-bolt text-indigo-600"></i> WebP(웹피) 포맷의 압도적인 장점
                    </h4>
                    <p className="text-slate-600 text-[11px]">
                        • <strong>용량 30%~80% 절감</strong>: 기존 JPEG 대비 동일 화질 기준 약 30~50%, PNG 대비 최대 80% 가볍습니다.<br />
                        • <strong>투명도(Alpha Channel) 완벽 지원</strong>: PNG처럼 배경이 투명한 그래픽 요소를 유지하면서 용량만 획기적으로 줄입니다.<br />
                        • <strong>구글 SEO 가산점</strong>: 구글 검색엔진 최적화(SEO) 및 코어 웹 바이탈(LCP) 지표가 즉시 개선됩니다.
                    </p>
                </div>

                {/* 2. 무손실 vs 손실 압축 원리 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <h4 className="font-extrabold text-blue-950 text-xs flex items-center gap-1.5">
                        <i className="fas fa-sliders-h text-blue-600"></i> 권장 품질(Quality) 선택 가이드
                    </h4>
                    <p className="text-slate-600 text-[11px]">
                        • <strong>80% (추천 ✨)</strong>: 육안으로 원본과 화질 차이를 구분할 수 없으면서 용량이 70% 이상 절감되는 가장 이상적인 프리셋입니다.<br />
                        • <strong>90% (고화질)</strong>: 사진 전문 포트폴리오, 인쇄용 고해상도 그래픽에 추천합니다.<br />
                        • <strong>70% (초경량)</strong>: 모바일 블로그, 빠른 로딩이 생명인 쇼핑몰 썸네일에 최적입니다.<br />
                        • <strong>100% (무손실)</strong>: 1픽셀의 데이터 손실도 허용하지 않는 벡터 변환 아이콘이나 텍스트 캡처본에 사용합니다.
                    </p>
                </div>

                {/* 3. 100% 클라이언트 로컬 처리 */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-1.5">
                    <h4 className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
                        <i className="fas fa-shield-alt text-emerald-600"></i> 서버 비용 $0 · 완벽한 프라이버시 보호
                    </h4>
                    <p className="text-slate-600 text-[11px]">
                        본 도구는 사용자의 이미지를 서버로 업로드하지 않습니다. 브라우저의 고성능 HTML5 Canvas 가속 엔진을 사용하여 사용자 PC/스마트폰의 메모리 안에서만 변환되므로, 민감한 개인 사진이나 비공개 비즈니스 문서도 안전하게 변환할 수 있습니다.
                    </p>
                </div>
            </div>
        </div>
    );
}
