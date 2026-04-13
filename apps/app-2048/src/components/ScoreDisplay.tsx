interface ScoreDisplayProps {
    score: number;
    best: number;
}

export default function ScoreDisplay({ score, best }: ScoreDisplayProps) {
    return (
        <div className="flex gap-3">
            <div className="bg-[#bbada0] px-5 py-2 rounded-lg text-center min-w-[80px]">
                <div className="text-[10px] uppercase tracking-wider text-[#eee4da] font-semibold">
                    Score
                </div>
                <div className="text-xl font-bold text-white">
                    {score.toLocaleString()}
                </div>
            </div>
            <div className="bg-[#bbada0] px-5 py-2 rounded-lg text-center min-w-[80px]">
                <div className="text-[10px] uppercase tracking-wider text-[#eee4da] font-semibold">
                    Best
                </div>
                <div className="text-xl font-bold text-white">
                    {best.toLocaleString()}
                </div>
            </div>
        </div>
    );
}
