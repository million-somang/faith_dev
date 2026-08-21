import React, { useState } from 'react';
import { calculateCoupleMatch } from '../utils/sajuCalculator';
import type { SajuResult, CoupleMatchResult } from '../utils/sajuCalculator';

interface CoupleMatchModalProps {
    userSaju: SajuResult;
    isOpen: boolean;
    onClose: () => void;
}

export const CoupleMatchModal: React.FC<CoupleMatchModalProps> = ({ userSaju, isOpen, onClose }) => {
    const [partnerName, setPartnerName] = useState('');
    const [partnerGender, setPartnerGender] = useState<'M' | 'F'>(userSaju.basic.gender === 'M' ? 'F' : 'M');
    const [partnerBirth, setPartnerBirth] = useState('1996-07-15');
    const [partnerTime, setPartnerTime] = useState('unknown');
    const [partnerSolar, setPartnerSolar] = useState(true);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [matchResult, setMatchResult] = useState<CoupleMatchResult | null>(null);

    if (!isOpen) return null;

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerName.trim()) {
            alert('상대방의 이름을 입력해 주세요.');
            return;
        }

        setIsAnalyzing(true);
        setTimeout(() => {
            const res = calculateCoupleMatch(userSaju, partnerName.trim(), partnerGender, partnerBirth, partnerTime, partnerSolar);
            setMatchResult(res);
            setIsAnalyzing(false);
        }, 1200);
    };

    const getTierBadge = (tier: string) => {
        switch (tier) {
            case 'S': return 'bg-gradient-to-r from-amber-400 to-rose-500 text-white shadow-rose-200';
            case 'A': return 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-200';
            case 'B': return 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-emerald-200';
            default: return 'bg-gradient-to-r from-slate-500 to-gray-600 text-white shadow-slate-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">❤️</span>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">2인 정밀 사주 궁합 진단</h3>
                            <p className="text-xs text-slate-500">명리학 오행 밸런스 & 일간(日干) 케미스트리 분석</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 text-lg transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {!matchResult ? (
                    <form onSubmit={handleCalculate} className="space-y-4">
                        <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 text-xs text-indigo-900 leading-relaxed">
                            💡 <strong>{userSaju.basic.name}</strong> 님과 상대방의 사주팔자 오행을 대조하여 서로의 결핍을 채워주는 보완율과 라이프스타일 조화를 연산합니다.
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">상대방 이름</label>
                            <input
                                type="text"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                                placeholder="예: 김민지"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">성별</label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPartnerGender('M')}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${partnerGender === 'M' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        남성 👦
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPartnerGender('F')}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${partnerGender === 'F' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        여성 👧
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">양력/음력</label>
                                <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPartnerSolar(true)}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${partnerSolar ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        양력 ☀️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPartnerSolar(false)}
                                        className={`py-2 text-xs font-bold rounded-lg transition-all ${!partnerSolar ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                    >
                                        음력 🌙
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">생년월일</label>
                            <input
                                type="date"
                                value={partnerBirth}
                                onChange={(e) => setPartnerBirth(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">태어난 시간</label>
                            <select
                                value={partnerTime}
                                onChange={(e) => setPartnerTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                            >
                                <option value="unknown">태어난 시간 모름 (기본 추정)</option>
                                <option value="0">자시 (23:30 ~ 01:30)</option>
                                <option value="2">축시 (01:30 ~ 03:30)</option>
                                <option value="4">인시 (03:30 ~ 05:30)</option>
                                <option value="6">묘시 (05:30 ~ 07:30)</option>
                                <option value="8">진시 (07:30 ~ 09:30)</option>
                                <option value="10">사시 (09:30 ~ 11:30)</option>
                                <option value="12">오시 (11:30 ~ 13:30)</option>
                                <option value="14">미시 (13:30 ~ 15:30)</option>
                                <option value="16">신시 (15:30 ~ 17:30)</option>
                                <option value="18">유시 (17:30 ~ 19:30)</option>
                                <option value="20">술시 (19:30 ~ 21:30)</option>
                                <option value="22">해시 (21:30 ~ 23:30)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={isAnalyzing}
                            className="w-full py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white font-extrabold rounded-2xl shadow-lg shadow-pink-200 hover:shadow-xl transition-all transform active:scale-98 flex items-center justify-center gap-2 mt-4"
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>2인의 오행 매칭 연산 중...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨ 2인 정밀 궁합 결과 확인하기</span>
                                </>
                            )}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-5 animate-fadeIn">
                        {/* 궁합 티어 헤더 */}
                        <div className="text-center p-6 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl relative overflow-hidden">
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl"></div>
                            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase mb-3 border border-white/20 bg-white/10">
                                Match Chemistry Result
                            </div>
                            <h4 className="text-2xl font-extrabold mb-1">
                                {matchResult.person1Name} & {matchResult.person2Name}
                            </h4>
                            <p className="text-xs text-indigo-200 mb-4">{matchResult.tierTitle}</p>

                            <div className="flex items-center justify-center gap-6 my-4">
                                <div className="text-center">
                                    <div className="text-4xl font-black text-rose-400">{matchResult.totalScore}점</div>
                                    <div className="text-[11px] text-slate-400 mt-1">종합 궁합 지수</div>
                                </div>
                                <div className="h-10 w-px bg-white/20"></div>
                                <div className="text-center">
                                    <div className="text-4xl font-black text-emerald-400">{matchResult.complementRate}%</div>
                                    <div className="text-[11px] text-slate-400 mt-1">오행 보완율</div>
                                </div>
                            </div>
                        </div>

                        {/* 상세 해설 카드 */}
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                            <div>
                                <span className="text-xs font-bold text-indigo-600 block mb-1">💬 가치관 & 성격 케미스트리</span>
                                <p className="text-sm text-slate-700 leading-relaxed">{matchResult.chemistryAnalysis}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                                <span className="text-xs font-bold text-rose-600 block mb-1">❤️ 속궁합 & 친밀도 지수 ({matchResult.intimacyIndex}점)</span>
                                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden my-1.5">
                                    <div
                                        className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-700"
                                        style={{ width: `${matchResult.intimacyIndex}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="pt-3 border-t border-slate-200">
                                <span className="text-xs font-bold text-amber-600 block mb-1">⚠️ 갈등 발생 시 솔루션 팁</span>
                                <p className="text-xs text-slate-600 leading-relaxed">{matchResult.conflictAdvice}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setMatchResult(null)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                            >
                                🔄 다른 사람과 다시 보기
                            </button>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                            >
                                확인 완료
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
export default CoupleMatchModal;
