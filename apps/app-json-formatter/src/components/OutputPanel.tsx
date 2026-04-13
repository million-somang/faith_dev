import { useState } from 'react';
import TreeView from './TreeView';
import ConvertView from './ConvertView';

type TabName = 'code' | 'tree' | 'convert';

interface OutputPanelProps {
  parsedJson: unknown;
  indent: number | 'tab';
  onConvertYaml: () => string;
  onConvertXml: () => string;
  onConvertCsv: () => string;
}

export default function OutputPanel({ parsedJson, indent, onConvertYaml, onConvertXml, onConvertCsv }: OutputPanelProps) {
  const [activeTab, setActiveTab] = useState<TabName>('code');

  const tabs: { key: TabName; icon: string; label: string }[] = [
    { key: 'code', icon: 'fas fa-code', label: 'Code' },
    { key: 'tree', icon: 'fas fa-sitemap', label: 'Tree View' },
    { key: 'convert', icon: 'fas fa-exchange-alt', label: 'Convert' },
  ];

  const getIndentValue = (): string | number => indent === 'tab' ? '\t' : indent;

  const getCodeViewContent = (): string => {
    if (!parsedJson) return '// 유효한 JSON을 기다리는 중...';
    return JSON.stringify(parsedJson, null, getIndentValue());
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex px-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        {tabs.map((tab) => (
          <button key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2.5 text-sm transition-all"
                  style={{
                    borderBottom: activeTab === tab.key ? '2px solid var(--accent-blue)' : '2px solid transparent',
                    color: activeTab === tab.key ? 'var(--accent-blue)' : 'var(--text-primary)',
                    background: 'transparent',
                  }}>
            <i className={tab.icon} style={{ marginRight: 6 }} />{tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'code' && (
          <pre className="code-view whitespace-pre-wrap break-all">{getCodeViewContent()}</pre>
        )}
        {activeTab === 'tree' && (
          <TreeView data={parsedJson} />
        )}
        {activeTab === 'convert' && (
          <ConvertView
            onConvertYaml={onConvertYaml}
            onConvertXml={onConvertXml}
            onConvertCsv={onConvertCsv}
          />
        )}
      </div>
    </div>
  );
}
