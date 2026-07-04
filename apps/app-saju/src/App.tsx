import { useState, useEffect } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import { calculateSaju } from './utils/sajuCalculator';
import type { SajuResult } from './utils/sajuCalculator';

type Step = 'init-loading' | 'input' | 'processing' | 'result';

export default function App() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const [step, setStep] = useState<Step>('init-loading');
    
    // 입력 폼 상태
    const [name, setName] = useState('');
    const [gender, setGender] = useState<'M' | 'F'>('M');
    const [birthDate, setBirthDate] = useState('1995-05-01');
    const [birthTime, setBirthTime] = useState('unknown');
    const [isSolar, setIsSolar] = useState(true);
    
    // 분석 결과 상태
    const [result, setResult] = useState<SajuResult | null>(null);
    const [activeResultTab, setActiveResultTab] = useState<'nature' | 'wealth' | 'love' | 'health'>('nature');

    // 3D 카드 뒤집기 상태
    const [isFlipped, setIsFlipped] = useState(false);

    // 리워드 허브 모킹 상태 (Vera 포인트)
    const [points, setPoints] = useState<number>(() => {
        const saved = localStorage.getItem('vera_points');
        return saved ? parseInt(saved, 10) : 120; // 디폴트 120P 지급
    });
    const [isClaimedToday, setIsClaimedToday] = useState<boolean>(() => {
        const saved = localStorage.getItem('vera_claimed_today');
        const today = new Date().toDateString();
        return saved === today;
    });

    // 프리미엄 리포트 잠금 상태
    const [isPremiumUnlocked, setIsPremiumUnlocked] = useState<boolean>(() => {
        return localStorage.getItem('vera_saju_premium_unlocked') === 'true';
    });

    // 포인트 저장
    const updatePoints = (newPoints: number) => {
        localStorage.setItem('vera_points', String(newPoints));
        setPoints(newPoints);
    };

    // 1. 최초 진입 로딩 연출 (2초)
    useEffect(() => {
        if (step === 'init-loading') {
            const timer = setTimeout(() => {
                setStep('input');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    // 로그인한 유저 정보가 들어오면 자동으로 이름 바인딩
    useEffect(() => {
        if (user && user.name) {
            setName(user.name);
        }
    }, [user]);

    // 2. 사주 분석 요청 핸들러
    const handleAnalyze = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            alert('이름을 입력해 주세요.');
            return;
        }
        
        // 3초간 분석 로딩 연출 시작
        setStep('processing');
        
        setTimeout(() => {
            const calculated = calculateSaju(name.trim(), gender, birthDate, birthTime, isSolar);
            setResult(calculated);
            setStep('result');
            setIsFlipped(false); // 초기에 앞면
        }, 3000);
    };

    // 출석 10P 포인트 지급
    const claimDailyPoints = () => {
        if (isClaimedToday) return;
        const newPoints = points + 10;
        updatePoints(newPoints);
        setIsClaimedToday(true);
        localStorage.setItem('vera_claimed_today', new Date().toDateString());
        alert('오늘의 총운 출석 체크! Vera 포인트 10P가 즉시 적립되었습니다. 💰');
    };

    // 프리미엄 리포트 해제 (500P 소모)
    const unlockPremiumReport = () => {
        if (isPremiumUnlocked) return;
        if (points < 500) {
            alert(`포인트가 부족합니다. (현재: ${points}P)\n아래의 '광고 보고 50P 무료 충전'을 사용해 포인트를 적립해 주세요!`);
            return;
        }
        const confirmUnlock = window.confirm('500P를 사용해 [2025년 심층 신년 운세 & 평생 재물 리포트]를 완전히 잠금 해제하시겠습니까?');
        if (confirmUnlock) {
            const newPoints = points - 500;
            updatePoints(newPoints);
            setIsPremiumUnlocked(true);
            localStorage.setItem('vera_saju_premium_unlocked', 'true');
            alert('🎉 잠금 해제 성공! 상세 프리미엄 재물 리포트와 종합 신년운세 탭이 활성화되었습니다.');
        }
    };

    // 광고 보고 50P 무료 적립 시뮬레이터
    const watchRewardAd = () => {
        alert('📺 리워드 동영상 광고가 재생됩니다... (5초)');
        setTimeout(() => {
            const newPoints = points + 50;
            updatePoints(newPoints);
            alert('광고 시청 완료! Vera 포인트 50P가 충전되었습니다. (+50P)');
        }, 1500);
    };

    // 크로스 링킹 바로가기
    const navigateToLink = (url: string) => {
        window.parent.postMessage({ type: 'NAVIGATE', url }, '*');
        // fallback
        window.open(url, '_blank');
    };

    // 라운지 공유
    const handleShareToLounge = () => {
        if (!result) return;
        const text = `🔮 [VERA Fortune AI 운세 인증]\n${name}님의 오늘의 운세 총점은 ${result.generalScore}점입니다!\n🤖 AI 투자스타일: ${result.investment.style}\n💬 사주 MBTI: ${result.mbti.character}\n🍀 행운의 컬러: ${result.luckyColor}\n\n지금 VERA 포털에서 무료 사주 분석을 받고 10P 적립금을 받아가세요!`;
        
        // 징검다리 localStorage 세이브
        localStorage.setItem('vera_lounge_pending_share', JSON.stringify({
            text,
            source: 'saju'
        }));

        alert('운세 인증 카드가 VERA Lounge 피드에 자동 업로드용으로 대기 상태입니다. 확인 버튼 클릭 시 라운지로 즉시 이동합니다!');
        
        // 부모 창으로 라운지 이동 메시지 전달 및 fallback 이동
        window.parent.postMessage({ type: 'NAVIGATE', url: '/lounge' }, '*');
        window.location.href = '/lounge';
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#090b1e]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <MiniAppLayout title="VERA Fortune - 스마트 운세 대시보드">
            <div className="relative min-h-[calc(100vh-56px)] bg-[#090b1e] text-[#f8fafc] overflow-hidden select-none pb-12">
                <div className="aurora-bg-effect"></div>
                
                {/* --- 1. 최초 앱 기동 로딩 화면 --- */}
                {step === 'init-loading' && (
                    <div className="loading-screen-dark z-50">
                        <div className="loading-body-dark">
                            <div className="loading-icon-glow">
                                <i className="fas fa-yin-yang loading-logo-spin"></i>
                            </div>
                            <h2 className="loading-title-dark">VERA Fortune</h2>
                            <p className="loading-subtitle-dark">글래스모피즘 기반 스마트 운세 대시보드 로딩 중</p>
                            
                            <div className="loading-spinner-dark">
                                <div className="spinner-dot-dark"></div>
                                <div className="spinner-dot-dark"></div>
                                <div className="spinner-dot-dark"></div>
                            </div>
                        </div>
                        {/* 하단 광고 배너 */}
                        <div className="loading-ad-banner-dark">
                            <span className="ad-badge-dark">Vera Hub</span>
                            <span className="ad-text-dark">매일 출석체크 운세만 봐도 쌓이는 리워드 포인트</span>
                        </div>
                    </div>
                )}

                {/* --- 2. 생년월일 입력 화면 --- */}
                {step === 'input' && (
                    <div className="relative z-10 px-5 pt-6 flex flex-col justify-between min-h-[calc(100vh-80px)] max-w-md mx-auto">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></span>
                                <span className="text-xs font-bold text-slate-400">VERA 독립 미니앱</span>
                            </div>
                            {/* 우측 상단 포인트 표시 */}
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                                <span className="text-amber-400 text-xs"><i className="fas fa-coins"></i></span>
                                <span className="text-xs font-black text-amber-300 font-mono">{points}P</span>
                            </div>
                        </div>

                        <form onSubmit={handleAnalyze} className="glass-card p-6 flex flex-col gap-5 mt-2 shadow-2xl">
                            <h2 className="text-lg font-black text-white flex items-center gap-2 border-b border-white/10 pb-3 leading-none">
                                <i className="fas fa-sparkles text-violet-400"></i> 사주 정보 입력
                            </h2>

                            {/* 이름 입력 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-400">이름</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-sm"
                                    required
                                />
                            </div>

                            {/* 성별 선택 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-400">성별</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setGender('M')}
                                        className={`flex-1 py-3 font-extrabold text-sm rounded-xl transition-all border ${
                                            gender === 'M'
                                                ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-600/30'
                                                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        남성
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGender('F')}
                                        className={`flex-1 py-3 font-extrabold text-sm rounded-xl transition-all border ${
                                            gender === 'F'
                                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/30'
                                                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        여성
                                    </button>
                                </div>
                            </div>

                            {/* 생년월일 입력 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-400">생년월일</label>
                                <input
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-sm"
                                    required
                                />
                            </div>

                            {/* 태어난 시간 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-slate-400">태어난 시간 (시)</label>
                                <select
                                    value={birthTime}
                                    onChange={(e) => setBirthTime(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-sm"
                                >
                                    <option value="unknown">태어난 시간 모름</option>
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <option key={i} value={String(i)} className="bg-slate-900 text-white">{i}시 ({i % 2 === 0 ? `${i}-${i+2}시` : `${i-1}-${i+1}시`})</option>
                                    ))}
                                </select>
                            </div>

                            {/* 양력/음력 토글 */}
                            <div className="flex items-center justify-between border-t border-white/10 pt-3">
                                <span className="text-xs font-bold text-slate-400">달력 구분</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSolar(true)}
                                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border ${
                                            isSolar
                                                ? 'bg-white text-slate-950 border-white font-black'
                                                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        양력
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsSolar(false)}
                                        className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border ${
                                            !isSolar
                                                ? 'bg-white text-slate-950 border-white font-black'
                                                : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        음력
                                    </button>
                                </div>
                            </div>

                            {/* 분석 제출 버튼 */}
                            <button
                                type="submit"
                                className="w-full py-4 text-white font-extrabold text-base rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-violet-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                            >
                                <i className="fas fa-sparkles animate-pulse"></i>
                                내 투자·커뮤니티 사주 분석
                            </button>
                        </form>

                        <div className="loading-ad-banner-dark mt-6 mb-2">
                            <span className="ad-badge-dark">보안</span>
                            <span className="ad-text-dark text-center">입력된 사주는 VERA의 1회성 로직 후 영구 파기됩니다.</span>
                        </div>
                    </div>
                )}

                {/* --- 3. 사주 분석 프로세싱 화면 --- */}
                {step === 'processing' && (
                    <div className="loading-screen-dark z-50">
                        <div className="loading-body-dark">
                            <div className="loading-icon-glow">
                                <i className="fas fa-yin-yang loading-logo-spin"></i>
                            </div>
                            <h2 className="loading-title-dark">AI 명식 대조 및 운세 기획 중...</h2>
                            <p className="loading-subtitle-dark">천간지지를 바탕으로 오늘의 투자 스타일과 비즈니스운을 도출합니다.</p>
                            
                            <div className="loading-spinner-dark mt-4">
                                <div className="spinner-dot-dark"></div>
                                <div className="spinner-dot-dark"></div>
                                <div className="spinner-dot-dark"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 4. 분석 결과 대시보드 화면 --- */}
                {step === 'result' && result && (
                    <div className="relative z-10 px-4 pt-5 flex flex-col gap-6 max-w-md mx-auto min-h-[calc(100vh-60px)] pb-20">
                        
                        {/* A. 상단 프로필 헤더 */}
                        <div className="flex justify-between items-center bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-lg shadow-inner">
                                    👤
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <h4 className="font-black text-sm text-white">{name}님</h4>
                                        <span className="bg-violet-900/40 border border-violet-700/50 text-[10px] text-violet-300 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                            {result.zodiac}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">내 오행과 포털 스마트 라이프 연동 중</p>
                                </div>
                            </div>
                            
                            {/* 실시간 포인트 */}
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                                <span className="text-amber-400 text-xs"><i className="fas fa-coins"></i></span>
                                <span className="text-xs font-black text-amber-300 font-mono">{points}P</span>
                            </div>
                        </div>

                        {/* B. 출석체크 보너스 리워드 위젯 */}
                        {!isClaimedToday && (
                            <div className="glass-card p-4 border border-violet-500/20 bg-gradient-to-r from-violet-950/40 to-indigo-950/40 flex justify-between items-center gap-3 animate-bounce">
                                <div className="flex-1">
                                    <div className="text-xs font-black text-violet-300">오늘의 총운 출석 이벤트 💰</div>
                                    <div className="text-[11px] text-slate-300 mt-0.5">사주 종합 카드를 열고 10P 보너스를 받으세요!</div>
                                </div>
                                <button
                                    onClick={claimDailyPoints}
                                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-colors"
                                >
                                    포인트 받기
                                </button>
                            </div>
                        )}

                        {/* C. 3D 뒤집기 오늘의 종합 운세 카드 (Hero) */}
                        <div className="perspective-1000 w-full h-[220px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                            <div className={`relative w-full h-full duration-700 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                                
                                {/* 3D 카드 앞면 */}
                                <div className="absolute w-full h-full backface-hidden glass-card glass-card-hover p-6 flex flex-col justify-between bg-gradient-to-br from-white/10 to-white/5 border-white/20 select-none">
                                    <div>
                                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                                            <span className="text-[11px] font-black text-violet-300 tracking-wider uppercase"><i className="fas fa-moon mr-1"></i> VERA 오늘의 총운 카드</span>
                                            <span className="bg-white/10 text-white font-mono text-xs px-2 py-0.5 rounded-full font-black">앞면</span>
                                        </div>
                                        <h3 className="text-xl font-black text-white mt-4 tracking-tight leading-tight">
                                            {name}님 생일에 흐르는<br />우주의 운세 총평을 확인해 보세요.
                                        </h3>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-400 font-extrabold border-t border-white/5 pt-3">
                                        <span>🔮 카드 터치 시 뒤집어짐</span>
                                        <span className="text-violet-300 flex items-center gap-1">열기 <i className="fas fa-rotate"></i></span>
                                    </div>
                                </div>

                                {/* 3D 카드 뒷면 */}
                                <div className="absolute w-full h-full backface-hidden glass-card p-5 flex flex-col justify-between bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border-violet-500/30 rotate-y-180 select-none">
                                    <div>
                                        <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                            <span className="text-[11px] font-black text-amber-300 tracking-wider uppercase">🔮 종합 해설 운세</span>
                                            <span className="bg-amber-400/20 text-amber-300 font-mono text-[10px] px-2 py-0.5 rounded-full font-black">뒷면</span>
                                        </div>
                                        <p className="text-xs text-slate-200 font-bold leading-relaxed mt-3 break-keep line-clamp-4">
                                            {result.analysis.nature}
                                        </p>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold border-t border-white/5 pt-2">
                                        <span>일주 간지: {result.ganji.day}</span>
                                        <span className="text-amber-300 flex items-center gap-1">닫기 <i className="fas fa-rotate"></i></span>
                                    </div>
                                </div>

                            </div>
                        </div>

                        {/* D. 운세 브리핑 (Grid 3 Cards) */}
                        <div className="grid grid-cols-3 gap-3">
                            {/* 총점 */}
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center backdrop-blur-md">
                                <span className="text-[10px] text-slate-400 font-bold mb-1">오늘의 총점</span>
                                <span className="text-xl font-black text-amber-400 font-mono">{result.generalScore}<span className="text-xs text-slate-300">점</span></span>
                            </div>
                            {/* 행운의 컬러 */}
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center backdrop-blur-md relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent pointer-events-none"></div>
                                <span className="text-[10px] text-slate-400 font-bold mb-1">행운의 컬러</span>
                                <span className="text-[11px] font-extrabold text-violet-300 text-center leading-tight truncate w-full">{result.luckyColor.split(' ')[0]}</span>
                            </div>
                            {/* 행운의 시간 */}
                            <div className="glass-card p-4 flex flex-col items-center justify-center text-center backdrop-blur-md">
                                <span className="text-[10px] text-slate-400 font-bold mb-1">행운의 시간</span>
                                <span className="text-[10px] font-mono font-black text-slate-200 leading-tight">{result.luckyTime.split(' ~ ')[0]}</span>
                            </div>
                        </div>

                        {/* E. 포털 크로스 연동 섹션 */}
                        <div className="flex flex-col gap-4 mt-2">
                            
                            {/* ① AI 투자운 카드 (금융/주식 연동) */}
                            <div className="glass-card p-5 border border-emerald-500/10 bg-gradient-to-br from-slate-900/60 to-emerald-950/20">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="bg-emerald-900/40 border border-emerald-600/40 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                        📈 AI 투자운 (주식)
                                    </span>
                                    <span className="text-xs font-bold text-emerald-400 font-mono">{result.investment.sector.split('/')[0]}</span>
                                </div>
                                <h4 className="text-sm font-black text-white mb-1.5">{result.investment.style}</h4>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium break-keep mb-4">
                                    {result.investment.description}
                                </p>
                                <button
                                    onClick={() => navigateToLink('/finance')}
                                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/10 text-center flex items-center justify-center gap-1"
                                >
                                    👉 실시간 미국/한국 주식 4대장 위젯 보기
                                </button>
                            </div>

                            {/* ② 사주 MBTI 카드 */}
                            <div className="glass-card p-5 border border-violet-500/10 bg-gradient-to-br from-slate-900/60 to-violet-950/20">
                                <span className="bg-violet-900/40 border border-violet-600/40 text-violet-300 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
                                    💬 사주 MBTI 성향
                                </span>
                                <h4 className="text-sm font-black text-white mb-1.5">{result.mbti.type}</h4>
                                <p className="text-xs text-slate-300 leading-relaxed font-semibold break-keep mb-3">
                                    💡 캐릭터: <span className="text-violet-300 font-black">{result.mbti.character}</span>
                                </p>
                                <p className="text-xs text-slate-400 leading-relaxed font-medium break-keep">
                                    {result.mbti.description}
                                </p>
                            </div>

                            {/* ③ B2B 사장님 비즈니스 캘린더 (B2B 빌더 & 유틸리티 연동) */}
                            <div className="glass-card p-5 border border-sky-500/10 bg-gradient-to-br from-slate-900/60 to-sky-950/20">
                                <span className="bg-sky-900/40 border border-sky-600/40 text-sky-300 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
                                    🤝 B2B 사장님 비즈니스 캘린더
                                </span>
                                <h4 className="text-sm font-black text-white mb-1.5">{result.business.title}</h4>
                                <p className="text-xs text-slate-300 leading-relaxed font-medium break-keep mb-4">
                                    {result.business.desc}
                                </p>
                                <button
                                    onClick={() => navigateToLink('/app/dday-calc')}
                                    className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs transition-all shadow-md shadow-sky-500/10 text-center flex items-center justify-center gap-1"
                                >
                                    👉 계약일 D-Day 계산기 등록하기
                                </button>
                            </div>

                            {/* ④ 2025 심층 프리미엄 신년 운세 & 평생 재물운 (리워드 포인트 소진처) */}
                            <div className="glass-card p-5 border border-amber-500/20 bg-gradient-to-br from-slate-900/80 to-amber-950/20 relative overflow-hidden">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="bg-amber-900/40 border border-amber-600/40 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                        👑 프리미엄 심층 운세 리포트
                                    </span>
                                    {isPremiumUnlocked ? (
                                        <span className="text-[10px] text-amber-400 font-black"><i className="fas fa-lock-open mr-1"></i>해제됨</span>
                                    ) : (
                                        <span className="text-[10px] text-amber-500/80 font-black"><i className="fas fa-lock mr-1"></i>잠김</span>
                                    )}
                                </div>

                                {isPremiumUnlocked ? (
                                    <div className="space-y-4 pt-1 animate-fade-in">
                                        <div className="border-t border-white/5 pt-3">
                                            <h5 className="text-xs font-black text-amber-300 flex items-center gap-1"><i className="fas fa-coins"></i> 평생 재물 흐름 & 부의 크기</h5>
                                            <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1 break-keep">
                                                {result.analysis.wealth}
                                            </p>
                                        </div>
                                        <div className="border-t border-white/5 pt-3">
                                            <h5 className="text-xs font-black text-violet-300 flex items-center gap-1"><i className="fas fa-heart"></i> 평생 애정운 & 인연의 방향</h5>
                                            <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1 break-keep">
                                                {result.analysis.love}
                                            </p>
                                        </div>
                                        <div className="border-t border-white/5 pt-3">
                                            <h5 className="text-xs font-black text-emerald-400 flex items-center gap-1"><i className="fas fa-heart-pulse"></i> 체질 맞춤 건강 처방</h5>
                                            <p className="text-xs text-slate-300 leading-relaxed font-medium mt-1 break-keep">
                                                {result.analysis.health}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 flex flex-col items-center justify-center">
                                        <p className="text-xs text-slate-300 font-bold mb-3 break-keep">
                                            [2025 신년 심층 해설 & 평생 재물운 보고서]<br />비용: <span className="text-amber-300 font-black">Vera 포인트 500P</span>
                                        </p>
                                        <div className="flex gap-2 w-full">
                                            <button
                                                onClick={watchRewardAd}
                                                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-xs transition-colors"
                                            >
                                                📺 광고 보고 50P 무료 적립
                                            </button>
                                            <button
                                                onClick={unlockPremiumReport}
                                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs transition-colors shadow-md"
                                            >
                                                🔑 500P로 해제하기
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* F. 하단 재시작 및 공유 버튼 */}
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => setStep('input')}
                                className="flex-1 py-4 font-black rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 transition-colors text-center text-sm"
                            >
                                처음으로
                            </button>
                            <button
                                onClick={handleShareToLounge}
                                className="flex-2 py-4 font-black rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-violet-600/10 text-center text-sm flex items-center justify-center gap-2"
                            >
                                <i className="fas fa-comments"></i>
                                VERA Lounge에 내 운세 공유
                            </button>
                        </div>

                    </div>
                )}

            </div>
        </MiniAppLayout>
    );
}
