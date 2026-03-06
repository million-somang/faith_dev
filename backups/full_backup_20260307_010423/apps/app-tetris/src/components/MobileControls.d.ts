import React from 'react';
interface MobileControlsProps {
    onMoveLeft: () => void;
    onMoveRight: () => void;
    onMoveDown: () => void;
    onRotate: () => void;
    onDrop: () => void;
    onPause: () => void;
    onRestart: () => void;
    isPaused: boolean;
    isGameOver: boolean;
}
declare const MobileControls: React.FC<MobileControlsProps>;
export default MobileControls;
//# sourceMappingURL=MobileControls.d.ts.map