import { useState } from 'react';

interface ConvertViewProps {
  onConvertYaml: () => string;
  onConvertXml: () => string;
  onConvertCsv: () => string;
}

export default function ConvertView({ onConvertYaml, onConvertXml, onConvertCsv }: ConvertViewProps) {
  const [output, setOutput] = useState('');

  const handleConvert = (converter: () => string) => {
    const result = converter();
    setOutput(result);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button onClick={() => handleConvert(onConvertYaml)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all hover:brightness-125"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
          <i className="fas fa-file-code" /> To YAML
        </button>
        <button onClick={() => handleConvert(onConvertXml)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all hover:brightness-125"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
          <i className="fas fa-file-code" /> To XML
        </button>
        <button onClick={() => handleConvert(onConvertCsv)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-all hover:brightness-125"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
          <i className="fas fa-file-csv" /> To CSV
        </button>
      </div>
      <pre className="code-view whitespace-pre-wrap break-all">{output}</pre>
    </div>
  );
}
