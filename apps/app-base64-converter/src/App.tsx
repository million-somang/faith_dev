import { useState } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useBase64 } from './hooks/useBase64';
import TextMode from './components/TextMode';
import ImageMode from './components/ImageMode';

type ModeName = 'text' | 'image';

function App() {
  const [mode, setMode] = useState<ModeName>('text');
  const {
    input, setInput, output,
    realtimeEnabled, setRealtimeEnabled,
    urlSafe, setUrlSafe,
    jwtInfo, encode, decode, showJwtPayload, copyOutput,
    imageData, handleImageFile, getImageCopyText,
  } = useBase64();

  const tabs: { key: ModeName; icon: string; label: string }[] = [
    { key: 'text', icon: 'fas fa-font', label: '텍스트 변환' },
    { key: 'image', icon: 'fas fa-image', label: '이미지 변환' },
  ];

  return (
    <MiniAppLayout title="Base64 변환기">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)', background: 'var(--bg-primary)' }}>

        {/* Mode Tabs */}
        <div className="flex px-5" style={{ background: 'var(--bg-secondary)', borderBottom: '2px solid var(--border-color)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className="flex items-center gap-2 px-6 py-4 text-[15px] font-medium transition-all"
              style={{
                borderBottom: mode === tab.key ? '3px solid var(--accent-blue)' : '3px solid transparent',
                color: mode === tab.key ? 'var(--accent-blue)' : 'var(--text-primary)',
                background: 'transparent',
              }}
            >
              <i className={tab.icon} />{tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {mode === 'text' && (
            <TextMode
              input={input}
              onInputChange={setInput}
              output={output}
              realtimeEnabled={realtimeEnabled}
              onRealtimeChange={setRealtimeEnabled}
              urlSafe={urlSafe}
              onUrlSafeChange={setUrlSafe}
              onEncode={() => encode()}
              onDecode={decode}
              onCopy={copyOutput}
              jwtChip={
                jwtInfo ? (
                  <div className="jwt-chip" onClick={showJwtPayload}>
                    <i className="fas fa-key" />
                    <span className="hidden sm:inline">JWT 토큰 감지 - 클릭하여 Payload 보기</span>
                    <span className="sm:hidden">JWT</span>
                  </div>
                ) : null
              }
            />
          )}
          {mode === 'image' && (
            <ImageMode
              imageData={imageData}
              onImageFile={handleImageFile}
              getImageCopyText={getImageCopyText}
            />
          )}
        </div>

        {/* Privacy Badge */}
        <div className="fixed bottom-5 right-5 flex items-center gap-2 px-5 py-3 rounded-lg text-sm shadow-lg"
             style={{
               background: 'rgba(34, 197, 94, 0.1)',
               border: '1px solid rgba(34, 197, 94, 0.3)',
               color: 'var(--success-green)',
               boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
             }}>
          <i className="fas fa-shield-alt" />
          <span>100% 클라이언트 처리 - 서버 전송 0%</span>
        </div>
      </div>
    </MiniAppLayout>
  );
}

export default App;
