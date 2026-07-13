import { useState, useEffect } from 'react';
import { Header, Footer } from '@faithportal/ui';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Category = 'tech' | 'cafe' | 'studio';
type ThemeColor = 'violet' | 'emerald' | 'crimson' | 'amber';
type LayoutStyle = 'split' | 'centered' | 'cards';
type Viewport = 'mobile' | 'tablet' | 'desktop';

export default function B2BPage() {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    // 1. 빌더 설정 상태
    const [brandName, setBrandName] = useState('VeraTech');
    const [slogan, setSlogan] = useState('미래를 연결하는 클라우드 인텔리전스');
    const [category, setCategory] = useState<Category>('tech');
    const [themeColor, setThemeColor] = useState<ThemeColor>('emerald');
    const [layoutStyle, setLayoutStyle] = useState<LayoutStyle>('split');
    const [viewport, setViewport] = useState<Viewport>('desktop');

    // 2. AI 빌드 애니메이션 상태
    const [isBuilding, setIsBuilding] = useState(false);
    const [buildProgress, setBuildProgress] = useState(0);
    const [buildStepText, setBuildStepText] = useState('');
    const [isBuilt, setIsBuilt] = useState(true);

    // 3. 모달 및 액션 상태
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [showCodeAlert, setShowCodeAlert] = useState(false);

    // 로그인 검증
    useEffect(() => {
        if (!isLoading && !user) {
            navigate('/login');
        }
    }, [user, isLoading, navigate]);

    // AI 빌드 시뮬레이션
    const handleStartBuild = () => {
        setIsBuilding(true);
        setIsBuilt(false);
        setBuildProgress(0);
        setBuildStepText('AI 레이아웃 엔진 부팅 중...');

        const interval = setInterval(() => {
            setBuildProgress((prev) => {
                const next = prev + 10;
                if (next === 30) setBuildStepText('테마 팔레트 분석 및 CSS 파싱 중...');
                if (next === 60) setBuildStepText('기업 맞춤형 미디어 자산 배치 중...');
                if (next === 80) setBuildStepText('네비게이션 구조 설계 및 최적화 중...');
                if (next >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setIsBuilding(false);
                        setIsBuilt(true);
                        setBuildStepText('');
                    }, 400);
                    return 100;
                }
                return next;
            });
        }, 300);
    };

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // 테마 컬러 클래스 매핑
    const colorMap: Record<ThemeColor, { text: string; bg: string; border: string; btn: string }> = {
        violet: { text: 'text-violet-600', bg: 'bg-violet-600', border: 'border-violet-500', btn: 'bg-violet-600 hover:bg-violet-750' },
        emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', border: 'border-emerald-500', btn: 'bg-emerald-600 hover:bg-emerald-750' },
        crimson: { text: 'text-red-600', bg: 'bg-red-600', border: 'border-red-500', btn: 'bg-red-600 hover:bg-red-750' },
        amber: { text: 'text-amber-600', bg: 'bg-amber-600', border: 'border-amber-500', btn: 'bg-amber-600 hover:bg-amber-750' },
    };

    const currentColors = colorMap[themeColor];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header user={user} onLogout={logout} />

            {/* B2B 헤더 배너 */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 py-8 px-4 text-white shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <span className="bg-emerald-500/20 text-emerald-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black">
                            VERA B2B SaaS
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-center gap-2">
                            <i className="fas fa-magic"></i> AI 홈페이지 자동 제작 빌더
                        </h1>
                        <p className="text-slate-350 text-xs sm:text-sm font-medium mt-1">
                            브랜드 정보와 비즈니스 유형을 선택해 나만의 반응형 홈페이지를 실시간으로 빌드하고 배포하세요.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowDeployModal(true)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <i className="fas fa-cloud-upload-alt"></i> VERA Cloud 배포
                        </button>
                        <button 
                            onClick={() => {
                                setShowCodeAlert(true);
                                setTimeout(() => setShowCodeAlert(false), 3000);
                            }}
                            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <i className="fas fa-code"></i> 코드 다운로드
                        </button>
                    </div>
                </div>
            </div>

            {/* 메인 빌더 작업공간 */}
            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* 1. 좌측 조작 패널 (Control Sidebar) - 4컬럼 */}
                <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6 h-fit sticky top-20">
                    <h2 className="font-black text-slate-800 text-base flex items-center gap-2 pb-3 border-b border-slate-100">
                        <i className="fas fa-sliders-h text-emerald-600"></i> 빌더 환경 설정
                    </h2>

                    {/* 브랜드 정보 */}
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1.5">브랜드 이름</label>
                            <input 
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="예: VeraTech"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-500 mb-1.5">한 줄 슬로건</label>
                            <input 
                                type="text"
                                value={slogan}
                                onChange={(e) => setSlogan(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                placeholder="슬로건을 써 주세요."
                            />
                        </div>
                    </div>

                    {/* 비즈니스 유형 (카테고리 3종) */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-2">비즈니스 유형</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['tech', 'cafe', 'studio'] as Category[]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setCategory(cat)}
                                    className={`py-2 px-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                                        category === cat 
                                            ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-700' 
                                            : 'bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                >
                                    {cat === 'tech' ? '💻 Tech' : cat === 'cafe' ? '☕ Cafe' : '🎨 Studio'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 테마 색상 4종 */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-2">포인트 테마 색상</label>
                        <div className="flex gap-3">
                            {(['violet', 'emerald', 'crimson', 'amber'] as ThemeColor[]).map((col) => {
                                const bgStyle = 
                                    col === 'violet' ? 'bg-violet-600' :
                                    col === 'emerald' ? 'bg-emerald-600' :
                                    col === 'crimson' ? 'bg-red-600' : 'bg-amber-600';
                                return (
                                    <button
                                        key={col}
                                        onClick={() => setThemeColor(col)}
                                        className={`w-7 h-7 rounded-full cursor-pointer transition-transform relative ${bgStyle} ${
                                            themeColor === col ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : 'hover:scale-110'
                                        }`}
                                        title={col}
                                    >
                                        {themeColor === col && (
                                            <i className="fas fa-check text-white text-[10px] absolute inset-0 flex items-center justify-center"></i>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 레이아웃 스타일 */}
                    <div>
                        <label className="block text-xs font-black text-slate-500 mb-2">메인 레이아웃</label>
                        <div className="space-y-2">
                            {(['split', 'centered', 'cards'] as LayoutStyle[]).map((lay) => (
                                <button
                                    key={lay}
                                    onClick={() => setLayoutStyle(lay)}
                                    className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all text-xs font-bold cursor-pointer ${
                                        layoutStyle === lay
                                            ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800'
                                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span>
                                            {lay === 'split' ? '🌓 Hero Split Layout' : lay === 'centered' ? '🎯 Minimal Centered Layout' : '🎴 Cards Grid Layout'}
                                        </span>
                                        {layoutStyle === lay && <i className="fas fa-check-circle text-emerald-600"></i>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* AI 제작 시작 버튼 */}
                    <button
                        onClick={handleStartBuild}
                        disabled={isBuilding}
                        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs rounded-2xl shadow-md transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                    >
                        {isBuilding ? '⚙️ AI 홈페이지 빌드 중...' : '✨ AI 홈페이지 생성 시작'}
                    </button>
                </div>

                {/* 2. 우측 뷰포트 프리뷰 보드 (Live Previewer) - 8컬럼 */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                    
                    {/* 상단 뷰포트 조절 툴바 */}
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-400"></span>
                            <span className="text-[10px] font-bold text-slate-400 ml-2 font-mono">LIVE PREVIEW</span>
                        </div>

                        {/* 뷰포트 버튼 스위처 */}
                        <div className="flex bg-slate-100 p-0.5 border border-slate-200/50 rounded-lg text-[9px] font-black text-slate-500 gap-0.5">
                            {(['mobile', 'tablet', 'desktop'] as Viewport[]).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setViewport(v)}
                                    className={`px-3 py-1 rounded transition-all cursor-pointer ${
                                        viewport === v ? 'bg-white text-slate-800 shadow-sm' : 'hover:text-slate-800'
                                    }`}
                                >
                                    {v === 'mobile' ? '📱 Mobile' : v === 'tablet' ? '📟 Tablet' : '💻 Desktop'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 프리뷰 패널 (동적 반응형 프레임) */}
                    <div className="flex justify-center w-full bg-slate-200/80 rounded-3xl p-4 min-h-[580px] overflow-hidden border border-slate-300/40">
                        
                        {/* 빌더 로딩 화면 */}
                        {isBuilding ? (
                            <div className="w-full flex flex-col justify-center items-center py-20 bg-white rounded-2xl shadow-sm min-h-[540px]">
                                <div className="relative w-20 h-20 mb-6">
                                    <div className="animate-spin rounded-full w-20 h-20 border-4 border-slate-100 border-t-emerald-600"></div>
                                    <i className="fas fa-laptop-code text-emerald-600 text-2xl absolute inset-0 flex items-center justify-center"></i>
                                </div>
                                <span className="text-sm font-black text-slate-700 mb-2">{buildProgress}%</span>
                                <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-emerald-600 transition-all duration-350" style={{ width: `${buildProgress}%` }}></div>
                                </div>
                                <p className="text-xs font-bold text-slate-400 animate-pulse">{buildStepText}</p>
                            </div>
                        ) : isBuilt ? (
                            
                            /* 뷰포트 넓이 동적 매핑 */
                            <div 
                                className={`bg-white rounded-2xl shadow-md min-h-[540px] flex flex-col transition-all duration-300 overflow-y-auto ${
                                    viewport === 'mobile' ? 'w-[360px]' : viewport === 'tablet' ? 'w-[700px]' : 'w-full'
                                }`}
                            >
                                {/* 모형 웹사이트 내비게이션 헤더 */}
                                <div className={`px-5 py-3.5 border-b border-slate-100 flex justify-between items-center ${category === 'tech' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-800'}`}>
                                    <span className="font-black text-sm tracking-wide flex items-center gap-1.5">
                                        <i className={`fas fa-cube ${category === 'tech' ? currentColors.text : 'text-slate-800'}`}></i> {brandName}
                                    </span>
                                    <nav className="flex gap-3.5 text-[10px] font-black uppercase text-slate-400">
                                        <span className={`hover:${currentColors.text} cursor-pointer`}>Home</span>
                                        <span className={`hover:${currentColors.text} cursor-pointer`}>Services</span>
                                        <span className={`hover:${currentColors.text} cursor-pointer`}>Contact</span>
                                    </nav>
                                </div>

                                {/* 모형 웹사이트 히어로 영역 */}
                                <div className={`flex-1 p-8 sm:p-12 flex flex-col justify-center ${category === 'tech' ? 'bg-slate-950 text-white' : category === 'cafe' ? 'bg-amber-50/30' : 'bg-slate-50'}`}>
                                    
                                    {/* 1) Hero Split 레이아웃 */}
                                    {layoutStyle === 'split' && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                            <div className="space-y-4">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${category === 'tech' ? 'bg-slate-800' : 'bg-white border border-slate-200'} ${currentColors.text}`}>
                                                    💡 BRAND INTRO
                                                </span>
                                                <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                                                    {brandName}에 오신 것을 환영합니다
                                                </h1>
                                                <p className="text-xs font-semibold text-slate-400 leading-relaxed">{slogan}</p>
                                                <button className={`px-4.5 py-2 text-white font-extrabold text-[10px] rounded-xl shadow transition-transform hover:scale-102 cursor-pointer ${currentColors.btn}`}>
                                                    자세히 알아보기
                                                </button>
                                            </div>
                                            <div className="rounded-2xl overflow-hidden shadow-inner border border-slate-250 bg-slate-100 flex items-center justify-center p-8 min-h-[160px]">
                                                {category === 'tech' ? (
                                                    <i className={`fas fa-microchip text-5xl opacity-40 ${currentColors.text}`}></i>
                                                ) : category === 'cafe' ? (
                                                    <i className={`fas fa-coffee text-5xl opacity-40 ${currentColors.text}`}></i>
                                                ) : (
                                                    <i className={`fas fa-palette text-5xl opacity-40 ${currentColors.text}`}></i>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* 2) Centered Minimal 레이아웃 */}
                                    {layoutStyle === 'centered' && (
                                        <div className="text-center space-y-5 max-w-lg mx-auto py-6">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${category === 'tech' ? 'bg-slate-800' : 'bg-white border border-slate-200'} ${currentColors.text}`}>
                                                💡 SOLUTION FOR B2B
                                            </span>
                                            <h1 className="text-3xl font-black tracking-tight leading-tight">
                                                {brandName}
                                            </h1>
                                            <p className="text-xs font-semibold text-slate-400 leading-relaxed px-4">{slogan}</p>
                                            <div className="flex justify-center gap-2 pt-2">
                                                <button className={`px-4.5 py-2 text-white font-extrabold text-[10px] rounded-xl shadow cursor-pointer ${currentColors.btn}`}>
                                                    솔루션 시작
                                                </button>
                                                <button className={`px-4.5 py-2 bg-white text-slate-700 border border-slate-200 font-extrabold text-[10px] rounded-xl hover:bg-slate-50 cursor-pointer`}>
                                                    문의하기
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3) Cards Grid 레이아웃 */}
                                    {layoutStyle === 'cards' && (
                                        <div className="space-y-6">
                                            <div className="text-center space-y-1.5">
                                                <h1 className="text-2xl font-black tracking-tight">{brandName}</h1>
                                                <p className="text-xs font-semibold text-slate-400">{slogan}</p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[1, 2, 3].map((num) => (
                                                    <div key={num} className={`p-4 rounded-xl border border-slate-200/60 bg-white shadow-sm flex flex-col justify-between min-h-[140px] text-slate-800`}>
                                                        <div>
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${currentColors.text} bg-slate-50`}>
                                                                <i className={`fas ${num === 1 ? 'fa-award' : num === 2 ? 'fa-bolt' : 'fa-shield-alt'} text-sm`}></i>
                                                            </div>
                                                            <h4 className="font-extrabold text-xs mb-1">핵심 기능 0{num}</h4>
                                                            <p className="text-[10px] text-slate-400 font-medium">B2B 파트너사를 위한 맞춤형 인프라 가치 및 편의를 약속합니다.</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 모형 웹사이트 푸터 영역 */}
                                <div className={`px-5 py-4 border-t border-slate-100 flex justify-between items-center text-[9px] font-bold text-slate-400 ${category === 'tech' ? 'bg-slate-950 border-slate-900' : 'bg-white'}`}>
                                    <span>© 2026 {brandName}. All rights reserved.</span>
                                    <span>Powered by VERA Builder</span>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </main>

            {/* 3. VERA Cloud 배포 성공 팝업 모달 */}
            {showDeployModal && (
                <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl animate-scale-in text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-5 border-2 border-emerald-100 animate-bounce">
                            <i className="fas fa-cloud-upload-alt text-2xl"></i>
                        </div>
                        <h3 className="font-black text-xl text-slate-800 mb-2">🎉 VERA Cloud 배포 완료!</h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-6">
                            작성하신 브랜드 사양에 맞춘 모형 웹사이트가 고성능 파트너 클라우드 노드에 정상적으로 배포되었습니다.
                        </p>
                        
                        {/* 도메인 상자 */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4.5 mb-6">
                            <span className="text-[9px] text-slate-400 font-black block mb-1">할당된 퍼블릭 가상 도메인</span>
                            <a 
                                href={`https://${brandName.toLowerCase()}.vera.b2b`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs font-mono font-black text-emerald-600 hover:underline flex items-center justify-center gap-1"
                            >
                                https://{brandName.toLowerCase()}.vera.b2b <i className="fas fa-external-link-alt text-[9px]"></i>
                            </a>
                        </div>

                        <button 
                            onClick={() => setShowDeployModal(false)}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow transition-colors cursor-pointer"
                        >
                            확인 및 대시보드 복귀
                        </button>
                    </div>
                </div>
            )}

            {/* 4. 코드 다운로드 알림창 배너 (상단 플로팅 토스트) */}
            {showCodeAlert && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white text-xs font-black px-5 py-3 rounded-full shadow-xl flex items-center gap-2 animate-slide-down">
                    <i className="fas fa-check-circle text-emerald-400"></i>
                    <span>가상 소스 패키지 `vera-{brandName.toLowerCase()}-package.zip` 생성이 완료되었습니다!</span>
                </div>
            )}

            <Footer />
        </div>
    );
}
