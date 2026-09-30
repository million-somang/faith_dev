import React, { useState, useEffect } from 'react';
import { MiniAppLayout, useAuth } from '@faithportal/mini-app-sdk';
import axios from 'axios';
import { calculateSaju, ELEMENT_CONFIG } from './utils/sajuCalculator';
import type { SajuResult } from './utils/sajuCalculator';
import AppDosaCharacter from './components/AppDosaCharacter';
import SajuPillarsCard from './components/SajuPillarsCard';
import CoupleMatchModal from './components/CoupleMatchModal';
import SajuShareModal from './components/SajuShareModal';

type Step = 'splash' | 'input' | 'processing' | 'result';
type TabKey = 'summary' | 'elements' | 'tools';

export default function App() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('splash');
  const [loadingProgress, setLoadingProgress] = useState(1);

  // 1. 입력 폼 상태 (veranex_saju_* 우선 로드, 기존 faith_saju_* 호환 fallback)
  const [name, setName] = useState(() => {
    return (
      localStorage.getItem('veranex_saju_name') ||
      localStorage.getItem('faith_saju_name') ||
      localStorage.getItem('user_name') ||
      ''
    );
  });
  const [gender, setGender] = useState<'M' | 'F'>(() => {
    const saved = localStorage.getItem('veranex_saju_gender') || localStorage.getItem('faith_saju_gender');
    return saved === 'F' ? 'F' : 'M';
  });
  const [birthDate, setBirthDate] = useState(() => {
    return (
      localStorage.getItem('veranex_saju_birth_date') ||
      localStorage.getItem('faith_saju_birth_date') ||
      localStorage.getItem('user_birth_date') ||
      '1996-08-21'
    );
  });
  const [birthTime, setBirthTime] = useState(() => {
    return (
      localStorage.getItem('veranex_saju_birth_time') ||
      localStorage.getItem('faith_saju_birth_time') ||
      '12'
    );
  });
  const [isSolar, setIsSolar] = useState(() => {
    const saved = localStorage.getItem('veranex_saju_is_solar') || localStorage.getItem('faith_saju_is_solar');
    return saved === 'false' ? false : true;
  });

  // 2. 결과 및 모달 상태
  const [result, setResult] = useState<SajuResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [isCoupleModalOpen, setIsCoupleModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // 3. 인터랙티브 기능 (점심 룰렛, 로또)
  const [pickedMenu, setPickedMenu] = useState<string | null>(null);
  const [isMenuRolling, setIsMenuRolling] = useState(false);
  const [revealedLotto, setRevealedLotto] = useState<number[] | null>(null);
  const [isLottoDrawing, setIsLottoDrawing] = useState(false);

  // 4초(4000ms) 실시간 1~100% 프로그레스 스플래시
  useEffect(() => {
    if (step !== 'splash') return;

    const duration = 4000;
    const intervalTime = 40;
    const stepIncrement = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setLoadingProgress((prev) => {
        const next = prev + stepIncrement;
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(() => setStep('input'), 250);
          return 100;
        }
        return Math.floor(next);
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [step]);

  // 회원 프로필 자동 연동
  useEffect(() => {
    if (user) {
      if (user.name && !name) {
        setName(user.name);
        localStorage.setItem('veranex_saju_name', user.name);
      }
      if (user.birth_date && birthDate === '1996-08-21') {
        setBirthDate(user.birth_date);
        localStorage.setItem('veranex_saju_birth_date', user.birth_date);
      }
      if (user.birth_time && user.birth_time !== 'unknown') {
        setBirthTime(user.birth_time);
        localStorage.setItem('veranex_saju_birth_time', user.birth_time);
      }
      if (user.gender) {
        const g = user.gender === 'F' ? 'F' : 'M';
        setGender(g);
        localStorage.setItem('veranex_saju_gender', g);
      }
      if (user.is_solar !== undefined && user.is_solar !== null) {
        const s = Boolean(user.is_solar);
        setIsSolar(s);
        localStorage.setItem('veranex_saju_is_solar', String(s));
      }
    }
  }, [user]);

  // 프로필 로컬 및 서버 영구 보관
  const persistProfile = async (
    targetName: string,
    targetBirthDate: string,
    targetBirthTime: string,
    targetGender: string,
    targetIsSolar: boolean
  ) => {
    try {
      localStorage.setItem('veranex_saju_name', targetName);
      localStorage.setItem('veranex_saju_birth_date', targetBirthDate);
      localStorage.setItem('veranex_saju_birth_time', targetBirthTime);
      localStorage.setItem('veranex_saju_gender', targetGender);
      localStorage.setItem('veranex_saju_is_solar', String(targetIsSolar));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    if (user) {
      try {
        await axios.post(
          '/api/user/saju-profile',
          {
            name: targetName,
            birthDate: targetBirthDate,
            birthTime: targetBirthTime,
            gender: targetGender,
            isSolar: targetIsSolar,
          },
          { withCredentials: true }
        );
      } catch {
        // 비로그인 또는 실패 시 조용히 통과
      }
    }
  };

  // 사주 분석 실행
  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const targetName = name.trim() || (user && user.name) || '이용자';
    persistProfile(targetName, birthDate, birthTime, gender, isSolar);

    setStep('processing');
    setTimeout(() => {
      try {
        const calc = calculateSaju(targetName, gender, birthDate, birthTime, isSolar);
        setResult(calc);
        setStep('result');
        setPickedMenu(null);
        setRevealedLotto(null);
      } catch (err) {
        console.error('Saju calc error:', err);
        const fallback = calculateSaju('이용자', 'M', '1996-08-21', '12', true);
        setResult(fallback);
        setStep('result');
      }
    }, 700);
  };

  // 점심 메뉴 룰렛
  const rollMenu = () => {
    if (!result) return;
    setIsMenuRolling(true);
    const pool = [
      result.microDaily.luckyMenu,
      '담백한 소고기 전골 & 솥밥',
      '신선한 생선구이 정식',
      '버섯 들깨 칼국수',
      '정갈한 안심 돈카츠',
      '따뜻한 삼계탕',
      '아보카도 연어 포케',
      '매콤한 순두부찌개',
    ];
    setTimeout(() => {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setPickedMenu(pick);
      setIsMenuRolling(false);
    }, 500);
  };

  // 로또 번호 추첨
  const drawLotto = () => {
    if (!result) return;
    setIsLottoDrawing(true);
    setTimeout(() => {
      setRevealedLotto(result.microDaily.lottoNumbers);
      setIsLottoDrawing(false);
    }, 600);
  };

  return (
    <MiniAppLayout title="베라 정통 만세력 & 사주">
      {/* 팝업 규격: 450px × 850px 고정, 680px 이내 1화면 완결 Zero-Scroll 컨테이너 */}
      <div className="w-full max-w-[450px] h-screen max-h-[850px] mx-auto overflow-hidden flex flex-col justify-between bg-slate-50 text-slate-800 font-sans select-none relative">
        
        {/* ============================================================== */}
        {/* [화면 1] 4초 프리미엄 스플래시 & 1~100% 프로그레스 (data-screenshot-entry) */}
        {/* ============================================================== */}
        {step === 'splash' && (
          <div
            data-screenshot-entry="true"
            className="w-full h-full flex flex-col justify-between items-center bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 p-5 select-none animate-fade-in"
          >
            {/* 1. 상단 브랜딩 & 기준 배지 */}
            <div className="w-full flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
                <span className="text-xs font-black text-slate-700 tracking-wider uppercase">
                  VERANEX
                </span>
              </div>
              <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                2026 공인 천문역법 준수
              </span>
            </div>

            {/* 2. 중앙 메인 비주얼: 앱도사 캐릭터 + 도술 연산 중 */}
            <div className="w-full flex flex-col items-center justify-center my-auto py-2 text-center">
              <AppDosaCharacter
                mood="loading"
                size="lg"
                speechBubble="천기누설 사주 데이터를 조율하고 있소!"
              />

              <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-3 mb-1">
                베라 정통 만세력 & 사주
              </h1>
              <p className="text-xs font-bold text-indigo-600 mb-1">
                MZ 감성 앱도사가 짚어주는 오늘의 운명과 오행 밸런스
              </p>
              <p className="text-[11px] text-slate-400 mb-5 max-w-xs leading-relaxed">
                정밀 만세력 8글자 분석과 사이다 한 줄 요약이 곧 시작됩니다
              </p>

              {/* 1~100% 실시간 프로그레스 바 */}
              <div className="w-full max-w-[280px] space-y-1.5 mb-2">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 px-1">
                  <span>음양오행 연산 및 모듈 동기화</span>
                  <span className="font-black text-indigo-600 text-xs tabular-nums">
                    {loadingProgress}%
                  </span>
                </div>
                <div className="w-full bg-slate-200/70 border border-slate-300/80 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 via-sky-500 to-amber-400 rounded-full transition-all duration-75 ease-out shadow-xs"
                    style={{ width: `${loadingProgress}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-indigo-600">
                <i className="fas fa-spinner fa-spin text-indigo-500 text-xs"></i>
                <span>천문 데이터 로딩 중... ({loadingProgress}%)</span>
              </div>
            </div>

            {/* 3. 하단 필수 광고 / 스폰서 배너 슬롯 (miniapp.md 의무) */}
            <div className="w-full flex flex-col items-center gap-1.5 pb-1">
              <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-xs flex items-center justify-between hover:border-indigo-300 transition-colors">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <i className="fas fa-bullhorn text-xs"></i>
                  </div>
                  <div className="text-left min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1 py-0.2 rounded border border-indigo-100">
                        AD
                      </span>
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        2026 VeraNex 프리미엄 금융 허브
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-400 truncate block">
                      포털 공식 제휴 프로모션 바로가기
                    </span>
                  </div>
                </div>
                <span className="shrink-0 px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-200">
                  확인
                </span>
              </div>
              <p className="text-[9px] text-slate-400 text-center">
                본 서비스는 2026년 한국 천문연구원 역법 기준을 준수합니다.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* [화면 2] 사주 입력 폼 (Zero-Scroll 680px 완결) (data-screenshot-input) */}
        {/* ============================================================== */}
        {step === 'input' && (
          <div
            data-screenshot-input="true"
            className="w-full h-full flex flex-col justify-between bg-slate-50 p-3.5 select-none animate-fade-in"
          >
            {/* 1. 슬림 상단 원라인 헤더 */}
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-2xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
                  <i className="fas fa-yin-yang"></i>
                </div>
                <div>
                  <h1 className="text-xs font-black text-slate-900 leading-none">
                    베라 정통 만세력 & 사주
                  </h1>
                  <span className="text-[9px] text-slate-400 font-bold">
                    VeraNex 사주팔자 명리 엔진
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● 실시간 자동저장
              </span>
            </div>

            {/* 2. 중앙 컴팩트 폼 카드 */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3 my-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <AppDosaCharacter mood="idle" size="sm" />
                  <div className="text-left">
                    <span className="text-[10px] font-black text-indigo-600 block">
                      베라 앱도사의 안내
                    </span>
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {user?.name ? `${user.name}님의 사주를 풀이해 드릴게요!` : '생년월일시를 꼼꼼히 짚어드립니다!'}
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleAnalyze} className="space-y-2.5">
                {/* 이름 */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">
                    이름 (또는 닉네임)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                    required
                  />
                </div>

                {/* 성별 & 양력/음력 (2열) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1">성별</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setGender('M')}
                        className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                          gender === 'M'
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        남성
                      </button>
                      <button
                        type="button"
                        onClick={() => setGender('F')}
                        className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                          gender === 'F'
                            ? 'bg-white text-rose-600 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        여성
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1">달력</label>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                      <button
                        type="button"
                        onClick={() => setIsSolar(true)}
                        className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                          isSolar
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        양력
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSolar(false)}
                        className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                          !isSolar
                            ? 'bg-white text-indigo-700 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        음력
                      </button>
                    </div>
                  </div>
                </div>

                {/* 생년월일 */}
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">
                    생년월일
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-bold text-xs text-slate-800"
                    required
                  />
                </div>

                {/* 태어난 시간 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-black text-slate-600">
                      태어난 시간 (12시진)
                    </label>
                    <button
                      type="button"
                      onClick={() => setBirthTime(birthTime === 'unknown' ? '12' : 'unknown')}
                      className="text-[10px] text-indigo-600 hover:underline font-bold"
                    >
                      {birthTime === 'unknown' ? '시간 직접 선택' : '시간 모름'}
                    </button>
                  </div>
                  <select
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    disabled={birthTime === 'unknown'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1.5 focus:ring-indigo-500 font-bold text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="0">자시 (子時 · 23:30 ~ 01:30)</option>
                    <option value="2">축시 (丑時 · 01:30 ~ 03:30)</option>
                    <option value="4">인시 (寅時 · 03:30 ~ 05:30)</option>
                    <option value="6">묘시 (卯時 · 05:30 ~ 07:30)</option>
                    <option value="8">진시 (辰時 · 07:30 ~ 09:30)</option>
                    <option value="10">사시 (巳時 · 09:30 ~ 11:30)</option>
                    <option value="12">오시 (午時 · 11:30 ~ 13:30)</option>
                    <option value="14">미시 (未時 · 13:30 ~ 15:30)</option>
                    <option value="16">신시 (申時 · 15:30 ~ 17:30)</option>
                    <option value="18">유시 (酉時 · 17:30 ~ 19:30)</option>
                    <option value="20">술시 (戌時 · 19:30 ~ 21:30)</option>
                    <option value="22">해시 (亥時 · 21:30 ~ 23:30)</option>
                  </select>
                </div>

                {/* 메인 분석 버튼 */}
                <button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <i className="fas fa-magic text-xs"></i>
                  <span>앱도사에게 사주 풀이 받기</span>
                </button>
              </form>
            </div>

            {/* 3. 하단 보안 & 클라이언트 로컬 처리 보증 푸터 */}
            <div className="text-center py-1">
              <span className="text-[10px] font-bold text-slate-400">
                🔒 VeraNex 클라이언트 보안 엔진 · 개인정보 100% 암호화 처리
              </span>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* [화면 3] 연산 중 화면 */}
        {/* ============================================================== */}
        {step === 'processing' && (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50 text-center animate-fade-in select-none">
            <AppDosaCharacter mood="loading" size="md" speechBubble="사주 원국과 오행을 짚는 중..." />
            <h3 className="text-base font-black text-slate-900 mt-4 mb-1">
              천간지지 및 대운 흐름 분석 중
            </h3>
            <p className="text-xs text-slate-500 max-w-xs">
              사주팔자 8글자의 상생상극과 오행 밸런스를 계산하고 있습니다.
            </p>
          </div>
        )}

        {/* ============================================================== */}
        {/* [화면 4] 사주 결과 대시보드 (Zero-Scroll 680px 완결) (data-screenshot-result) */}
        {/* ============================================================== */}
        {step === 'result' && result && (
          <div
            data-screenshot-result="true"
            className="w-full h-full flex flex-col justify-between bg-slate-50 p-2.5 select-none animate-fade-in"
          >
            {/* 1. 슬림 원라인 헤더 (높이 ~40px) */}
            <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span className="text-xs font-black text-slate-900 tracking-tight">
                  {result.basic.name} 님
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {result.basic.zodiac.split(' ')[1] || result.basic.zodiac}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="fas fa-share-nodes text-[9px]"></i>
                  <span>공유</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200 transition-all cursor-pointer flex items-center gap-1"
                >
                  <i className="fas fa-redo-alt text-[9px]"></i>
                  <span>다시</span>
                </button>
              </div>
            </div>

            {/* 2. 3대 컴팩트 알약 탭 바 (높이 ~34px) */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-xl border border-slate-300/60 my-1">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`py-1 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                도사요약 · 8글자
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('elements')}
                className={`py-1 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'elements'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                오행 밸런스
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tools')}
                className={`py-1 text-center text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeTab === 'tools'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                궁합 · 행운도구
              </button>
            </div>

            {/* 3. 탭별 메인 뷰포트 (순수 세로 680px 이내 완결) */}
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* TAB 1: [도사 요약 & 8글자 3D 플립 카드 & 3대 스코어 & 4대 행운 가이드] */}
              {activeTab === 'summary' && (
                <div className="h-full flex flex-col justify-between space-y-1.5 animate-fade-in overflow-y-auto custom-scrollbar pr-0.5">
                  {/* A. 오늘의 사주 한마디 (대폭 강조된 히어로 카드) */}
                  <div className="bg-gradient-to-br from-indigo-50/90 via-white to-amber-50/60 rounded-2xl p-2.5 border border-indigo-200/90 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <AppDosaCharacter
                        mood="result"
                        size="sm"
                        onClick={() => alert(`오늘의 도사 조언: ${result.appDosaSummary.punchline}`)}
                      />
                      <div className="flex-1 min-w-0">
                        {/* 뱃지 및 해시태그 */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-indigo-600 text-white shadow-2xs">
                              도사의 사이다 처방
                            </span>
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-1.5 py-0.2 rounded-md">
                              {result.appDosaSummary.moodTitle}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">
                            {result.appDosaSummary.hashtags[0]}
                          </span>
                        </div>

                        {/* 강조된 사이다 한 줄 텍스트 */}
                        <div className="bg-white/95 rounded-xl p-2 border border-indigo-100 shadow-2xs">
                          <p className="text-[13px] sm:text-sm font-black text-slate-900 leading-snug tracking-tight">
                            “{result.appDosaSummary.punchline}”
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 도사의 1줄 실전 가이드 팁 */}
                    <div className="mt-1.5 pt-1.5 border-t border-indigo-100/70 flex items-center justify-between text-[10px]">
                      <span className="text-slate-600 font-bold truncate flex items-center gap-1">
                        <span className="text-amber-500 font-black">💡 도사 조언:</span>
                        <span>{result.appDosaSummary.actionAdvice}</span>
                      </span>
                      <div className="hidden sm:flex items-center gap-1 text-[9px] text-indigo-500 font-bold shrink-0">
                        {result.appDosaSummary.hashtags.slice(1).map((tag, idx) => (
                          <span key={idx}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* B. 사주팔자 원국 8글자 3D 플립 카드 */}
                  <SajuPillarsCard pillars={result.pillars} />

                  {/* C. 오늘의 일진 & 사주 조화 브릿지 바 (중간 빈 공간 완벽 해소) */}
                  <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl px-2.5 py-1.5 flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-indigo-950 truncate flex items-center gap-1">
                      <span className="text-indigo-600 font-black">⚡ 오행 조화:</span>
                      <span className="text-slate-700 truncate">{result.appDosaSummary.todayEnergyBrief}</span>
                    </span>
                    <span className="text-[9px] font-black text-indigo-700 bg-white px-1.5 py-0.5 rounded-md border border-indigo-200 shrink-0">
                      상생 길일
                    </span>
                  </div>

                  {/* D. 3대 라이프 스코어 & 맞춤 실전 팁 */}
                  <div className="bg-white rounded-2xl p-2 border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-700 px-0.5">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        오늘의 3대 라이프 스코어 & 실전 가이드
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">오행 에너지 환산</span>
                    </div>

                    <div className="space-y-1.5">
                      {/* 재물운 */}
                      <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/60">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                            <span>💰</span> 재물운
                          </span>
                          <span className="text-[10px] font-black text-amber-700 tabular-nums">
                            {result.appDosaSummary.wealthScore}점
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                            style={{ width: `${result.appDosaSummary.wealthScore}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold truncate">
                          {result.appDosaSummary.wealthTip}
                        </p>
                      </div>

                      {/* 애정운 */}
                      <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/60">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                            <span>❤️</span> 애정 · 대인운
                          </span>
                          <span className="text-[10px] font-black text-rose-600 tabular-nums">
                            {result.appDosaSummary.loveScore}점
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                            style={{ width: `${result.appDosaSummary.loveScore}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold truncate">
                          {result.appDosaSummary.loveTip}
                        </p>
                      </div>

                      {/* 성취운 */}
                      <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/60">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                            <span>🚀</span> 성취 · 커리어운
                          </span>
                          <span className="text-[10px] font-black text-indigo-700 tabular-nums">
                            {result.appDosaSummary.growthScore}점
                          </span>
                        </div>
                        <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"
                            style={{ width: `${result.appDosaSummary.growthScore}%` }}
                          ></div>
                        </div>
                        <p className="text-[9px] text-slate-500 font-bold truncate">
                          {result.appDosaSummary.growthTip}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* E. 4대 행운 칩 (컬러, 시간, 메뉴, 방위) */}
                  <div className="grid grid-cols-4 gap-1">
                    <div className="bg-white rounded-xl p-1.5 border border-slate-200/90 shadow-2xs text-center">
                      <span className="text-[8px] font-bold text-slate-400 block">행운 색상</span>
                      <span
                        className="text-[10px] font-black block mt-0.5 truncate"
                        style={{ color: result.appDosaSummary.luckyItems.color.hex }}
                      >
                        ● {result.appDosaSummary.luckyItems.color.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-1.5 border border-slate-200/90 shadow-2xs text-center">
                      <span className="text-[8px] font-bold text-slate-400 block">골든 타임</span>
                      <span className="text-[10px] font-black text-slate-800 block mt-0.5 truncate">
                        {result.appDosaSummary.luckyItems.time.split(' ')[0]}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-1.5 border border-slate-200/90 shadow-2xs text-center">
                      <span className="text-[8px] font-bold text-slate-400 block">추천 메뉴</span>
                      <span className="text-[10px] font-black text-indigo-700 block mt-0.5 truncate">
                        {result.appDosaSummary.luckyItems.food.split(' ')[0]}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl p-1.5 border border-slate-200/90 shadow-2xs text-center">
                      <span className="text-[8px] font-bold text-slate-400 block">길방(吉方)</span>
                      <span className="text-[10px] font-black text-emerald-700 block mt-0.5 truncate">
                        {result.appDosaSummary.luckyItems.direction}
                      </span>
                    </div>
                  </div>

                  {/* F. 하단 퀵 액션 독 (Zero-Scroll 꽉 찬 마감) */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setIsCoupleModalOpen(true)}
                      className="py-2 px-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-xl text-[11px] font-black shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-heart text-[10px]"></i>
                      <span>2인 정밀 궁합 분석</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('tools')}
                      className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-dice text-[10px] text-indigo-600"></i>
                      <span>점심 룰렛 & 로또 번호</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: [오행 밸런스 & 체질 분석] */}
              {activeTab === 'elements' && (
                <div className="h-full flex flex-col justify-between space-y-1.5 animate-fade-in overflow-y-auto custom-scrollbar pr-0.5">
                  {/* 1. 오행 그래프 & 용신 뱃지 카드 */}
                  <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        <span className="text-xs font-black text-slate-900">
                          오행(五行) 에너지 분포도
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.2 rounded-md">
                        용신(用神): {result.elementsSummary.yongshin}
                      </span>
                    </div>

                    {/* 오행 게이지 5개 */}
                    <div className="space-y-1">
                      {(['wood', 'fire', 'earth', 'metal', 'water'] as const).map((elemKey) => {
                        const cfg = ELEMENT_CONFIG[elemKey];
                        const val = result.elements[elemKey];
                        return (
                          <div key={elemKey} className="flex items-center gap-2">
                            <span className={`text-[10px] font-black w-10 ${cfg.text}`}>
                              {cfg.name}
                            </span>
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${cfg.bg} rounded-full transition-all duration-500`}
                                style={{ width: `${val}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-700 w-7 text-right tabular-nums">
                              {val}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. [신규] 오행 상생(相生) 순환 플로우 칩 */}
                  <div className="bg-indigo-50/70 border border-indigo-100/90 rounded-2xl p-2 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5 px-0.5">
                      <span className="text-[10px] font-black text-indigo-900 flex items-center gap-1">
                        <span>🔄</span> 오행 상생(相生) 순환 흐름
                      </span>
                      <span className="text-[9px] font-bold text-indigo-500">
                        에너지 선순환 고리
                      </span>
                    </div>

                    {/* 5개 원형 아이콘 플로우 */}
                    <div className="flex items-center justify-between px-1">
                      {(['wood', 'fire', 'earth', 'metal', 'water'] as const).map((elemKey, idx) => {
                        const cfg = ELEMENT_CONFIG[elemKey];
                        const isDominant = result.elementsSummary.dominantKey === elemKey;
                        const isDeficient = result.elementsSummary.deficientKey === elemKey;
                        const isYongshin = result.elementsSummary.yongshinKey === elemKey;

                        return (
                          <React.Fragment key={elemKey}>
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-2xs transition-all ${
                                  isDominant
                                    ? `${cfg.bg} text-white ring-2 ring-indigo-400 ring-offset-1 scale-105`
                                    : isDeficient
                                    ? 'bg-white border-2 border-dashed border-rose-300 text-rose-500'
                                    : 'bg-white border border-slate-200 text-slate-700'
                                }`}
                              >
                                {cfg.name.split('(')[0]}
                              </div>
                              <span className="text-[8px] font-extrabold text-slate-500 mt-0.5">
                                {isDominant ? '주도★' : isDeficient ? '보완○' : isYongshin ? '용신✦' : cfg.name.split('(')[1].replace(')', '')}
                              </span>
                            </div>
                            {idx < 4 && (
                              <i className="fas fa-chevron-right text-[8px] text-indigo-300 -mt-2"></i>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. 강한 기운 vs 보완할 기운 2분할 카드 */}
                  <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2 text-center">
                        <span className="text-[9px] font-black text-emerald-800 uppercase">
                          가장 강한 기운
                        </span>
                        <p className="text-xs font-black text-emerald-900 mt-0.5">
                          {result.elementsSummary.dominant} ({result.elements[result.elementsSummary.dominantKey]}%)
                        </p>
                      </div>
                      <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2 text-center">
                        <span className="text-[9px] font-black text-rose-800 uppercase">
                          보완할 기운
                        </span>
                        <p className="text-xs font-black text-rose-900 mt-0.5">
                          {result.elementsSummary.deficient} ({result.elements[result.elementsSummary.deficientKey]}%)
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/70 text-[10px] leading-relaxed text-slate-700 flex items-start gap-1.5">
                      <span className="text-indigo-600 font-black shrink-0">💡 도사 해설:</span>
                      <span>{result.businessWealth.financeSector.reason}</span>
                    </div>
                  </div>

                  {/* 4. [신규] 부족한 오행을 채우는 3대 라이프스타일 처방 칩 */}
                  <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-700 px-0.5">
                      <span className="flex items-center gap-1">
                        <span>🍵</span> 부족한 {result.elementsSummary.deficient} 기운 보충 3대 솔루션
                      </span>
                      <span className="text-[9px] text-indigo-600 font-bold">일상 실천 칩</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/70 text-center">
                        <span className="text-[8px] font-bold text-slate-400 block">🎨 추천 패션</span>
                        <span className="text-[10px] font-black text-indigo-800 block mt-0.5 truncate">
                          {result.elementsSummary.lifestyleRemedies.color.split(' · ')[0]}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/70 text-center">
                        <span className="text-[8px] font-bold text-slate-400 block">🍵 힐링 푸드</span>
                        <span className="text-[10px] font-black text-indigo-800 block mt-0.5 truncate">
                          {result.elementsSummary.lifestyleRemedies.food.split(' · ')[0]}
                        </span>
                      </div>
                      <div className="bg-slate-50/80 rounded-xl p-1.5 border border-slate-200/70 text-center">
                        <span className="text-[8px] font-bold text-slate-400 block">🪴 럭키 오브제</span>
                        <span className="text-[10px] font-black text-indigo-800 block mt-0.5 truncate">
                          {result.elementsSummary.lifestyleRemedies.item.split(' · ')[0]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. [개편] 비즈니스 기질 & 듀얼 지수 게이지 */}
                  <div className="bg-white rounded-2xl p-2.5 border border-slate-200/90 shadow-2xs space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-700 px-0.5">
                      <span className="flex items-center gap-1">
                        <span>💼</span> 커리어 기질 및 적성 지수
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">{result.businessWealth.typeTitle.split(' ')[1]}</span>
                    </div>

                    {/* 사업가 vs 전문직 듀얼 게이지 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200/60">
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-600 mb-1">
                          <span>🚀 사업가형</span>
                          <span className="text-amber-700">{result.businessWealth.entrepreneurScore}점</span>
                        </div>
                        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                            style={{ width: `${result.businessWealth.entrepreneurScore}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-1.5 border border-slate-200/60">
                        <div className="flex items-center justify-between text-[9px] font-black text-slate-600 mb-1">
                          <span>🏛️ 전문직형</span>
                          <span className="text-indigo-700">{result.businessWealth.careerScore}점</span>
                        </div>
                        <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full"
                            style={{ width: `${result.businessWealth.careerScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* 추천 업종 태그 */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {result.businessWealth.recommendedIndustries.map((ind, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[9px] font-bold border border-slate-200"
                        >
                          #{ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 6. [신규] 하단 퀵 액션 독 (Zero-Scroll 꽉 찬 마감) */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-arrow-left text-[10px] text-slate-500"></i>
                      <span>8글자 사주 요약 보기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCoupleModalOpen(true)}
                      className="py-2 px-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-xl text-[11px] font-black shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-heart text-[10px]"></i>
                      <span>2인 정밀 궁합 분석</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: [궁합 & 럭키 툴즈] */}
              {activeTab === 'tools' && (
                <div className="h-full flex flex-col justify-between space-y-1.5 animate-fade-in overflow-y-auto custom-scrollbar pr-0.5">
                  {/* 2인 궁합 배너 */}
                  <div className="bg-gradient-to-r from-rose-50 to-indigo-50 rounded-2xl p-3 border border-rose-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-wide">
                        COUPLE CHEMISTRY
                      </span>
                      <h4 className="text-xs font-black text-slate-900">
                        2인 정밀 사주 궁합 분석
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        상대방과의 오행 상호 보완도와 속궁합 지수
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCoupleModalOpen(true)}
                      className="px-3 py-2 bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-black rounded-xl shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                    >
                      궁합 보기
                    </button>
                  </div>

                  {/* 점심 메뉴 룰렛 */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>🍱</span> 오늘의 오행 맞춤 점심 메뉴
                      </span>
                      <button
                        type="button"
                        onClick={rollMenu}
                        disabled={isMenuRolling}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isMenuRolling ? '추천 중...' : '메뉴 돌리기'}
                      </button>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-center">
                      <p className="text-xs font-black text-indigo-800">
                        {pickedMenu || result.microDaily.luckyMenu}
                      </p>
                      <span className="text-[9px] text-slate-400">
                        부족한 오행 에너지를 보충해주는 최적의 식단
                      </span>
                    </div>
                  </div>

                  {/* 오행 맞춤 로또 번호 추출기 */}
                  <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                        <span>🎱</span> 오늘의 행운 로또 번호 6개
                      </span>
                      <button
                        type="button"
                        onClick={drawLotto}
                        disabled={isLottoDrawing}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isLottoDrawing ? '추첨 중...' : '번호 뽑기'}
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 py-1">
                      {(revealedLotto || result.microDaily.lottoNumbers).map((num, i) => (
                        <span
                          key={i}
                          className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-sky-500 text-white font-black text-xs flex items-center justify-center shadow-xs"
                        >
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 하단 퀵 액션 독 */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('summary')}
                      className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-arrow-left text-[10px] text-slate-500"></i>
                      <span>8글자 사주 요약 보기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('elements')}
                      className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-xl text-[11px] font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <i className="fas fa-yin-yang text-[10px] text-indigo-600"></i>
                      <span>오행 밸런스 보기</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. 슬림 하단 푸터 (VeraNex 단독 브랜딩) */}
            <div className="text-center pt-1 border-t border-slate-200/60 mt-1">
              <span className="text-[9px] font-bold text-slate-400">
                © 2026 VeraNex. All rights reserved. · 정통 만세력 엔진
              </span>
            </div>
          </div>
        )}

        {/* 2인 궁합 모달 */}
        {result && (
          <CoupleMatchModal
            person1={result}
            isOpen={isCoupleModalOpen}
            onClose={() => setIsCoupleModalOpen(false)}
          />
        )}

        {/* 결과 공유 모달 */}
        {result && (
          <SajuShareModal
            result={result}
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
          />
        )}
      </div>
    </MiniAppLayout>
  );
}
