'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useAppLauncher } from '@/hooks/useAppLauncher';
import EntertainmentSubMenu from '@/components/entertainment/EntertainmentSubMenu';
import { SoftLockModal } from '@/components/common/SoftLockModal';

export default function SajuInfoPage() {
    const { user } = useAuth();
    const { launchApp } = useAppLauncher();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pillars' | 'elements' | 'faq'>('pillars');
    const [showSoftLock, setShowSoftLock] = useState(false);

    const handleStartSaju = () => {
        launchApp('/app/saju/', 'app-saju');
    };

    const handleNudgeClick = () => {
        if (!user) {
            setShowSoftLock(true);
        } else {
            router.push('/mypage');
        }
    };

    const faqItems = [
        {
            q: '태어난 시간을 정확히 모르면 어떻게 하나요?',
            a: '태어난 시간을 모르실 경우 "시간 모름"을 선택하시면 됩니다. 사주에서 가장 중요한 일주(나 자신)와 년주, 월주의 6글자를 정밀 분석하여 신뢰도 높은 오행 분포와 성향 풀이를 제공합니다.'
        },
        {
            q: '오행(목·화·토·금·수) 밸런스는 어떤 의미를 갖나요?',
            a: '사람은 저마다 타고난 기운의 비율이 다릅니다. 어떤 오행이 많고 부족한지 파악하면, 나에게 부족한 기운을 채워주는 색상, 식습관, 공간, 직업 환경을 선택하여 삶의 균형을 맞추는 데 큰 도움이 됩니다.'
        },
        {
            q: '2인 사주 궁합은 어떤 방식으로 풀이되나요?',
            a: '단순히 띠로만 비교하는 방식에서 벗어나, 두 사람의 오행 상호 보완도, 일간(日干)의 합과 충, 그리고 성향 차이를 입체적으로 분석하여 서로를 더 깊이 이해할 수 있는 실질적인 관계 조언을 드립니다.'
        },
        {
            q: '입력한 생년월일 정보가 서버에 저장되나요?',
            a: '아닙니다. 입력하신 모든 정보는 이용자의 브라우저 내에서 1회성으로 연산된 후 즉시 소멸되며, 데이터베이스에 저장되지 않아 안심하고 이용하실 수 있습니다.'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-4xl mx-auto px-4 py-8 w-full space-y-8">
                {/* 1. 히어로 섹션 */}
                <section className="bg-gradient-to-br from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden">
                    <div className="relative z-10 max-w-xl space-y-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-violet-200">
                            <i className="fas fa-yin-yang"></i> 정통 명리학 기반 무료 만세력
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black leading-tight">
                            생년월일로 푸는 나의 본질,<br />
                            베라 정통 사주팔자 & 궁합
                        </h1>
                        <p className="text-violet-100 text-xs sm:text-sm leading-relaxed">
                            사주 8글자와 오행(목·화·토·금·수)의 조화를 통해 타고난 기질과 관계의 지혜를 발견하세요.
                        </p>
                        <div className="pt-2 flex flex-wrap gap-3">
                            <button
                                onClick={handleStartSaju}
                                className="px-6 py-3.5 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                            >
                                <i className="fas fa-sparkles"></i>
                                <span>지금 바로 사주 분석 시작</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* 2. 사주 원리 탭 */}
                <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div className="flex gap-2 border-b border-slate-100 pb-3">
                        <button
                            onClick={() => setActiveTab('pillars')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'pillars' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                            사주 4기둥의 의미
                        </button>
                        <button
                            onClick={() => setActiveTab('elements')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'elements' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                            음양오행의 균형
                        </button>
                        <button
                            onClick={() => setActiveTab('faq')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === 'faq' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                        >
                            자주 묻는 질문
                        </button>
                    </div>

                    {activeTab === 'pillars' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">년주(年柱) — 뿌리와 조상운</h3>
                                <p>내가 태어난 해의 기운으로, 가문의 내력, 유년기 환경, 사회적인 대외 이미지를 나타냅니다.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">월주(月柱) — 줄기와 사회운</h3>
                                <p>내가 태어난 달의 기운으로, 부모·형제운과 청년기 환경, 직업적성 및 사회적 활동성을 좌우합니다.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">일주(日柱) — 꽃과 나 자신</h3>
                                <p>내가 태어난 날의 기운으로, 사주에서 가장 중요하며 본인의 핵심 성향과 배우자궁을 상징합니다.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">시주(時柱) — 열매와 미래운</h3>
                                <p>내가 태어난 시간의 기운으로, 자녀운, 말년의 삶과 내면의 깊은 심리 상태를 나타냅니다.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'elements' && (
                        <div className="space-y-3 text-xs text-slate-600">
                            <p className="leading-relaxed">
                                사주명리학에서 오행(木, 火, 土, 金, 水)은 우주 만물의 순환 원리입니다. 어느 한 기운이 과도하거나 부족하지 않도록 상생(相生)과 상극(相剋)의 조화를 이루는 것이 운명 개선(개운)의 핵심입니다.
                            </p>
                            <div className="grid grid-cols-5 gap-2 text-center pt-2">
                                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 font-bold">木 (나무)</div>
                                <div className="p-3 bg-rose-50 rounded-xl text-rose-800 font-bold">火 (불)</div>
                                <div className="p-3 bg-amber-50 rounded-xl text-amber-800 font-bold">土 (흙)</div>
                                <div className="p-3 bg-slate-100 rounded-xl text-slate-800 font-bold">金 (쇠)</div>
                                <div className="p-3 bg-sky-50 rounded-xl text-sky-800 font-bold">水 (물)</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'faq' && (
                        <div className="space-y-4">
                            {faqItems.map((item, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm mb-1">Q. {item.q}</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">A. {item.a}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <SoftLockModal
                isOpen={showSoftLock}
                onClose={() => setShowSoftLock(false)}
                type="saju"
            />
        </div>
    );
}
