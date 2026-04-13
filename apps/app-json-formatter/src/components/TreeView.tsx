import { useState, useCallback } from 'react';

interface TreeViewProps {
  data: unknown;
}

export default function TreeView({ data }: TreeViewProps) {
  if (!data) {
    return <div style={{ color: 'var(--text-secondary)' }}>// 유효한 JSON을 기다리는 중...</div>;
  }

  return (
    <div className="font-mono text-sm leading-relaxed">
      <TreeNode nodeKey="root" value={data} level={0} />
    </div>
  );
}

interface TreeNodeProps {
  nodeKey: string | number;
  value: unknown;
  level: number;
}

function TreeNode({ nodeKey, value, level }: TreeNodeProps) {
  const [collapsed, setCollapsed] = useState(false);
  const indent = level * 20;

  const toggle = useCallback(() => setCollapsed((prev) => !prev), []);

  if (Array.isArray(value)) {
    return (
      <div>
        <div style={{ paddingLeft: indent }}>
          <span className="tree-toggle" onClick={toggle}>{collapsed ? '▶' : '▼'}</span>
          <span className="tree-key">{String(nodeKey)}</span>
          : [<span style={{ color: 'var(--text-secondary)' }}>{value.length} items</span>]
        </div>
        {!collapsed && (
          <div>
            {value.map((item, i) => (
              <TreeNode key={i} nodeKey={i} value={item} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value as Record<string, unknown>);
    return (
      <div>
        <div style={{ paddingLeft: indent }}>
          <span className="tree-toggle" onClick={toggle}>{collapsed ? '▶' : '▼'}</span>
          <span className="tree-key">{String(nodeKey)}</span>
          : {'{'}<span style={{ color: 'var(--text-secondary)' }}>{keys.length} keys</span>{'}'}
        </div>
        {!collapsed && (
          <div>
            {keys.map((k) => (
              <TreeNode key={k} nodeKey={k} value={(value as Record<string, unknown>)[k]} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Leaf node
  const className =
    value === null ? 'tree-value-null' :
    typeof value === 'string' ? 'tree-value-string' :
    typeof value === 'number' ? 'tree-value-number' :
    typeof value === 'boolean' ? 'tree-value-boolean' : '';

  const displayValue = typeof value === 'string' ? `"${value}"` : String(value);

  return (
    <div style={{ paddingLeft: indent }}>
      <span className="tree-key">{String(nodeKey)}</span>
      : <span className={className}>{displayValue}</span>
    </div>
  );
}
