import type { StatusType } from '../hooks/useJsonEditor';

interface StatusBarProps {
  statusType: StatusType;
  statusMessage: string;
  lines: number;
  characters: number;
  sizeBytes: number;
}

export default function StatusBar({ statusType, statusMessage, lines, characters, sizeBytes }: StatusBarProps) {
  const iconClass =
    statusType === 'success' ? 'fas fa-check-circle' :
    statusType === 'error' ? 'fas fa-exclamation-circle' :
    'fas fa-info-circle';

  const iconColor =
    statusType === 'success' ? 'var(--success-green)' :
    statusType === 'error' ? 'var(--error-red)' :
    'var(--text-primary)';

  return (
    <div className="flex justify-between items-center px-4 py-1.5 text-xs"
         style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)' }}>
      <div className="flex items-center gap-1.5">
        <i className={iconClass} style={{ color: iconColor }} />
        <span style={{ color: iconColor }}>{statusMessage}</span>
      </div>
      <div style={{ color: 'var(--text-secondary)' }}>
        Lines: {lines} | Characters: {characters} | Size: {sizeBytes} bytes
      </div>
    </div>
  );
}
