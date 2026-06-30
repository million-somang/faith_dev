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
        }, 3000);
    };

    const handleShareResult = () => {
        if (!result) return;
        const text = `🔮 [FaithLink 전통 사주 분석 결과]\n${name}님의 사주 기운:\n🌳 목(木) ${result.elements.wood}%\n🔥 화(火) ${result.elements.fire}%\n⛰️ 토(土) ${result.elements.earth}%\n⚙️ 금(金) ${result.elements.metal}%\n💧 수(水) ${result.elements.water}%\n\n상세한 재물, 애정, 건강 운세를 FaithLink에서 지금 무료로 확인해보세요!`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text)
                .then(() => alert('사주 풀이 요약이 클립보드에 복사되었습니다! 친구들에게 공유해 보세요.'))
                .catch(() => alert('복사에 실패했습니다.'));
        } else {
            alert(text);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f5f4ee]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <MiniAppLayout title="전통 사주 분석">
            {/* --- 최초 앱 기동 로딩 화면 --- */}
            {step === 'init-loading' && (
                <div className="loading-screen">
                    <div className="loading-body">
                        <div className="loading-icon-wrapper">
                            <i className="fas fa-yin-yang loading-logo-icon"></i>
                        </div>
                        <h2 className="loading-title">전통 사주 오행 분석</h2>
                        <p className="loading-subtitle">우주의 기운이 담긴 나의 팔자 분석하기</p>
                        
                        <div className="loading-spinner">
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                        </div>
                    </div>
                    {/* 하단 광고 배너 */}
                    <div className="loading-ad-banner">
                        <span className="ad-badge">AD</span>
                        <span className="ad-text">하루를 바꾸는 긍정의 힘, FaithLink 운세 서비스</span>
                    </div>
                </div>
            )}

            {/* --- 생년월일 입력 화면 --- */}
            {step === 'input' && (
                <div className="p-5 flex flex-col justify-between min-h-[calc(100vh-56px)] max-w-md mx-auto">
                    <form onSubmit={handleAnalyze} className="nm-card p-6 flex flex-col gap-5 mt-4">
                        <h2 className="text-xl font-black text-stone-800 flex items-center gap-2 border-b border-stone-200 pb-3">
                            <i className="fas fa-edit text-violet-600"></i> 사주 정보 입력
                        </h2>

                        {/* 이름 입력 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-stone-600">이름</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-sm"
                                required
                            />
                        </div>

                        {/* 성별 선택 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-stone-600">성별</label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setGender('M')}
                                    className={`flex-1 py-3 font-extrabold text-sm rounded-xl transition-all border ${
                                        gender === 'M'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                    }`}
                                >
                                    남성
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setGender('F')}
                                    className={`flex-1 py-3 font-extrabold text-sm rounded-xl transition-all border ${
                                        gender === 'F'
                                            ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                                    }`}
                                >
                                    여성
                                </button>
                            </div>
                        </div>

                        {/* 생년월일 입력 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-stone-600">생년월일</label>
                            <input
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-sm"
                                required
                            />
                        </div>

                        {/* 태어난 시간 */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-black text-stone-600">태어난 시간 (시)</label>
                            <select
                                value={birthTime}
                                onChange={(e) => setBirthTime(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 focus:outline-none focus:ring-2 focus:ring-violet-500 font-bold text-sm"
                            >
                                <option value="unknown">태어난 시간 모름</option>
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={String(i)}>{i}시 ({i % 2 === 0 ? `${i}-${i+2}시` : `${i-1}-${i+1}시`})</option>
                                ))}
                            </select>
                        </div>

                        {/* 양력/음력 토글 */}
                        <div className="flex items-center justify-between border-t border-stone-100 pt-3">
                            <span className="text-xs font-black text-stone-600">달력 구분</span>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSolar(true)}
                                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border ${
                                        isSolar
                                            ? 'bg-stone-800 text-white border-stone-800'
                                            : 'bg-white text-stone-600 border-stone-200'
                                    }`}
                                >
                                    양력
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsSolar(false)}
                                    className={`px-3 py-1.5 text-xs font-extrabold rounded-lg border ${
                                        !isSolar
                                            ? 'bg-stone-800 text-white border-stone-800'
                                            : 'bg-white text-stone-600 border-stone-200'
                                    }`}
                                >
                                    음력
                                </button>
                            </div>
                        </div>

                        {/* 분석 제출 버튼 */}
                        <button
                            type="submit"
                            className="nm-btn nm-btn-primary w-full py-4 text-white text-base rounded-2xl flex items-center justify-center gap-2 mt-2"
                        >
                            <i className="fas fa-yin-yang animate-spin-slow"></i>
                            무료 사주 분석하기
                        </button>
                    </form>

                    {/* 아래쪽 Mock 광고 배너 */}
                    <div className="loading-ad-banner mt-6 mb-2">
                        <span className="ad-badge">AD</span>
                        <span className="ad-text">사주팔자 분석은 1회성이며 저장되지 않습니다.</span>
                    </div>
                </div>
            )}

            {/* --- 사주 분석 프로세싱 화면 --- */}
            {step === 'processing' && (
                <div className="loading-screen">
                    <div className="loading-body">
                        <div className="loading-icon-wrapper">
                            <i className="fas fa-yin-yang loading-logo-icon"></i>
                        </div>
                        <h2 className="loading-title">음양오행 기운 분석 중...</h2>
                        <p className="loading-subtitle">년월일시 사주팔자 천간지지를 대조하고 있습니다.</p>
                        
                        <div className="loading-spinner mt-4">
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                            <div className="spinner-dot"></div>
                        </div>
                    </div>
                    {/* 하단 광고 배너 */}
                    <div className="loading-ad-banner">
                        <span className="ad-badge">AD</span>
                        <span className="ad-text">동양 명리학 비기 기반의 고정밀 가중치 분석</span>
                    </div>
                </div>
            )}

            {/* --- 분석 결과 화면 --- */}
            {step === 'result' && result && (
                <div className="p-5 flex flex-col gap-6 max-w-md mx-auto min-h-[calc(100vh-56px)] pb-10">
                    
                    {/* 1. 간지(사주팔자) 보드 */}
                    <div className="nm-card p-5 text-center flex flex-col gap-3 mt-2 bg-[#FAF9F5]">
                        <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest">사주팔자 간지</h3>
                        
                        <div className="grid grid-cols-4 gap-2 border border-stone-200 rounded-xl bg-white p-3 shadow-inner">
                            <div className="flex flex-col border-r border-stone-100">
                                <span className="text-[10px] font-black text-stone-400">시주(時)</span>
                                <span className="text-xl font-black text-stone-800 tracking-tighter leading-snug">{result.ganji.time}</span>
                            </div>
                            <div className="flex flex-col border-r border-stone-100">
                                <span className="text-[10px] font-black text-stone-400">일주(日)</span>
                                <span className="text-xl font-black text-stone-800 tracking-tighter leading-snug text-violet-600">{result.ganji.day}</span>
                            </div>
                            <div className="flex flex-col border-r border-stone-100">
                                <span className="text-[10px] font-black text-stone-400">월주(月)</span>
                                <span className="text-xl font-black text-stone-800 tracking-tighter leading-snug">{result.ganji.month}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-stone-400">연주(年)</span>
                                <span className="text-xl font-black text-stone-800 tracking-tighter leading-snug">{result.ganji.year}</span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-stone-500">붉게 표시된 일주(日)는 본인을 나타내는 기운입니다.</p>
                    </div>

                    {/* 2. 오행 그래프 */}
                    <div className="nm-card p-5 flex flex-col gap-4">
                        <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest border-b border-stone-100 pb-2">음양오행 비율 분석</h3>
                        
                        <div className="flex flex-col gap-3">
                            {/* 목 */}
                            <div className="flex items-center gap-3">
                                <span className="w-10 text-xs font-black text-stone-700">🌳 목(木)</span>
                                <div className="flex-1 h-3.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.elements.wood}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-xs font-extrabold text-stone-600">{result.elements.wood}%</span>
                            </div>
                            {/* 화 */}
                            <div className="flex items-center gap-3">
                                <span className="w-10 text-xs font-black text-stone-700">🔥 화(火)</span>
                                <div className="flex-1 h-3.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="bg-red-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.elements.fire}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-xs font-extrabold text-stone-600">{result.elements.fire}%</span>
                            </div>
                            {/* 토 */}
                            <div className="flex items-center gap-3">
                                <span className="w-10 text-xs font-black text-stone-700">⛰️ 토(土)</span>
                                <div className="flex-1 h-3.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.elements.earth}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-xs font-extrabold text-stone-600">{result.elements.earth}%</span>
                            </div>
                            {/* 금 */}
                            <div className="flex items-center gap-3">
                                <span className="w-10 text-xs font-black text-stone-700">⚙️ 금(金)</span>
                                <div className="flex-1 h-3.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="bg-stone-500 h-full rounded-full transition-all duration-1000" style={{ width: `${result.elements.metal}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-xs font-extrabold text-stone-600">{result.elements.metal}%</span>
                            </div>
                            {/* 수 */}
                            <div className="flex items-center gap-3">
                                <span className="w-10 text-xs font-black text-stone-700">💧 수(水)</span>
                                <div className="flex-1 h-3.5 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
                                    <div className="bg-blue-600 h-full rounded-full transition-all duration-1000" style={{ width: `${result.elements.water}%` }}></div>
                                </div>
                                <span className="w-8 text-right text-xs font-extrabold text-stone-600">{result.elements.water}%</span>
                            </div>
                        </div>
                    </div>

                    {/* 3. 탭별 분석 텍스트 */}
                    <div className="nm-card overflow-hidden">
                        {/* 결과 탭 선택 */}
                        <div className="flex border-b border-stone-200 bg-stone-50/50 p-1 gap-1">
                            <button
                                onClick={() => setActiveResultTab('nature')}
                                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                                    activeResultTab === 'nature' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                총평
                            </button>
                            <button
                                onClick={() => setActiveResultTab('wealth')}
                                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                                    activeResultTab === 'wealth' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                재물운
                            </button>
                            <button
                                onClick={() => setActiveResultTab('love')}
                                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                                    activeResultTab === 'love' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                애정운
                            </button>
                            <button
                                onClick={() => setActiveResultTab('health')}
                                className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
                                    activeResultTab === 'health' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
                                }`}
                            >
                                건강운
                            </button>
                        </div>
                        {/* 탭 내용 */}
                        <div className="p-6 min-h-[160px] bg-white">
                            {activeResultTab === 'nature' && (
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5"><i className="fas fa-portrait text-violet-500"></i> 기질 및 천성 분석</h4>
                                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-keep">{result.analysis.nature}</p>
                                </div>
                            )}
                            {activeResultTab === 'wealth' && (
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5"><i className="fas fa-coins text-amber-500"></i> 재물 흐름과 축재법</h4>
                                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-keep">{result.analysis.wealth}</p>
                                </div>
                            )}
                            {activeResultTab === 'love' && (
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5"><i className="fas fa-heart text-purple-500"></i> 애정 성향 및 인간관계</h4>
                                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-keep">{result.analysis.love}</p>
                                </div>
                            )}
                            {activeResultTab === 'health' && (
                                <div className="flex flex-col gap-2">
                                    <h4 className="font-extrabold text-sm text-stone-800 flex items-center gap-1.5"><i className="fas fa-heart-pulse text-emerald-600"></i> 건강 관리 및 조언</h4>
                                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed break-keep">{result.analysis.health}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 4. 작업 버튼 */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep('input')}
                            className="flex-1 py-4 font-black rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors shadow-sm text-center text-sm border border-stone-200"
                        >
                            다시 보기
                        </button>
                        <button
                            onClick={handleShareResult}
                            className="flex-2 py-4 font-black rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white transition-colors shadow-md text-center text-sm flex items-center justify-center gap-2"
                        >
                            <i className="fas fa-share-nodes"></i>
                            결과 친구에게 공유
                        </button>
                    </div>
                </div>
            )}
        </MiniAppLayout>
    );
}
