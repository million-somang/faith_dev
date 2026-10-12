'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EntertainmentSubMenu from '@/components/entertainment/EntertainmentSubMenu';

function getTodayHash(name: string): number {
    const todayStr = new Date().toISOString().slice(0, 10);
    const seed = `${name}_${todayStr}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

const DAILY_FORTUNES = [
    "뜻밖의 장소에서 반가운 귀인을 만나 꼬였던 문제가 속 시원히 해결되는 날입니다. ✨",
    "오랫동안 고민해 오던 계획을 오늘 과감히 추진하면 성공적인 결실을 맺습니다. 🏃",
    "재물운이 상승하는 기조이니, 세심하게 자산 상태를 점검하거나 투자를 공부하기 좋습니다. 💰",
    "중요한 결정을 앞두고 있다면 독단적인 판단보다는 가까운 이의 지혜를 구하세요. 🤝",
    "지친 몸과 마음에 온전한 쉼을 허락할 때입니다. 저녁 시간은 가벼운 휴식을 취하세요. 🛌",
    "말 한마디에 오해가 생길 수 있으니 대인관계에서 차분하고 따뜻한 어조를 쓰는 것이 길합니다. 🗣️",
    "새로운 배움이나 유용한 정보를 습득하여 자신을 채우기에 아주 이상적인 하루입니다. 📚",
    "뿌린 대로 거두는 날이니 성실하게 보낸 시간만큼 보람찬 성과와 신망을 얻게 됩니다. 🏆"
];

const DIRECTIONS = ["남동쪽 (巽)", "동쪽 (震)", "남쪽 (離)", "북서쪽 (乾)", "서쪽 (兌)", "북쪽 (坎)"];
const COLORS = ["보라색 계열", "금색/황토색 계열", "푸른색/네이비 계열", "연두색/녹색 계열", "붉은색/로즈 계열"];

export default function EntertainmentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'all' | 'saju' | 'five' | 'healing'>('all');

    const handleSajuNavigation = () => {
        router.push('/entertainment/saju');
    };

    let fortuneText = "";
    let luckyDirection = "";
    let luckyColor = "";

    if (user && user.name) {
        const hash = getTodayHash(user.name);
        fortuneText = DAILY_FORTUNES[hash % DAILY_FORTUNES.length];
        luckyDirection = DIRECTIONS[hash % DIRECTIONS.length];
        luckyColor = COLORS[(hash + 2) % COLORS.length];
    }

    const tabContents = {
        all: [
            { title: '사주 오행 중 "木(목)"의 기운을 보완하는 방법', category: '명리학 지식', date: '오늘', author: '운세 마스터' },
            { title: '사주 일간(日干)으로 알아보는 타고난 기질과 직무 적성', category: '명리학 지식', date: '어제', author: '명리 분석관' },
            { title: '비 오는 날 보기 좋은 마음이 따뜻해지는 클래식 영화 3선', category: '힐링 무비', date: '3일 전', author: '무비 큐레이터' }
        ],
        saju: [
            { title: '사주 일간(日干)이란 무엇이며, 왜 내 본질을 나타낼까요?', category: '명리학 지식', date: '오늘', author: '운세 마스터' },
            { title: '태어난 시간(시주)을 모르면 사주가 부정확한가요?', category: '명리학 지식', date: '5일 전', author: '운세 마스터' }
        ],
        five: [
            { title: '오행의 상생(相生)과 상극(相剋) 한눈에 이해하기', category: '오행의 기운', date: '2일 전', author: '오행 전문가' },
            { title: '내 사주에 "水(물)" 기운이 부족할 때 나타나는 기질적 변화', category: '오행의 기운', date: '1주 전', author: '오행 전문가' }
        ],
        healing: [
            { title: '지친 마음에 위로를 건네는 인생 영화 속 명대사 모음', category: '힐링 가이드', date: '3일 전', author: '무비 큐레이터' },
            { title: '명상과 함께 들으면 좋은 자연의 소리 ASMR 리스트', category: '힐링 가이드', date: '2주 전', author: '무비 큐레이터' }
        ]
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-100 font-sans">
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-8">
                {/* 1. 상단 섹션: 핫토픽 & 사이드 프로모션 배너 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="text-violet-600 font-black">핫토픽</span> 
                                <i className="fas fa-chevron-right text-[10px] text-slate-400"></i> 
                                <span className="text-slate-500 font-medium">뜨거운 운세와 힐링</span>
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 슬롯 1: 무료 전통 사주 */}
                            <button
                                onClick={handleSajuNavigation}
                                className="group relative h-48 rounded-2xl overflow-hidden text-left bg-gradient-to-br from-violet-600 to-indigo-800 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                                
                                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full">인기🔥</span>
                                        <i className="fas fa-yin-yang text-2xl text-violet-100"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base leading-snug mb-1 group-hover:text-violet-200 transition-colors">
                                            생년월일로 푸는<br />나의 전통 사주팔자
                                        </h3>
                                        <p className="text-violet-100 text-[10px] font-medium opacity-90">
                                            {!user ? '로그인 후 이용 가능' : '음양오행 균형 및 분석 시작'}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* 슬롯 2: 웹소설 연재관 */}
                            <button
                                onClick={() => {
                                    if (!user) {
                                        alert('웹소설 연재관은 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.');
                                        router.push('/login?redirect=/entertainment');
                                    } else {
                                        router.push('/entertainment/novel');
                                    }
                                }}
                                className="group relative h-48 rounded-2xl overflow-hidden text-left bg-gradient-to-br from-indigo-900 to-slate-800 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full">신규✨</span>
                                        <i className="fas fa-book-open text-2xl text-indigo-300"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base leading-snug mb-1">
                                            베라 웹소설 연재관<br />자가 출판 & 유료 연재
                                        </h3>
                                        <p className="text-indigo-200 text-[10px] font-medium">
                                            {!user ? '로그인 후 연재 및 감상' : '골드 충전 및 뷰어 연동'}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* 우측 프로모션 배너 */}
                    <div className="lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-sm relative overflow-hidden flex flex-col justify-between h-full min-h-[220px]">
                        <div className="relative z-10">
                            <span className="bg-white/20 backdrop-blur-md text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Recommendation
                            </span>
                            <h3 className="font-black text-lg mt-3 leading-snug">
                                오늘의 추천 운세<br />#나의오행보완템
                            </h3>
                            <p className="text-indigo-100 text-xs mt-2 font-medium leading-relaxed">
                                사주 오행 분석 결과를 바탕으로 나에게 꼭 필요한 색상과 행운의 방위 팁을 즉시 진단해 드립니다.
                            </p>
                        </div>
                        
                        <button
                            onClick={handleSajuNavigation}
                            className="relative z-10 w-full py-3 bg-white text-violet-700 hover:bg-violet-50 transition-colors font-black text-xs rounded-xl shadow-sm mt-4 text-center cursor-pointer"
                        >
                            {!user ? '로그인 후 무료 분석' : '행운 아이템 무료 진단'}
                        </button>
                    </div>
                </div>

                {/* 2. 오늘의 운세 & 팁 */}
                {user && fortuneText && (
                    <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-100 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-xl">🌟</span>
                            <h3 className="font-bold text-slate-900 text-base">{user.name} 님의 오늘 하루 운세</h3>
                        </div>
                        <p className="text-sm text-slate-700 font-medium mb-3">{fortuneText}</p>
                        <div className="flex gap-4 text-xs font-bold text-violet-700">
                            <span>🧭 행운의 방위: {luckyDirection}</span>
                            <span>🎨 행운의 색상: {luckyColor}</span>
                        </div>
                    </div>
                )}

                {/* 3. 카테고리 탭 콘텐츠 */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                    <div className="flex gap-2 border-b border-slate-100 pb-4 mb-4 overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'all', label: '전체' },
                            { id: 'saju', label: '사주·명리' },
                            { id: 'five', label: '오행 밸런스' },
                            { id: 'healing', label: '힐링 무비' },
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    activeTab === t.id
                                        ? 'bg-violet-600 text-white shadow-sm'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="divide-y divide-slate-100">
                        {tabContents[activeTab].map((item, idx) => (
                            <div key={idx} className="py-4 flex justify-between items-center hover:bg-slate-50 px-2 rounded-xl transition-colors">
                                <div>
                                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full mr-2">
                                        {item.category}
                                    </span>
                                    <span className="text-sm font-bold text-slate-800">{item.title}</span>
                                </div>
                                <div className="text-xs text-slate-400 flex gap-2">
                                    <span>{item.author}</span>
                                    <span>·</span>
                                    <span>{item.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
