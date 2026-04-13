interface CompareViewProps {
  originalUrl: string | null;
  svgResult: string;
  isConverting: boolean;
}

export default function CompareView({ originalUrl, svgResult, isConverting }: CompareViewProps) {
  return (
    <div className="grid gap-4 flex-1 min-h-0" style={{ gridTemplateColumns: '1fr 1fr' }}>
      {/* 원본 */}
      <div className="compare-panel">
        <div className="panel-header">
          <i className="fas fa-image" style={{ color: 'var(--accent-blue)' }} />
          원본 이미지
        </div>
        <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {originalUrl ? (
            <img src={originalUrl} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>이미지를 업로드하세요</p>
          )}
        </div>
      </div>

      {/* SVG 결과 */}
      <div className="compare-panel">
        <div className="panel-header">
          <i className="fas fa-vector-square" style={{ color: 'var(--accent-violet)' }} />
          SVG 벡터 변환 결과
        </div>
        <div className="panel-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {isConverting ? (
            <div className="flex flex-col items-center gap-3">
              <div className="spinner" />
              <p className="text-sm font-medium" style={{ color: 'var(--accent-violet)' }}>SVG 추출 중...</p>
            </div>
          ) : svgResult ? (
            <div
              className="svg-render-container"
              dangerouslySetInnerHTML={{ __html: svgResult }}
            />
          ) : (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>변환 결과가 여기에 표시됩니다</p>
          )}
        </div>
      </div>
    </div>
  );
}
