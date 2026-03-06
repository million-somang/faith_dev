import React from 'react';
import { TetrominoType } from '../types';
interface InfoPanelProps {
    score: number;
    level: number;
    lines: number;
    nextPieceType: TetrominoType;
    isPaused: boolean;
    isGameOver: boolean;
    onPause: () => void;
    onRestart: () => void;
}
declare const InfoPanel: React.FC<InfoPanelProps>;
export default InfoPanel;
//# sourceMappingURL=InfoPanel.d.ts.map