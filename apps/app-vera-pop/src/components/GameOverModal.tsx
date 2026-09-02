import React from 'react';

interface GameOverModalProps {
    score: number;
    maxCombo: number;
    onRestart: () => void;
    user: { email: string } | null;
}

export default function GameOverModal({
    score,
    maxCombo,
    onRestart,
    user,
}: GameOverModalProps) {
    // 티어 계산
    const getTier = (s: number) => {
        if (s >= 300000) return { name: '다이아몬드 (Diamond)', color: 'text-cyan-500', icon: '💎' };
        if (s >= 150000) return { name: '플래티넘 (Platinum)', color: 'text-emerald-500', icon: '👑' };
        if (s >= 80000) return { name: '골드 (Gold)', color: 'text-amber-500', icon: '🥇' };
        if (s >= 30000) return { name: '실버 (Silver)', color: 'text-slate-400', icon: '🥈' };
        return { name: '브론즈 (Bronze)', color: 'text-amber-700', icon: '🥉' };
    };

    const tier = getTier(score);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200 animate-scale-up">
                <div className="text-4xl mb-2">{tier.icon}</div>
                
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                    타임오버!
                </h2>
                <p className={`text-xs font-black ${tier.color} mb-4`}>
                    {tier.name}
                </p>

                {/* 최종 점수 박스 */}
                <div className="bg-gradient-to-br from-slate-50 to-indigo-50/40 rounded-2xl p-4 border border-slate-200/80 mb-4">
                    <span className="text-xs text-slate-400 font-bold block mb-1">최종 획득 점수</span>
                    <span className="text-3xl font-black text-indigo-700 tracking-tight stock-number">
                        {score.toLocaleString('ko-KR')}
                    </span>
                    <div className="flex justify-between items-center text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200/60 font-mono">
                        <span>최대 콤보: {maxCombo} COMBO</span>
                        <span>피버 보너스 적용</span>
                    </div>
                </div>

                {/* 소프트 락인 안내 (비로그인 사용자) */}
                {!user && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 text-left mb-4">
                        <div className="font-bold flex items-center gap-1.5 mb-0.5">
                            <span>✨</span>
                            <span>주간 명예의 전당 등록</span>
                        </div>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                            로그인하시면 내 최고 기록이 포털 주간 랭킹 Top 10에 즉시 반영됩니다.
                        </p>
                    </div>
                )}

                {/* 버튼 그룹 */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={onRestart}
                        className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                        다시 도전하기
                    </button>
                    {!user && (
                        <a
                            href="/login"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer"
                        >
                            로그인
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
