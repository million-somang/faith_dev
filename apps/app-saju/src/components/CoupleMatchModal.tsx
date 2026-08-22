import React, { useState } from 'react';
import { calculateCoupleMatch } from '../utils/sajuCalculator';
import type { SajuResult, CoupleMatchResult } from '../utils/sajuCalculator';

interface CoupleMatchModalProps {
    person1?: SajuResult;
    userSaju?: SajuResult;
    isOpen: boolean;
    onClose: () => void;
}

export default function CoupleMatchModal({ person1, userSaju, isOpen, onClose }: CoupleMatchModalProps) {
    const mainUser = person1 || userSaju;
    const [partnerName, setPartnerName] = useState('');
    const [partnerGender, setPartnerGender] = useState<'M' | 'F'>(mainUser?.basic.gender === 'M' ? 'F' : 'M');
    const [partnerBirth, setPartnerBirth] = useState('1996-07-15');
    const [partnerTime, setPartnerTime] = useState('unknown');
    const [partnerSolar, setPartnerSolar] = useState(true);

    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [matchResult, setMatchResult] = useState<CoupleMatchResult | null>(null);

    if (!isOpen || !mainUser) return null;

    const handleCalculate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!partnerName.trim()) {
            alert('상대방의 이름을 입력해 주세요.');
            return;
        }

        setIsAnalyzing(true);
        setTimeout(() => {
            const res = calculateCoupleMatch(mainUser, partnerName.trim(), partnerGender, partnerBirth, partnerTime, partnerSolar);
            setMatchResult(res);
            setIsAnalyzing(false);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl border border-stone-200/80 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
                    <div>
                        <h3 className="text-lg font-serif font-bold text-stone-900">2인 정밀 사주 궁합</h3>
                        <p className="text-xs text-stone-500">두 사람의 오행 상호 보완도와 화합 지수</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {!matchResult ? (
                    <form onSubmit={handleCalculate} className="space-y-4">
                        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/60 text-xs text-stone-700 leading-relaxed">
                            <strong>{mainUser.basic.name}</strong> 님과 상대방의 사주팔자 오행을 대조하여 서로 부족한 기운을 얼마나 채워주는지 정밀하게 풀이합니다.
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">상대방 이름</label>
                            <input
                                type="text"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                                placeholder="예: 김민지"
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">성별</label>
                                <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPartnerGender('M')}
                                        className={`py-2 text-xs font-semibold rounded-lg transition-all ${partnerGender === 'M' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                    >
                                        남성
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPartnerGender('F')}
                                        className={`py-2 text-xs font-semibold rounded-lg transition-all ${partnerGender === 'F' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                    >
                                        여성
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-stone-700 mb-1">달력</label>
                                <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setPartnerSolar(true)}
                                        className={`py-2 text-xs font-semibold rounded-lg transition-all ${partnerSolar ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                    >
                                        양력
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPartnerSolar(false)}
                                        className={`py-2 text-xs font-semibold rounded-lg transition-all ${!partnerSolar ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500'}`}
                                    >
                                        음력
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">상대방 생년월일</label>
                            <input
                                type="date"
                                value={partnerBirth}
                                onChange={(e) => setPartnerBirth(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-stone-700 mb-1">태어난 시간 (선택)</label>
                            <select
                                value={partnerTime}
                                onChange={(e) => setPartnerTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-stone-300 bg-stone-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 text-sm font-medium"
                            >
                                <option value="unknown">시간 모름</option>
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
                            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] mt-2 cursor-pointer"
                        >
                            {isAnalyzing ? '궁합 데이터 연산 중...' : '궁합 풀이 보기'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {/* 결과 점수 및 티어 */}
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-2">
                            <span className="text-xs font-semibold text-slate-500">
                                {matchResult.person1Name} & {matchResult.person2Name}
                            </span>
                            <div className="text-3xl font-serif font-bold text-slate-900">
                                {matchResult.totalScore}점
                            </div>
                            <span className="inline-block px-3.5 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-2xs">
                                {matchResult.tierTitle}
                            </span>
                        </div>

                        {/* 상호 보완도 게이지 */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                                <span className="text-slate-700">오행 상호 보완율</span>
                                <span className="text-slate-900 font-mono">{matchResult.complementRate}%</span>
                            </div>
                            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                                    style={{ width: `${matchResult.complementRate}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* 상세 해설 */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2 text-xs leading-relaxed text-slate-700">
                            <strong className="text-slate-900 font-bold block">케미스트리 분석</strong>
                            <p>{matchResult.chemistryAnalysis}</p>
                        </div>

                        <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200/70 space-y-2 text-xs leading-relaxed text-amber-900">
                            <strong className="font-bold block">조화로운 관계를 위한 조언</strong>
                            <p>{matchResult.conflictAdvice}</p>
                        </div>

                        <button
                            onClick={() => setMatchResult(null)}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                        >
                            다른 사람과 다시 비교하기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
