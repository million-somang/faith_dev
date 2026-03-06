import React from 'react';
import { TetrominoType } from '../types';
import { TETROMINO_SHAPES, TETROMINO_COLORS } from '../constants';

interface NextPiecePreviewProps {
    type: TetrominoType;
    blockSize?: string;
    borderWidth?: string;
}

const NextPiecePreview: React.FC<NextPiecePreviewProps> = ({
    type,
    blockSize = 'w-4 h-4',
    borderWidth = 'border-[3px]'
}) => {
    const shape = TETROMINO_SHAPES[type];
    const color = TETROMINO_COLORS[type];

    return (
        <div className="flex items-center justify-center">
            <div
                className="grid gap-[1px]"
                style={{
                    gridTemplateColumns: `repeat(${shape[0].length}, 1fr)`,
                    width: 'fit-content'
                }}
            >
                {shape.map((row, rIdx) => (
                    row.map((cell, cIdx) => (
                        <div
                            key={`${rIdx}-${cIdx}`}
                            className={`${blockSize} rounded-[2px] ${cell ? color : 'bg-transparent'} ${cell ? `${borderWidth} border-t-white/60 border-l-white/40 border-b-black/60 border-r-black/40` : ''}`}
                        />
                    ))
                ))}
            </div>
        </div>
    );
};

export default NextPiecePreview;
