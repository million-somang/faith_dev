import { useCallback, useEffect, useRef } from 'react';
import { MiniAppLayout } from '@faithportal/mini-app-sdk';
import '@faithportal/mini-app-sdk/src/mini-app.css';
import '@fortawesome/fontawesome-free/css/all.css';

import { useJsonEditor } from './hooks/useJsonEditor';
import Toolbar from './components/Toolbar';
import EditorPanel from './components/EditorPanel';
import OutputPanel from './components/OutputPanel';
import StatusBar from './components/StatusBar';

function App() {
  const {
    jsonText,
    setJsonText,
    parsedJson,
    statusType,
    statusMessage,
    stats,
    currentIndent,
    setCurrentIndent,
    formatJson,
    minifyJson,
    autoFixJson,
    convertToYaml,
    convertToXml,
    convertToCsv,
    validateAndParse,
  } = useJsonEditor();

  const editorValueRef = useRef(jsonText);

  // 에디터 변경 시 검증
  const handleEditorChange = useCallback((value: string | undefined) => {
    const v = value ?? '';
    editorValueRef.current = v;
    setJsonText(v);
    validateAndParse(v);
  }, [setJsonText, validateAndParse]);

  // 초기 검증
  useEffect(() => {
    validateAndParse(jsonText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFormat = useCallback(() => {
    const result = formatJson();
    if (result) setJsonText(result);
  }, [formatJson, setJsonText]);

  const handleMinify = useCallback(() => {
    const result = minifyJson();
    if (result) setJsonText(result);
  }, [minifyJson, setJsonText]);

  const handleAutoFix = useCallback(() => {
    const result = autoFixJson(editorValueRef.current);
    if (result) setJsonText(result);
  }, [autoFixJson, setJsonText]);

  const handleClear = useCallback(() => {
    if (confirm('모든 내용을 지우시겠습니까?')) {
      setJsonText('');
      validateAndParse('');
    }
  }, [setJsonText, validateAndParse]);

  const handleCopy = useCallback(async () => {
    const value = editorValueRef.current;
    if (!value) {
      alert('복사할 내용이 없습니다');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
    } catch (_e) {
      alert('복사에 실패했습니다');
    }
  }, []);

  return (
    <MiniAppLayout title="JSON Studio">
      <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)', background: 'var(--bg-primary)' }}>

        {/* Toolbar */}
        <Toolbar
          onFormat={handleFormat}
          onMinify={handleMinify}
          onAutoFix={handleAutoFix}
          onClear={handleClear}
          onCopy={handleCopy}
          indent={currentIndent}
          onIndentChange={setCurrentIndent}
        />

        {/* Split Panels */}
        <div className="split-panel flex flex-1 overflow-hidden">
          {/* Left: Editor */}
          <div className="flex-1 overflow-hidden">
            <EditorPanel value={jsonText} onChange={handleEditorChange} />
          </div>

          <div className="panel-divider" />

          {/* Right: Output */}
          <div className="flex-1 overflow-hidden">
            <OutputPanel
              parsedJson={parsedJson}
              indent={currentIndent}
              onConvertYaml={convertToYaml}
              onConvertXml={convertToXml}
              onConvertCsv={convertToCsv}
            />
          </div>
        </div>

        {/* Status Bar */}
        <StatusBar
          statusType={statusType}
          statusMessage={statusMessage}
          lines={stats.lines}
          characters={stats.characters}
          sizeBytes={stats.sizeBytes}
        />
      </div>
    </MiniAppLayout>
  );
}

export default App;
