export default function SvgGuide() {
  return (
    <section className="min-h-[calc(850px-140px)] bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4 animate-fade-in">
      {/* 상단 헤더 */}
      <div className="border-b border-slate-100 pb-3">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">HOW-TO & VECTOR GUIDE</span>
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <i className="fas fa-book-open text-indigo-600"></i>
          <span>SVG 벡터 변환 완벽 가이드</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          품질 저하 없는 무한 해상도 벡터 그래픽 제작과 활용 팁
        </p>
      </div>

      <div className="space-y-3 text-xs leading-relaxed text-slate-600">
        
        {/* 1. 래스터 vs 벡터 차이점 */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
            <i className="fas fa-arrows-split-up-and-left text-indigo-600"></i>
            <span>1. 비트맵(PNG/JPG) vs 벡터(SVG) 핵심 비교</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-slate-600">
            <p>
              • <strong className="text-slate-900">비트맵(PNG, JPG):</strong> 고정된 사각형 픽셀의 격자로 구성됩니다. 스마트폰 화면에서는 깨끗해 보여도 조금만 확대하거나 대형 모니터로 보면 계단 현상(블러/픽셀 깨짐)이 발생합니다.
            </p>
            <p>
              • <strong className="text-slate-900">벡터(SVG):</strong> 점과 점 사이의 수학적 공식(베지에 곡선)으로 그림을 그립니다. 10픽셀 아이콘부터 10미터 현수막까지 크기를 키워도 <strong>선명도가 100% 무한히 유지</strong>됩니다.
            </p>
          </div>
        </div>

        {/* 2. 최적 변환 프리셋 선택 팁 */}
        <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200/80 space-y-2">
          <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
            <i className="fas fa-wand-magic-sparkles text-indigo-600"></i>
            <span>2. 어떤 프리셋을 골라야 할까요?</span>
          </div>
          <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
            <li>
              <strong className="text-slate-900">단색 로고:</strong> 흑백 실루엣, 단순 도장, 서명, 단색 아이콘에 최적화되어 가장 가볍고 깔끔한 SVG 코드를 생성합니다.
            </li>
            <li>
              <strong className="text-slate-900">컬러 로고:</strong> 3~16가지 색상을 가진 기업 로고, 브랜드 심볼, 배지 등에 이상적입니다.
            </li>
            <li>
              <strong className="text-slate-900">일러스트:</strong> 복합적인 캐릭터 아트나 풍부한 색감을 가진 일러스트에 매끄러운 곡선 처리를 제공합니다.
            </li>
          </ul>
        </div>

        {/* 3. 웹 및 앱 실무 활용 팁 */}
        <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-xs">
            <i className="fas fa-code text-emerald-600"></i>
            <span>3. 개발/디자인 실무 활용 방법</span>
          </div>
          <div className="space-y-1 text-[11px] text-slate-600">
            <p>
              • <strong className="text-slate-900">인라인 SVG 삽입:</strong> [코드 복사] 후 HTML 또는 JSX에 직접 붙여넣으면 CSS `fill`, `stroke` 및 마우스 호버 모션을 마음대로 제어할 수 있습니다.
            </p>
            <p>
              • <strong className="text-slate-900">Figma / Illustrator 연동:</strong> 다운로드한 .svg 파일을 Figma나 일러스트레이터로 드래그하면 즉시 편집 가능한 레이어 패스로 분리됩니다.
            </p>
          </div>
        </div>

        {/* 4. 개인정보 보안 안내 */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-[11px]">
          <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
            <i className="fas fa-lock text-indigo-600"></i>
            <span>100% 프라이빗 클라이언트 사이드 변환</span>
          </div>
          <p className="text-slate-500">
            Vector Studio는 이미지를 외부 서버로 업로드하지 않습니다. 브라우저 내부(HTML5 Canvas & WebAssembly)에서만 로컬 연산되므로 회사 기밀 로고나 서명 이미지도 유출 걱정 없이 안전하게 변환할 수 있습니다.
          </p>
        </div>

      </div>
    </section>
  );
}
