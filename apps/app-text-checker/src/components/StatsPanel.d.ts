import type { TextStats } from '../hooks/useTextStats';
interface StatsPanelProps {
    stats: TextStats;
    platform: 'naver' | 'jobkorea';
    setPlatform: (val: 'naver' | 'jobkorea') => void;
}
export default function StatsPanel({ stats, platform, setPlatform }: StatsPanelProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=StatsPanel.d.ts.map