import React from 'react';

export function HowToGuide() {
  return (
    <section className="min-h-[calc(850px-160px)] bg-white rounded-3xl p-5 sm:p-7 border border-[#EBE6DD] shadow-xs space-y-6 animate-fade-in">
      <div className="border-b border-[#EBE6DD] pb-4">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 block mb-1">
          HOW-TO &amp; TECHNICAL SPEC
        </span>
        <h2 className="text-lg sm:text-xl font-black text-[#2D2A26] flex items-center gap-2">
          <i className="fas fa-book-open text-indigo-600"></i>
          <span>스마트 QR코드 제작 가이드 및 표준 원리</span>
        </h2>
        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
          ISO/IEC 18004 국제 표준 행렬과 Reed-Solomon 오류 복원 기술을 활용하여 스캔 인식률 100%의 고품질 QR코드를 제작하는 방법입니다.
        </p>
      </div>

      {/* 단계별 사용법 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE6DD] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              1
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#2D2A26]">용도별 템플릿 선택</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            웹사이트 링크(URL), 매장 방문객용 <strong>와이파이 자동 연결(Wi-Fi)</strong>, 스캔 즉시 연락처에 저장되는 <strong>스마트 명함(vCard)</strong>, 문자/이메일 중 원하는 탭을 선택하세요.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE6DD] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              2
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#2D2A26]">브랜드 컬러 &amp; 로고 커스텀</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            브랜드 아이덴티티에 맞춰 도트 모양(사각형·라운드·서클)과 모서리 파인더 스타일을 지정하고, 중앙에 아이콘 배지나 직접 업로드한 로고를 삽입하세요.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE6DD] space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-xs font-black flex items-center justify-center">
              3
            </span>
            <h3 className="text-xs sm:text-sm font-black text-[#2D2A26]">인쇄용 프레임 &amp; SVG 저장</h3>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            매장 안내문 부착 시 <strong>[안내 문구 프레임 표시]</strong>를 켜면 상·하단 캡션이 포함된 안내 카드로 저장되며, 현수막·명함 인쇄 시에는 깨지지 않는 <strong>SVG 벡터</strong>를 다운로드하세요.
          </p>
        </div>
      </div>

      {/* 오류 복원 수준 (Error Correction Level) 비교표 */}
      <div className="space-y-3">
        <h3 className="text-sm font-black text-[#2D2A26] flex items-center gap-2">
          <i className="fas fa-shield-halved text-emerald-600"></i>
          <span>Reed-Solomon 오류 복원 수준 (L / M / Q / H) 선택 기준</span>
        </h3>
        <div className="overflow-x-auto rounded-2xl border border-[#EBE6DD]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#2D2A26] border-b border-[#EBE6DD]">
              <tr>
                <th className="py-2.5 px-3 font-black">복원 등급</th>
                <th className="py-2.5 px-3 font-black">손상 복원율</th>
                <th className="py-2.5 px-3 font-black">권장 활용처 및 특징</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6DD] text-stone-600">
              <tr>
                <td className="py-2.5 px-3 font-bold text-[#2D2A26]">Level L (Low)</td>
                <td className="py-2.5 px-3 font-mono font-bold text-stone-700">약 7% 복원</td>
                <td className="py-2.5 px-3">긴 URL을 가장 단순하고 큼직한 격자 밀도로 표현할 때 유리 (화면 표시용)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-indigo-700">Level M (Medium)</td>
                <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">약 15% 복원</td>
                <td className="py-2.5 px-3">웹/인쇄 표준 권장값. 격자 밀도와 스캔 안정성의 균형이 가장 뛰어남</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-700">Level Q (Quartile)</td>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">약 25% 복원</td>
                <td className="py-2.5 px-3">야외 스티커, 영수증, 구겨지기 쉬운 패키지 인쇄물에 적합</td>
              </tr>
              <tr className="bg-indigo-50/40">
                <td className="py-2.5 px-3 font-black text-indigo-900">Level H (High) ✨</td>
                <td className="py-2.5 px-3 font-mono font-black text-indigo-900">약 30% 복원</td>
                <td className="py-2.5 px-3 font-medium">
                  <strong>중앙 로고/아이콘 삽입 시 자동 적용.</strong> 코드의 30%가 가려져도 즉시 스캔 인식
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 스캔 인식률 100% 보장 팁 */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 space-y-2 text-xs">
        <div className="font-black text-indigo-950 flex items-center gap-1.5">
          <i className="fas fa-circle-check text-indigo-600"></i>
          <span>스마트폰 카메라 인식률을 극대화하는 3대 핵심 규칙</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-stone-700 leading-relaxed">
          <li>
            <strong>충분한 명암 대비(Contrast Ratio 4.5:1 이상) 유지:</strong> 항상 배경색은 밝게, 전경(도트) 색상은 어둡게 설정하세요. 역전된 색상(어두운 배경 + 흰색 도트)은 일부 구형 바코드 리더기에서 인식이 지연될 수 있습니다.
          </li>
          <li>
            <strong>최소 여백(Quiet Zone) 2모듈 이상 확보:</strong> QR코드 테두리 바깥쪽에 최소 2~4칸의 여백이 있어야 카메라가 경계선을 정확히 분리합니다.
          </li>
          <li>
            <strong>데이터 길이 최적화:</strong> 명함(vCard)이나 긴 URL의 경우 꼭 필요한 필드만 입력하면 QR 격자(버전)가 작아져 소형 명함 인쇄 시에도 선명하게 스캔됩니다.
          </li>
        </ul>
      </div>
    </section>
  );
}

export default HowToGuide;
