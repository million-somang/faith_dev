import React, { useState } from 'react';

interface JsonTreeTabProps {
  parsedData: any;
  isValid: boolean;
  parseError: string | null;
  onGoToFormatter: () => void;
  onLoadPreset: (key: string) => void;
}

interface TreeNodeProps {
  dataKey?: string | number;
  value: any;
  depth: number;
  path: string;
  defaultExpanded?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ dataKey, value, depth, path, defaultExpanded = true }) => {
  const [isOpen, setIsOpen] = useState(depth < 2 ? defaultExpanded : false);
  const [copied, setCopied] = useState(false);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const renderValueBadge = (val: any) => {
    if (val === null) {
      return <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-[#EDE7DF] text-[#7A7268] font-bold">null</span>;
    }
    if (typeof val === 'boolean') {
      return (
        <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">
          {val ? 'true' : 'false'}
        </span>
      );
    }
    if (typeof val === 'number') {
      return <span className="font-mono text-xs text-[#2A65A0] font-semibold">{val}</span>;
    }
    if (typeof val === 'string') {
      return <span className="font-mono text-xs text-[#2A7545] break-all">"{val}"</span>;
    }
    return <span className="font-mono text-xs text-[#5C554B]">{String(val)}</span>;
  };

  if (!isObject) {
    return (
      <div 
        className="flex items-center gap-1.5 py-0.5 px-2 hover:bg-[#F2ECE1]/60 rounded transition-colors group text-left"
        style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
      >
        <span className="w-3 text-center text-xs text-[#A8A196] select-none">•</span>
        {dataKey !== undefined && (
          <span 
            className="font-mono text-xs font-semibold text-[#8C521A] cursor-pointer hover:underline"
            onClick={handleCopyPath}
            title={`클릭하여 경로 복사: ${path}`}
          >
            {dataKey}:
          </span>
        )}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {renderValueBadge(value)}
        </div>
        <button
          onClick={handleCopyPath}
          title="경로 복사"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DFD5] text-[#7A7268] hover:text-[#2D2A26]"
        >
          {copied ? '복사됨!' : '경로'}
        </button>
      </div>
    );
  }

  const entries = isArray ? value : Object.entries(value);
  const count = entries.length;

  return (
    <div className="text-left select-none">
      <div
        className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#F2ECE1]/70 rounded cursor-pointer transition-colors group"
        style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="w-3 text-center text-xs text-[#7A7268] font-bold">
          {isOpen ? '▼' : '▶'}
        </span>
        {dataKey !== undefined && (
          <span 
            className="font-mono text-xs font-bold text-[#6B3A0E] hover:underline"
            onClick={handleCopyPath}
            title={`클릭하여 경로 복사: ${path}`}
          >
            {dataKey}:
          </span>
        )}
        <span className="text-xs font-semibold text-[#7A7268]">
          {isArray ? `Array[${count}]` : `Object{${count}}`}
        </span>
        <button
          onClick={handleCopyPath}
          title="경로 복사"
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DFD5] text-[#7A7268] hover:text-[#2D2A26]"
        >
          {copied ? '복사됨!' : '경로'}
        </button>
      </div>

      {isOpen && (
        <div className="border-l border-[#E2DBD0] ml-3.5 pl-0.5">
          {entries.map((item: any, idx: number) => {
            const childKey = isArray ? idx : item[0];
            const childVal = isArray ? item : item[1];
            const childPath = isArray 
              ? `${path}[${idx}]` 
              : path ? `${path}.${childKey}` : childKey;

            return (
              <TreeNode
                key={String(childKey) + idx}
                dataKey={childKey}
                value={childVal}
                depth={depth + 1}
                path={childPath}
                defaultExpanded={defaultExpanded}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const JsonTreeTab: React.FC<JsonTreeTabProps> = ({
  parsedData,
  isValid,
  parseError,
  onGoToFormatter,
  onLoadPreset
}) => {
  const [expandToggleKey, setExpandToggleKey] = useState(0);
  const [defaultExpand, setDefaultExpand] = useState(true);

  const handleExpandAll = () => {
    setDefaultExpand(true);
    setExpandToggleKey(prev => prev + 1);
  };

  const handleCollapseAll = () => {
    setDefaultExpand(false);
    setExpandToggleKey(prev => prev + 1);
  };

  if (!isValid || parsedData === null || parsedData === undefined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F0EAE1] shadow-inner flex items-center justify-center mb-4 text-2xl text-[#8C521A]">
          <i className="fa-solid fa-sitemap"></i>
        </div>
        <h3 className="text-base font-bold text-[#2D2A26] mb-1">
          유효한 JSON 데이터가 필요합니다
        </h3>
        <p className="text-xs text-[#7A7268] max-w-xs mb-4">
          {parseError ? `구문 오류: ${parseError}` : '포맷터 탭에서 유효한 JSON을 입력하거나 예제 데이터를 불러오세요.'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={onGoToFormatter}
            className="px-4 py-2 rounded-xl bg-[#2D2A26] text-[#FAF8F5] text-xs font-bold shadow-md hover:bg-black transition-colors"
          >
            <i className="fa-solid fa-pen-to-square mr-1.5"></i>
            포맷터로 이동
          </button>
          <button
            onClick={() => onLoadPreset('profile')}
            className="px-4 py-2 rounded-xl bg-[#F5F2EB] border border-[#E5DFD5] text-[#2D2A26] text-xs font-bold shadow-sm hover:bg-[#EBE5DA] transition-colors"
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1.5"></i>
            예제 데이터 로드
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Action Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#F7F4EE] border-b border-[#E8E2D8]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-bold text-[#2D2A26]">노드 트리 브라우저</span>
          <span className="text-[10px] text-[#8C8479]">(노드 클릭 시 펼침/접힘)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpandAll}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E0D9CD] text-[#554E44] hover:bg-[#EBE5DA] transition-colors shadow-xs"
          >
            <i className="fa-solid fa-angles-down mr-1 text-[10px]"></i>모두 펼치기
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E0D9CD] text-[#554E44] hover:bg-[#EBE5DA] transition-colors shadow-xs"
          >
            <i className="fa-solid fa-angles-up mr-1 text-[10px]"></i>모두 접기
          </button>
        </div>
      </div>

      {/* Tree Content Area */}
      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-[#FAF8F5]">
        <div className="p-3 bg-[#F7F3EB] rounded-xl border border-[#E5DFD5] shadow-inner" key={expandToggleKey}>
          <TreeNode
            dataKey="root"
            value={parsedData}
            depth={0}
            path=""
            defaultExpanded={defaultExpand}
          />
        </div>
      </div>
    </div>
  );
};
