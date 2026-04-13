import Editor, { type OnChange } from '@monaco-editor/react';

interface EditorPanelProps {
  value: string;
  onChange: OnChange;
}

export default function EditorPanel({ value, onChange }: EditorPanelProps) {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="json"
        value={value}
        onChange={onChange}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          folding: true,
          bracketPairColorization: { enabled: true },
          formatOnPaste: true,
          formatOnType: true,
          scrollBeyondLastLine: false,
          padding: { top: 12 },
        }}
      />
    </div>
  );
}
