import { jsx as _jsx } from "react/jsx-runtime";
import { TETROMINO_SHAPES, TETROMINO_COLORS } from '../constants';
const NextPiecePreview = ({ type, blockSize = 'w-4 h-4', borderWidth = 'border-[3px]' }) => {
    const shape = TETROMINO_SHAPES[type];
    const color = TETROMINO_COLORS[type];
    return (_jsx("div", { className: "flex items-center justify-center", children: _jsx("div", { className: "grid gap-[1px]", style: {
                gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`,
                width: 'fit-content'
            }, children: shape.map((row, rIdx) => (row.map((cell, cIdx) => (_jsx("div", { className: `${blockSize} rounded-[2px] ${cell ? color : 'bg-transparent'} ${cell ? `${borderWidth} border-t-white/60 border-l-white/40 border-b-black/60 border-r-black/40` : ''}` }, `${rIdx}-${cIdx}`))))) }) }));
};
export default NextPiecePreview;
