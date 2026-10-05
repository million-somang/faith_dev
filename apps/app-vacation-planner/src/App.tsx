import React, { useState, useEffect, useMemo } from 'react';
import { findOptimalVacationPlans } from './utils/vacationOptimizer';
import { VacationPlan } from './types/vacation';
import { MiniCalendarView } from './components/MiniCalendarView';
import { VacationResultCard } from './components/VacationResultCard';
import { HolidayCalendarTab } from './components/HolidayCalendarTab';
import { VacationTipsTab } from './components/VacationTipsTab';
import { PlannerFaqTab } from './components/PlannerFaqTab';
import { PolicyModal, PolicyType } from './components/PolicyModal';
import { usePlannerSound } from './hooks/usePlannerSound';

type TabType = 'planner' | 'calendar' | 'tips' | 'faq';

export const App: React.FC = () => {
  // Splash screen state (4 seconds = 4000ms)
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(1);

  // Sound hook
  const { isMuted, toggleSound, playClick, playSelect, playFanfare, playCopy } = usePlannerSound();

  // App core states
  const [currentTab, setCurrentTab] = useState<TabType>('planner');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [vacationDays, setVacationDays] = useState<number>(3); // Default 3 days as in prompt
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<number>(5); // Default to May or plan's month

  // Policy modal state
  const [policyType, setPolicyType] = useState<PolicyType>(null);

  // 4s Splash Progress Simulation
  useEffect(() => {
    const startTime = Date.now();
    const duration = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // Calculate vacation plans
  const plans = useMemo(() => {
    return findOptimalVacationPlans(selectedYear, vacationDays);
  }, [selectedYear, vacationDays]);

  // Selected or best plan
  const activePlan = useMemo(() => {
    if (plans.length === 0) return null;
    if (selectedPlanId) {
      const found = plans.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    return plans[0];
  }, [plans, selectedPlanId]);

  // Sync calendar month with active plan
  useEffect(() => {
    if (activePlan) {
      setCalendarMonth(activePlan.month);
    }
  }, [activePlan]);

  const handlePresetClick = (days: number) => {
    playSelect();
    setVacationDays(days);
    setSelectedPlanId(null);
  };

  const handlePlanSelect = (plan: VacationPlan) => {
    playClick();
    setSelectedPlanId(plan.id);
    setCalendarMonth(plan.month);
  };

  const handleCalculateClick = () => {
    playFanfare();
    // Re-focus or highlight best plan
    if (plans.length > 0) {
      setSelectedPlanId(plans[0].id);
      setCalendarMonth(plans[0].month);
    }
  };

  const handlePrevMonth = () => {
    playClick();
    setCalendarMonth((prev) => (prev > 1 ? prev - 1 : 12));
  };

  const handleNextMonth = () => {
    playClick();
    setCalendarMonth((prev) => (prev < 12 ? prev + 1 : 1));
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 flex items-center justify-center p-0 sm:p-4 text-slate-800 antialiased font-sans">
      {/* 450px x 850px Popup Container with Zero-Scroll Standard */}
      <div className="w-full max-w-[450px] min-h-[850px] bg-slate-50 border border-slate-200/80 shadow-2xl rounded-none sm:rounded-3xl flex flex-col overflow-hidden relative">
        {/* ============================================================== */}
        {/* 4-SECOND SPLASH SCREEN (miniapp.md Standard) */}
        {/* ============================================================== */}
        {loading && (
          <div className="loading-screen loading-container absolute inset-0 z-50 bg-gradient-to-b from-slate-50 via-white to-indigo-50/40 flex flex-col justify-between p-6 animate-fade-in">
            {/* Top brand header */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span className="tracking-widest uppercase">VeraNex MiniApp</span>
              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 text-[10px]">
                v3.0 Certified
              </span>
            </div>

            {/* Center animated hero */}
            <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-sky-500 shadow-xl shadow-indigo-200 flex items-center justify-center text-white text-3xl animate-bounce">
                <i className="fas fa-calendar-check"></i>
              </div>

              <div className="space-y-1">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  연차 극대화 플래너
                </h1>
                <p className="text-xs font-bold text-indigo-600">
                  황금연휴 루팡기 & 연휴 최적화 엔진
                </p>
                <p className="text-[11px] text-slate-500 max-w-[260px] mx-auto pt-1 leading-relaxed">
                  2026-2027 대체공휴일 및 법정 연휴 전수 연산 중...
                </p>
              </div>

              {/* Progress counter & bar */}
              <div className="w-full max-w-[240px] space-y-2 pt-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                  <span>엔진 로딩 중</span>
                  <span className="text-indigo-600">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5 border border-slate-300/40">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-75"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Bottom Sponsored Ad Banner Slot */}
            <div className="w-full bg-white rounded-2xl p-3 border border-dashed border-slate-300 text-center shadow-xs">
              <div className="text-[9px] font-black text-slate-400 tracking-wider uppercase mb-1">
                SPONSORED ADVERTISEMENT
              </div>
              <div className="h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-bold text-slate-400 gap-2">
                <i className="fas fa-ad text-indigo-400"></i>
                <span>스마트 휴가 설계는 VeraNex 플랫폼과 함께</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* MAIN APPLICATION CONTAINER (Zero Dark Policy / Neumorphism) */}
        {/* ============================================================== */}
        {/* Top Header */}
        <header className="h-14 px-4 bg-white border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs text-sm">
              <i className="fas fa-umbrella-beach"></i>
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-900 leading-tight">
                연차 극대화 플래너
              </h2>
              <p className="text-[10px] font-bold text-indigo-600 leading-none">
                황금연휴 루팡기 🌴
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                toggleSound();
                playClick();
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title={isMuted ? '소리 켜기' : '소리 끄기'}
            >
              <i className={`fas ${isMuted ? 'fa-volume-mute text-rose-500' : 'fa-volume-up'}`}></i>
            </button>

            {/* Info / Policy */}
            <button
              onClick={() => {
                playClick();
                setPolicyType('about');
              }}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="도움말 & 정보"
            >
              <i className="fas fa-info-circle"></i>
            </button>
          </div>
        </header>

        {/* 4-Tab Navigation Bar */}
        <nav className="h-11 px-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-around shrink-0 text-xs font-extrabold text-slate-600">
          <button
            onClick={() => {
              playClick();
              setCurrentTab('planner');
            }}
            className={`flex-1 py-1.5 mx-1 rounded-xl text-center transition-all cursor-pointer ${
              currentTab === 'planner'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <i className="fas fa-calculator mr-1"></i>연차 플래너
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentTab('calendar');
            }}
            className={`flex-1 py-1.5 mx-1 rounded-xl text-center transition-all cursor-pointer ${
              currentTab === 'calendar'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <i className="fas fa-calendar-alt mr-1"></i>황금연휴 달력
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentTab('tips');
            }}
            className={`flex-1 py-1.5 mx-1 rounded-xl text-center transition-all cursor-pointer ${
              currentTab === 'tips'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <i className="fas fa-lightbulb mr-1"></i>꿀팁 가이드
          </button>
          <button
            onClick={() => {
              playClick();
              setCurrentTab('faq');
            }}
            className={`flex-1 py-1.5 mx-1 rounded-xl text-center transition-all cursor-pointer ${
              currentTab === 'faq'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60 font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <i className="fas fa-question mr-1"></i>FAQ
          </button>
        </nav>

        {/* Scrollable Content Body (Tab Views) */}
        <main className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
          {/* TAB 1: 연차 플래너 */}
          {currentTab === 'planner' && (
            <div className="space-y-3.5">
              {/* Controls card: Year & Vacation Days Input */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3">
                {/* Year Select & Header */}
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-slate-800">
                    남은 연차 일수 입력
                  </div>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200/60">
                    {[2026, 2027].map((y) => (
                      <button
                        key={y}
                        onClick={() => {
                          playClick();
                          setSelectedYear(y);
                        }}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedYear === y
                            ? 'bg-white text-indigo-700 shadow-xs font-black'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {y}년
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {[1, 2, 3, 5, 10].map((days) => (
                    <button
                      key={days}
                      onClick={() => handlePresetClick(days)}
                      data-screenshot-click={days === 3 ? 'action' : undefined}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                        vacationDays === days
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {days}일
                    </button>
                  ))}
                </div>

                {/* Stepper Input & Action */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                    <button
                      onClick={() => {
                        playClick();
                        setVacationDays((prev) => Math.max(1, prev - 1));
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-slate-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={vacationDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setVacationDays(Math.min(15, Math.max(1, val)));
                      }}
                      data-screenshot-input="3"
                      className="flex-1 text-center font-black text-slate-900 bg-transparent text-sm focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        playClick();
                        setVacationDays((prev) => Math.min(15, prev + 1));
                      }}
                      className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm cursor-pointer hover:bg-slate-100"
                    >
                      +
                    </button>
                    <span className="text-xs font-bold text-slate-400 ml-1.5 mr-1">일</span>
                  </div>

                  <button
                    onClick={handleCalculateClick}
                    data-screenshot-click="result"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98 transition-transform"
                  >
                    <i className="fas fa-magic"></i>
                    <span>최적 계산</span>
                  </button>
                </div>
              </div>

              {/* Best Result Hero Card */}
              {activePlan ? (
                <div data-screenshot-point="result" className="space-y-3">
                  <VacationResultCard
                    plan={activePlan}
                    onCopySound={playCopy}
                  />

                  {/* Monthly Calendar View */}
                  <MiniCalendarView
                    year={selectedYear}
                    month={calendarMonth}
                    plan={activePlan}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                  />

                  {/* Alternative Plans List */}
                  {plans.length > 1 && (
                    <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="text-xs font-black text-slate-700 flex items-center justify-between">
                        <span>다른 황금연휴 추천 루트 ({plans.length}개)</span>
                        <span className="text-[10px] text-slate-400">클릭 시 달력 반영</span>
                      </div>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-0.5">
                        {plans.slice(1, 6).map((plan) => {
                          const isSelected = plan.id === activePlan.id;
                          return (
                            <button
                              key={plan.id}
                              onClick={() => handlePlanSelect(plan)}
                              className={`w-full p-2 rounded-xl text-left border text-xs flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-indigo-50 border-indigo-300 font-extrabold text-indigo-900'
                                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="truncate mr-2">
                                <div className="font-bold truncate">{plan.title}</div>
                                <div className="text-[10px] text-slate-400">
                                  {plan.startDate.slice(5)} ~ {plan.endDate.slice(5)} (연차 {plan.vacationDaysUsed}일)
                                </div>
                              </div>
                              <span className="text-[11px] font-black text-indigo-600 shrink-0">
                                총 {plan.totalDays}일
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-slate-400 text-xs">
                  조건에 맞는 휴가 일정이 없습니다. 연차 일수를 조절해 보세요.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 황금연휴 달력 */}
          {currentTab === 'calendar' && (
            <HolidayCalendarTab
              year={selectedYear}
              onYearChange={(y) => {
                playClick();
                setSelectedYear(y);
              }}
            />
          )}

          {/* TAB 3: 연차 꿀팁 가이드 */}
          {currentTab === 'tips' && <VacationTipsTab />}

          {/* TAB 4: FAQ */}
          {currentTab === 'faq' && <PlannerFaqTab />}
        </main>

        {/* E-E-A-T Footer with Legal Links */}
        <footer className="h-10 px-3 bg-white border-t border-slate-200 flex items-center justify-between shrink-0 text-[10px] text-slate-400 font-medium">
          <div>© 2026 VeraNex Life Engine</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playClick();
                setPolicyType('privacy');
              }}
              className="hover:text-slate-600 underline cursor-pointer"
            >
              개인정보처리
            </button>
            <button
              onClick={() => {
                playClick();
                setPolicyType('terms');
              }}
              className="hover:text-slate-600 underline cursor-pointer"
            >
              이용약관
            </button>
            <button
              onClick={() => {
                playClick();
                setPolicyType('contact');
              }}
              className="hover:text-slate-600 underline cursor-pointer"
            >
              고객지원
            </button>
          </div>
        </footer>

        {/* Policy Modal */}
        <PolicyModal
          type={policyType}
          onClose={() => setPolicyType(null)}
        />
      </div>
    </div>
  );
};

export default App;
