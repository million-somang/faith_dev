import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { PageSEO } from '../components/PageSEO';
import { useAppLauncher } from '../hooks/useAppLauncher';
import EntertainmentSubMenu from '../components/EntertainmentSubMenu';

// 해시 함수 (오늘의 운세 결정론적 산출 시드용)
function getTodayHash(name: string): number {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const seed = `${name}_${todayStr}`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
}

// 오늘의 한줄 운세 리스트
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

// 오늘의 행운 방위 리스트
const DIRECTIONS = ["남동쪽 (巽)", "동쪽 (震)", "남쪽 (離)", "북서쪽 (乾)", "서쪽 (兌)", "북쪽 (坎)"];
// 오늘의 행운 색상 리스트
const COLORS = ["보라색 계열", "금색/황토색 계열", "푸른색/네이비 계열", "연두색/녹색 계열", "붉은색/로즈 계열"];

export default function EntertainmentPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { launchApp } = useAppLauncher();
    const [activeTab, setActiveTab] = useState<'all' | 'saju' | 'five' | 'healing'>('all');

    // 로그인 검증 및 라우팅 이동 가드
    const handleSajuNavigation = () => {
        if (!user) {
            alert('사주 분석 서비스는 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.');
            navigate('/login?redirect=/entertainment/saju');
        } else {
            navigate('/entertainment/saju');
        }
    };

    const handleInactiveClick = (label: string) => {
        if (!user) {
            alert('로그인 후 서비스를 확인하실 수 있습니다. 로그인 페이지로 이동합니다.');
            navigate('/login');
            return;
        }
        alert(`${label} 서비스는 현재 열심히 준비 중입니다. 곧 찾아뵙겠습니다! ✨`);
    };

    // 로그인 상태별 한줄 운세 및 팁 가동
    let fortuneText = "";
    let luckyDirection = "";
    let luckyColor = "";

    if (user && user.name) {
        const hash = getTodayHash(user.name);
        fortuneText = DAILY_FORTUNES[hash % DAILY_FORTUNES.length];
        luckyDirection = DIRECTIONS[hash % DIRECTIONS.length];
        luckyColor = COLORS[(hash + 2) % COLORS.length];
    }

    // 하단 탭 콘텐츠 데이터
    const tabContents = {
        all: [
            { title: '사주 오행 중 "木(목)"의 기운을 보완하는 방법', category: '명리학 지식', date: '오늘', author: '운세 마스터' },
            { title: '내 손에 그려진 세 줄의 비밀 - 생명선, 두뇌선, 감정선', category: '손금 가이드', date: '어제', author: 'AI 손금 연구소' },
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
            <PageSEO
                title="재미 및 운세 - FaithLink 엔터테인먼트"
                description="사주 보기, 손금 분석, 영화 감상 등 일상에 소소한 즐거움을 더하는 재미 전용 포털입니다."
                path="/entertainment"
            />
            <Header user={user} onLogout={logout} />
            
            <EntertainmentSubMenu />

            <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full space-y-8">
                
                {/* 1. 상단 섹션: 핫토픽 & 사이드 프로모션 배너 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* 좌측 3컬럼: 핫토픽 이미지 카드 영역 */}
                    <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="text-violet-600 font-black">핫토픽</span> 
                                <i className="fas fa-chevron-right text-[10px] text-slate-400"></i> 
                                <span className="text-slate-500 font-medium">뜨거운 운세와 힐링</span>
                            </h2>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-violet-600 font-black">1</span>
                                <span className="text-xs text-slate-400">/ 3</span>
                            </div>
                        </div>

                        {/* 가로 3개 슬롯 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* 슬롯 1: 무료 전통 사주 (활성 - 클릭 시 로그인 가드 적용) */}
                            <button
                                onClick={handleSajuNavigation}
                                className="group relative h-48 rounded-2xl overflow-hidden text-left bg-gradient-to-br from-violet-600 to-indigo-800 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                            >
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                                
                                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full">인기🔥</span>
                                        <i className="fas fa-yin-yang text-2xl animate-spin-slow text-violet-100"></i>
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

                            {/* 슬롯 2: AI 스마트 손금 (준비중) */}
                            <button
                                onClick={() => handleInactiveClick('AI 스마트 손금')}
                                className="group relative h-48 rounded-2xl overflow-hidden text-left bg-gradient-to-br from-slate-500 to-slate-700 text-white shadow-sm hover:opacity-95 transition-all"
                            >
                                <div className="absolute top-3 right-3 bg-slate-900/60 text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-20">
                                    준비 중 ⏳
                                </div>
                                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full">AI 분석</span>
                                        <i className="fas fa-hand-paper text-2xl text-slate-300"></i>
                                    </div>
                                    <div>
                                        <h3 className="font-black text-base leading-snug mb-1">
                                            손바닥에 그려진<br />나의 운명선 찾기
                                        </h3>
                                        <p className="text-slate-300 text-[10px] font-medium">
                                            스마트 렌즈 분석 커밍순
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* 슬롯 3: 베라 웹소설 연재관 */}
                            <button
                                onClick={() => {
                                    if (!user) {
                                        alert('웹소설 연재관은 로그인 후 이용하실 수 있습니다. 로그인 페이지로 이동합니다.');
                                        navigate('/login?redirect=/entertainment');
                                    } else {
                                        launchApp('/app/novel/', 'app-novel');
                                    }
                                }}
                                className="group relative h-48 rounded-2xl overflow-hidden text-left bg-gradient-to-br from-indigo-900 to-slate-800 text-white shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
                            >
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform"></div>
                                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                                    <div className="flex justify-between items-start">
                                        <span className="bg-white/20 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full">신규✨</span>
                                        <i className="fas fa-book-open text-2xl text-indigo-300 animate-pulse"></i>
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

                    {/* 우측 1컬럼: 세로형 프로모션 배너 */}
                    <div className="lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-sm relative overflow-hidden flex flex-col justify-between h-full min-h-[220px] lg:min-h-0">
                        <div className="absolute -top-12 -left-12 w-28 h-28 rounded-full bg-white/10 blur-lg"></div>
                        <div className="absolute -bottom-16 -right-16 w-36 h-36 rounded-full bg-indigo-500/20 blur-xl"></div>
                        
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
                            className="relative z-10 w-full py-3 bg-white text-violet-700 hover:bg-violet-50 transition-colors font-black text-xs rounded-xl shadow-sm mt-4 text-center"
                        >
                            {!user ? '로그인 후 무료 분석' : '행운 아이템 무료 진단'}
                        </button>
                    </div>
                </div>

                {/* 2. 하단 섹션: 컨텐츠 리스트 & 유저 프로필 컨트롤 박스 */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* 좌측 3컬럼: 카테고리 탭 및 주제별 추천 글 목록 */}
                    <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                        
                        {/* 카테고리 탭 목록 */}
                        <div className="flex border-b border-slate-100 pb-3 gap-2 overflow-x-auto hide-scrollbar">
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                    activeTab === 'all'
                                        ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                전체 추천
                            </button>
                            <button
                                onClick={() => setActiveTab('saju')}
                                className={`px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                    activeTab === 'saju'
                                        ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                명리학 지식
                            </button>
                            <button
                                onClick={() => setActiveTab('five')}
                                className={`px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                    activeTab === 'five'
                                        ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                오행의 기운
                            </button>
                            <button
                                onClick={() => setActiveTab('healing')}
                                className={`px-4 py-2 text-xs sm:text-sm font-black rounded-lg transition-all ${
                                    activeTab === 'healing'
                                        ? 'bg-violet-50 text-violet-700 shadow-sm border border-violet-100'
                                        : 'text-slate-500 hover:text-slate-800'
                                }`}
                            >
                                힐링 가이드
                            </button>
                        </div>

                        {/* 추천 콘텐츠 리스트 */}
                        <div className="mt-5 divide-y divide-slate-100">
                            {tabContents[activeTab].map((item, index) => (
                                <div key={index} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center group">
                                    <div className="space-y-1.5 flex-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-violet-600 bg-violet-50 px-2 py-0.5 rounded">
                                                {item.category}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">{item.date}</span>
                                        </div>
                                        <h4 className="font-extrabold text-sm sm:text-base text-slate-800 group-hover:text-violet-600 transition-colors leading-snug">
                                            {item.title}
                                        </h4>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-slate-500">{item.author}</span>
                                        <i className="fas fa-chevron-right text-xs text-slate-300 ml-2 group-hover:translate-x-1 transition-transform"></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 우측 1컬럼: 로그인 유무 시각적 분기 적용 프로필 박스 위젯 */}
                    <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between h-full min-h-[250px] transition-all">
                        
                        {/* 로그인 상태 구분 UI */}
                        {user ? (
                            // ─── A. 로그인 완료 상태 UI ───
                            <div className="flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
                                            {user.name.substring(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-black text-sm text-slate-800 flex items-center gap-1">
                                                {user.name}님 
                                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="로그인됨"></span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold">인기 이웃 멤버</div>
                                        </div>
                                    </div>

                                    {/* 📜 오늘의 한줄 운세 (신규 추가) */}
                                    <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-xs mb-3 shadow-inner">
                                        <div className="font-black text-violet-700 mb-1 flex items-center gap-1.5">
                                            <i className="fas fa-scroll"></i> 오늘의 1줄 운세
                                        </div>
                                        <p className="text-slate-600 font-bold leading-relaxed break-keep">
                                            {fortuneText}
                                        </p>
                                    </div>

                                    {/* 🧭 오늘의 길(吉)한 방향 & 행운 컬러 */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs">
                                        <div className="font-black text-slate-700 mb-1 flex items-center gap-1.5">
                                            <i className="fas fa-compass text-violet-500"></i> 오늘의 행운 코드
                                        </div>
                                        <p className="text-slate-500 font-semibold leading-relaxed">
                                            🧭 길한 방향: <span className="text-violet-600 font-bold">{luckyDirection}</span><br />
                                            🎨 행운 색상: <span className="text-violet-600 font-bold">{luckyColor}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <button
                                        onClick={handleSajuNavigation}
                                        className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 transition-colors text-white font-black text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fas fa-yin-yang"></i> 무료 전통 사주 보기
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(window.location.href);
                                            alert('재미 홈 링크가 복사되었습니다!');
                                        }}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fas fa-share-nodes text-slate-500"></i> 친구에게 공유하기
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // ─── B. 로그아웃 상태 UI (요구사항 3번) ───
                            <div className="flex flex-col h-full justify-between min-h-[220px]">
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xl mx-auto mb-3 border border-dashed border-slate-200">
                                        <i className="fas fa-lock"></i>
                                    </div>
                                    <div className="font-black text-sm text-slate-800 mb-1">로그인이 필요합니다</div>
                                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed px-2 break-keep">
                                        로그인하시면 전통 사주 감정 기능과 오늘의 한줄 운세, 행운 팁을 모두 무료로 이용하실 수 있습니다.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <button
                                        onClick={() => navigate('/login?redirect=/entertainment')}
                                        className="w-full py-3 bg-violet-600 hover:bg-violet-700 transition-colors text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                                    >
                                        <i className="fas fa-sign-in-alt"></i> 로그인하러 가기
                                    </button>
                                    <button
                                        onClick={() => navigate('/signup')}
                                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                                    >
                                        회원가입
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

            </main>
            
            <Footer />
        </div>
    );
}
