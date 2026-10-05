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
      return <span className="font-mono text-xs text-[#2A65A0] font-bold">{val}</span>;
    }
    if (typeof val === 'string') {
      return <span className="font-mono text-xs text-[#2A7545] font-semibold break-all">"{val}"</span>;
    }
    return <span className="font-mono text-xs text-[#5C554B]">{String(val)}</span>;
  };

  if (!isObject) {
    return (
      <div 
        className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#F2ECE1]/70 rounded transition-colors group text-left"
        style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
      >
        <span className="w-3 text-center text-xs text-[#A8A196] select-none">•</span>
        {dataKey !== undefined && (
          <span 
            className="font-mono text-xs font-bold text-[#8C521A] cursor-pointer hover:underline"
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
          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DFD5] text-[#7A7268] hover:text-[#2D2A26] cursor-pointer"
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
        className="flex items-center gap-1.5 py-1 px-2 hover:bg-[#F2ECE1]/80 rounded cursor-pointer transition-colors group"
        style={{ paddingLeft: `${Math.max(8, depth * 16 + 8)}px` }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="w-3 text-center text-xs text-[#7A7268] font-bold">
          {isOpen ? '▼' : '▶'}
        </span>
        {dataKey !== undefined && (
          <span 
            className="font-mono text-xs font-black text-[#6B3A0E] hover:underline"
            onClick={handleCopyPath}
            title={`클릭하여 경로 복사: ${path}`}
          >
            {dataKey}:
          </span>
        )}
        <span className="text-xs font-extrabold text-[#7A7268]">
          {isArray ? `Array[${count}]` : `Object{${count}}`}
        </span>
        <button
          onClick={handleCopyPath}
          title="경로 복사"
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E5DFD5] text-[#7A7268] hover:text-[#2D2A26] cursor-pointer"
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
      <div className="h-full flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5]">
        <div className="w-16 h-16 rounded-3xl bg-[#F0EAE1] shadow-inner flex items-center justify-center mb-4 text-3xl text-[#8C521A]">
          <i className="fa-solid fa-sitemap"></i>
        </div>
        <h3 className="text-base font-black text-[#2D2A26] mb-1.5">
          유효한 JSON 데이터가 필요합니다
        </h3>
        <p className="text-xs text-[#7A7268] max-w-xs mb-5 leading-relaxed">
          {parseError ? `구문 오류: ${parseError}` : '포맷터 탭에서 유효한 JSON을 입력하거나 예제 데이터를 불러오세요.'}
        </p>
        <div className="flex items-center gap-2.5">
          <button
            onClick={onGoToFormatter}
            className="px-4 py-2.5 rounded-xl bg-[#2D2A26] text-[#FAF8F5] text-xs font-bold shadow-md hover:bg-black transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-pen-to-square mr-1.5"></i>
            포맷터로 이동
          </button>
          <button
            onClick={() => onLoadPreset('유저 프로필')}
            className="px-4 py-2.5 rounded-xl bg-[#F5F2EB] border border-[#E0D9CC] text-[#2D2A26] text-xs font-bold shadow-2xs hover:bg-[#EBE5DA] transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-wand-magic-sparkles mr-1.5 text-amber-600"></i>
            예제 데이터 로드
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex-1 min-h-0 flex flex-col justify-between p-3 gap-2 overflow-hidden bg-[#FAF8F5]">
      {/* Zone 1: Action Header (shrink-0) */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#E0D9CC] shadow-2xs flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-black text-[#2D2A26]">인터랙티브 노드 트리</span>
          <span className="text-[10px] text-[#8C8479] hidden sm:inline">(클릭하여 탐색)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExpandAll}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E0D9CD] text-[#554E44] hover:bg-[#EBE5DA] transition-colors shadow-2xs cursor-pointer"
          >
            <i className="fa-solid fa-angles-down mr-1 text-[10px] text-amber-600"></i>모두 펼치기
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E0D9CD] text-[#554E44] hover:bg-[#EBE5DA] transition-colors shadow-2xs cursor-pointer"
          >
            <i className="fa-solid fa-angles-up mr-1 text-[10px] text-amber-600"></i>모두 접기
          </button>
        </div>
      </div>

      {/* Zone 2: Flexible Full-Height Tree Workspace */}
      <div className="bg-white rounded-2xl border border-[#E0D9CC] shadow-2xs flex-1 min-h-[300px] p-3 overflow-y-auto font-mono text-xs select-text">
        <div className="p-2" key={expandToggleKey}>
          <TreeNode
            dataKey="root"
            value={parsedData}
            depth={0}
            path=""
            defaultExpanded={defaultExpand}
          />
        </div>
      </div>

      {/* Zone 3: Bottom Summary Dock (shrink-0) */}
      <div className="bg-white rounded-2xl p-2.5 border border-[#E0D9CC] shadow-2xs flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E0D9CC] text-[#635B50]">
            루트 타입: {Array.isArray(parsedData) ? 'Array' : typeof parsedData === 'object' ? 'Object' : typeof parsedData}
          </span>
          <span className="text-[11px] font-semibold text-[#7A7369]">
            {Array.isArray(parsedData) ? `${parsedData.length}개 원소` : `${Object.keys(parsedData || {}).length}개 루트 속성`}
          </span>
        </div>
        <button
          onClick={onGoToFormatter}
          className="text-amber-800 hover:text-amber-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
        >
          <i className="fa-solid fa-pen-to-square text-[10px]"></i>
          <span>소스 편집으로 돌아가기</span>
        </button>
      </div>
    </div>
  );
};
