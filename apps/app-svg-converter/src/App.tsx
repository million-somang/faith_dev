import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useSvgConverter, PRESETS } from './hooks/useSvgConverter';
import DropZone from './components/DropZone';
import CompareView from './components/CompareView';
import ControlPanel from './components/ControlPanel';

function App() {
  const {
    originalUrl, svgResult, isConverting, activePreset,
    colorCount, smoothness, setColorCount, setSmoothness,
    handleFile, convertWithPreset, convertWithCustom,
    copySvg, downloadSvg,
  } = useSvgConverter();

  const handleBase64Link = () => {
    if (!svgResult) return;
    const encoded = encodeURIComponent(svgResult.substring(0, 2000));
    window.open(`/app/base64-converter/?data=${encoded}`, '_blank');
  };

  return (
    <MiniAppLayout title="Vector Studio">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)', background: 'var(--bg-primary)' }}>

        {!originalUrl ? (
          /* ===== 초기 화면: 꽉 찬 풀스크린 랜딩 ===== */
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* 배경 그라데이션 장식 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-[200px] -left-[200px] w-[500px] h-[500px] rounded-full opacity-20"
                   style={{ background: 'radial-gradient(circle, var(--accent-violet) 0%, transparent 70%)' }} />
              <div className="absolute -bottom-[150px] -right-[150px] w-[400px] h-[400px] rounded-full opacity-15"
                   style={{ background: 'radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)' }} />
            </div>

            {/* 메인 콘텐츠 */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
              {/* 히어로 텍스트 */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4"
                     style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-violet)', border: '1px solid rgba(139,92,246,0.3)' }}>
                  <i className="fas fa-shield-alt text-[10px]" /> 100% 클라이언트 처리 · 서버 전송 없음
                </div>
                <h1 className="text-3xl font-black mb-3 tracking-tight">
                  이미지를 <span style={{ color: 'var(--accent-violet)' }}>SVG 벡터</span>로 변환
                </h1>
                <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
                  PNG, JPG 래스터 이미지를 깨끗한 벡터 SVG로 즉시 변환합니다.<br/>
                  프리셋 선택 한 번으로 최적의 결과를 얻으세요.
                </p>
              </div>

              {/* 드롭존 — 넓게 */}
              <div className="w-full max-w-2xl">
                <DropZone onFile={handleFile} />
              </div>
            </div>

            {/* 하단 프리셋 카드 */}
            <div className="px-6 pb-6 relative z-10">
              <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
                {PRESETS.map(p => (
                  <div key={p.key}
                       className="rounded-2xl p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg cursor-default"
                       style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div className="text-3xl mb-3">{p.emoji}</div>
                    <div className="text-sm font-bold mb-1">{p.label}</div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.description}</div>
                  </div>
                ))}
              </div>

              {/* 지원 포맷 태그 */}
              <div className="flex items-center justify-center gap-3 mt-5">
                {['PNG', 'JPG', 'WEBP'].map(fmt => (
                  <span key={fmt} className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                    {fmt}
                  </span>
                ))}
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>→ SVG 벡터</span>
              </div>
            </div>
          </div>
        ) : (
          /* ===== 변환 화면 ===== */
          <div className="flex-1 flex flex-col gap-4 p-5 min-h-0 overflow-auto">
            {/* 상단: 새 이미지 업로드 */}
            <div className="flex-shrink-0">
              <DropZone onFile={handleFile} />
            </div>

            {/* 중앙: Before & After */}
            <CompareView originalUrl={originalUrl} svgResult={svgResult} isConverting={isConverting} />

            {/* 하단: 컨트롤 */}
            <div className="flex-shrink-0">
              <ControlPanel
                activePreset={activePreset}
                colorCount={colorCount}
                smoothness={smoothness}
                svgResult={svgResult}
                hasImage={!!originalUrl}
                onPresetSelect={convertWithPreset}
                onColorCountChange={setColorCount}
                onSmoothnessChange={setSmoothness}
                onCustomConvert={convertWithCustom}
                onCopy={copySvg}
                onDownload={downloadSvg}
                onBase64Link={handleBase64Link}
              />
            </div>
          </div>
        )}
      </div>
    </MiniAppLayout>
  );
}

export default App;
