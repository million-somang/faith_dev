import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@faithportal/mini-app-sdk';

export interface DdayItem {
  id: number;
  title: string;
  targetDate: string;
  mode: 'countdown' | 'countup' | 'datefinder';
  isAnniversary: boolean;
  color: string;
  emoji: string;
  createdAt: string;
}

interface DdayCalcProps {
  onShowToast: (msg: string) => void;
}

const COLOR_OPTIONS = [
  { key: '#ec4899', name: '로즈 핑크', gradient: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)' },
  { key: '#8b5cf6', name: '바이올렛', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' },
  { key: '#3b82f6', name: '오션 블루', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
  { key: '#10b981', name: '에메랄드', gradient: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)' },
  { key: '#f59e0b', name: '선셋 앰버', gradient: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)' },
] as const;

const EMOJI_OPTIONS = ['📅', '❤️', '✈️', '📚', '🎂', '🎓', '💪', '🏃', '🎵', '🎮', '🎬', '⚽'] as const;

function calculateDday(targetDate: string, mode: string, isAnniversary: boolean): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (mode === 'countdown') {
    if (diffDays === 0) return 'D-Day';
    if (diffDays > 0) return `D-${diffDays}`;
    return `D+${Math.abs(diffDays)}`;
  } else if (mode === 'countup') {
    const days = Math.abs(diffDays) + (isAnniversary ? 1 : 0);
    return `${days}일째`;
  } else {
    return target.toLocaleDateString('ko-KR');
  }
}

function getDiffDays(targetDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DdayCalc({ onShowToast }: DdayCalcProps) {
  const { user } = useAuth();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 로컬 스토리지 데이터 로드
  const [ddayData, setDdayData] = useState<DdayItem[]>(() => {
    try {
      const saved = localStorage.getItem('ddayData');
      return saved ? JSON.parse(saved) as DdayItem[] : [];
    } catch {
      return [];
    }
  });

  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 10);
  });
  const [currentMode, setCurrentMode] = useState<'countdown' | 'countup' | 'datefinder'>('countdown');
  const [isAnniversary, setIsAnniversary] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#ec4899');
  const [selectedEmoji, setSelectedEmoji] = useState('📅');

  const saveToLocal = useCallback((data: DdayItem[]) => {
    localStorage.setItem('ddayData', JSON.stringify(data));
  }, []);

  // 가장 가까운 Hero D-Day
  const heroDday = useMemo(() => {
    const upcoming = ddayData
      .filter(d => d.mode === 'countdown')
      .map(d => ({ ...d, diff: getDiffDays(d.targetDate) }))
      .filter(d => d.diff >= 0)
      .sort((a, b) => a.diff - b.diff);
    return upcoming[0] ?? (ddayData.length > 0 ? { ...ddayData[0], diff: getDiffDays(ddayData[0].targetDate) } : null);
  }, [ddayData]);

  // 프리셋 설정
  const handlePreset = (type: 'christmas' | 'newyear' | 'exam') => {
    const now = new Date();
    const year = now.getFullYear();

    if (type === 'christmas') {
      const x = new Date(year, 11, 25);
      if (x < now) x.setFullYear(year + 1);
      setTitle('크리스마스 🎄');
      setTargetDate(x.toISOString().slice(0, 10));
      setSelectedEmoji('🎄');
      setSelectedColor('#ec4899');
    } else if (type === 'newyear') {
      const n = new Date(year + 1, 0, 1);
      setTitle('새해 첫날 🎆');
      setTargetDate(n.toISOString().slice(0, 10));
      setSelectedEmoji('🎆');
      setSelectedColor('#3b82f6');
    } else {
      const e = new Date(year, 10, 19);
      if (e < now) e.setFullYear(year + 1);
      setTitle('수능 D-Day 📚');
      setTargetDate(e.toISOString().slice(0, 10));
      setSelectedEmoji('📚');
      setSelectedColor('#8b5cf6');
    }
    setCurrentMode('countdown');
    onShowToast('프리셋이 적용되었습니다!');
  };

  // D-Day 추가
  const addDday = async () => {
    if (!title.trim()) {
      alert('목표 제목을 입력해주세요.');
      titleInputRef.current?.focus();
      return;
    }
    if (!targetDate) {
      alert('목표 날짜를 선택해주세요.');
      return;
    }

    const newDday: DdayItem = {
      id: Date.now(),
      title: title.trim(),
      targetDate,
      mode: currentMode,
      isAnniversary,
      color: selectedColor,
      emoji: selectedEmoji,
      createdAt: new Date().toISOString(),
    };

    if (user) {
      try {
        const response = await fetch('/api/dday/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDday),
        });
        if (response.ok) {
          const data = await response.json() as { id: number };
          newDday.id = data.id;
        }
      } catch (error) {
        console.error('D-Day 추가 실패:', error);
      }
    }

    const updated = [newDday, ...ddayData];
    setDdayData(updated);
    saveToLocal(updated);

    // 초기화
    setTitle('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setTargetDate(tomorrow.toISOString().slice(0, 10));
    setIsAnniversary(false);

    onShowToast(`'${newDday.title}' 일정이 등록되었습니다! 🎉`);
  };

  // D-Day 삭제
  const deleteDday = async (id: number) => {
    if (!confirm('해당 일정을 삭제하시겠습니까?')) return;

    if (user) {
      try {
        await fetch(`/api/dday/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.error('D-Day 삭제 실패:', error);
      }
    }

    const updated = ddayData.filter(d => d.id !== id);
    setDdayData(updated);
    saveToLocal(updated);
    onShowToast('일정이 삭제되었습니다.');
  };

  // 원클릭 복사
  const handleCopyHero = () => {
    if (!heroDday) return;
    const ddayText = calculateDday(heroDday.targetDate, heroDday.mode, heroDday.isAnniversary);
    const copyText = `[${heroDday.title}] ${ddayText} (${heroDday.targetDate}) - FaithPortal D-Day 매니저`;
    navigator.clipboard.writeText(copyText).then(() => {
      onShowToast('D-Day 정보가 클립보드에 복사되었습니다! 📋');
    });
  };

  // 결과 공유
  const handleShareHero = () => {
    if (!heroDday) return;
    const ddayText = calculateDday(heroDday.targetDate, heroDday.mode, heroDday.isAnniversary);
    const shareData = {
      title: heroDday.title,
      text: `[${heroDday.title}] ${ddayText}! 함께 확인해보세요.`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator.share(shareData).catch(() => {});
    } else {
      handleCopyHero();
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── [화면 4] 프리미엄 클린 라이트 Hero D-Day 결과 리포트 카드 ── */}
      {heroDday && (
        <div
          data-screenshot-point="result"
          className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/90 space-y-4 animate-fade-in"
        >
          {/* 상단 뱃지 & 액션 */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-600">
                HERO D-DAY REPORT
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyHero}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-xl border border-slate-200 transition-all flex items-center gap-1 cursor-pointer"
                title="결과 복사"
              >
                <i className="fas fa-copy text-[10px]"></i>
                <span>복사</span>
              </button>
              <button
                type="button"
                onClick={handleShareHero}
                className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold rounded-xl border border-pink-200 transition-all flex items-center gap-1 cursor-pointer"
                title="공유하기"
              >
                <i className="fas fa-share-alt text-[10px]"></i>
                <span>공유</span>
              </button>
            </div>
          </div>

          {/* 거대 히어로 메트릭 (밝은 배경 + 볼드 텍스트) */}
          <div className="bg-gradient-to-br from-pink-50/70 via-purple-50/40 to-white rounded-2xl p-4 sm:p-5 border border-pink-100 text-center space-y-1">
            <div className="text-3xl mb-1">{heroDday.emoji}</div>
            <h3 className="text-base font-black text-slate-900 leading-snug">{heroDday.title}</h3>
            <div className="text-3xl sm:text-4xl font-black text-pink-600 tracking-tight my-1">
              {calculateDday(heroDday.targetDate, heroDday.mode, heroDday.isAnniversary)}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              기준일자: {heroDday.targetDate}
              {heroDday.diff !== undefined && heroDday.diff >= 0 && (
                <span> (앞으로 {heroDday.diff}일 남음)</span>
              )}
            </p>

            {/* 진행률 프로그레스 바 */}
            {heroDday.diff !== undefined && heroDday.diff >= 0 && (
              <div className="w-full max-w-xs mx-auto bg-pink-100/80 rounded-full h-2 overflow-hidden mt-3 p-0.5">
                <div
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, 100 - (heroDday.diff / 30 * 100)))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── [화면 3] 메인 입력 카드 ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* 상단 안내 배너 */}
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-pink-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <i className="fas fa-heart text-xs"></i>
          </div>
          <div className="text-xs leading-relaxed">
            <p className="font-black text-pink-900">2026 스마트 D-Day & 기념일 연산</p>
            <p className="text-slate-600 text-[11px]">
              목표일을 등록하면 남은 일수를 실시간 계산하여 상단 리포트 카드에 즉시 시각화합니다.
            </p>
          </div>
        </div>

        {/* 퀵 프리셋 칩 (Quick Chips with data-screenshot-click="action") */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">
            <i className="fas fa-bolt text-amber-500 mr-1"></i>빠른 목표 프리셋
          </label>
          <div className="flex gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
            <button
              type="button"
              onClick={() => handlePreset('christmas')}
              data-screenshot-click="action"
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shrink-0 transition-all cursor-pointer"
            >
              🎄 크리스마스
            </button>
            <button
              type="button"
              onClick={() => handlePreset('newyear')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 shrink-0 transition-all cursor-pointer"
            >
              🎆 새해 첫날
            </button>
            <button
              type="button"
              onClick={() => handlePreset('exam')}
              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 shrink-0 transition-all cursor-pointer"
            >
              📚 수능 D-Day
            </button>
          </div>
        </div>

        {/* 제목 입력창 (with data-screenshot-input) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            일정 제목 <span className="text-rose-500">*</span>
          </label>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            data-screenshot-input="유럽 여행 ✈️"
            placeholder="예: 유럽 여행 ✈️, 자격증 시험 📚"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-500 outline-none transition-all"
          />
        </div>

        {/* 날짜 입력창 */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            목표 일자 <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-pink-500 outline-none transition-all"
          />
        </div>

        {/* 모드 선택 세그먼트 토글 */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">계산 방식</label>
          <div className="grid grid-cols-3 gap-1.5">
            {(['countdown', 'countup', 'datefinder'] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setCurrentMode(mode)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  currentMode === mode
                    ? 'bg-pink-50 border-pink-400 text-pink-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {mode === 'countdown' ? 'D-Day' : mode === 'countup' ? '기념일' : '날짜찾기'}
              </button>
            ))}
          </div>
        </div>

        {/* 기념일 당일 1일 포함 체크박스 */}
        {currentMode === 'countup' && (
          <div className="bg-pink-50/50 p-2.5 rounded-xl border border-pink-100">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAnniversary}
                onChange={e => setIsAnniversary(e.target.checked)}
                className="w-3.5 h-3.5 accent-pink-500 rounded cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-700">
                기준일을 1일로 포함 (커플·기념일용)
              </span>
            </label>
          </div>
        )}

        {/* 대표 이모지 선택 */}
        <div>
          <label className="block text-[11px] font-bold text-slate-700 mb-1.5">대표 이모지</label>
          <div className="grid grid-cols-6 gap-1.5">
            {EMOJI_OPTIONS.map(emoji => (
              <button
                key={emoji}
                type="button"
                onClick={() => setSelectedEmoji(emoji)}
                className={`text-lg py-1.5 rounded-xl border transition-all text-center cursor-pointer ${
                  selectedEmoji === emoji
                    ? 'bg-pink-50 border-pink-400 ring-2 ring-pink-300'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* 대형 CTA 등록 버튼 (with data-screenshot-click="result") */}
        <button
          type="button"
          onClick={addDday}
          data-screenshot-click="result"
          className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <i className="fas fa-plus-circle text-white text-sm"></i>
          <span>새 D-Day 리스트에 등록하기</span>
        </button>
      </div>

      {/* ── 등록된 D-Day 일정 목록 ── */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <i className="fas fa-list-check text-pink-600"></i>
            <span>나의 목표 일정 리스트</span>
            <span className="text-slate-400 font-bold">({ddayData.length})</span>
          </h4>
        </div>

        {ddayData.length === 0 ? (
          <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <i className="fas fa-calendar-plus text-2xl mb-1.5 text-slate-300 block"></i>
            <p className="text-xs font-bold text-slate-600">등록된 일정이 아직 없습니다.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">상단에서 소중한 첫 번째 목표를 등록해 보세요.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ddayData.map(item => {
              const ddayText = calculateDday(item.targetDate, item.mode, item.isAnniversary);
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <h5 className="font-black text-xs text-slate-900 leading-tight">{item.title}</h5>
                      <span className="text-[10px] text-slate-400">{item.targetDate}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-pink-600 bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-xl shadow-2xs">
                      {ddayText}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteDday(item.id)}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition-all cursor-pointer"
                      title="삭제"
                    >
                      <i className="fas fa-trash-alt text-[10px]"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
