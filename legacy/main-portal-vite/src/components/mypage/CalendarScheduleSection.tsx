import React from 'react';

interface CalendarScheduleSectionProps {
    calYear: number;
    calMonth: number;
    calendarDays: any[];
    selectedDate: string | null;
    setSelectedDate: (date: string | null) => void;
    handlePrevMonth: () => void;
    handleNextMonth: () => void;
    handleGoToday: () => void;
    isPushSubscribed: boolean;
    pushLoading: boolean;
    handleTogglePush: () => void;
    schedulesByDate: Record<string, any[]>;
    displaySchedules: any[];
    newAgendaDate: string;
    setNewAgendaDate: (date: string) => void;
    newAgendaEndDate: string;
    setNewAgendaEndDate: (date: string) => void;
    newAgendaTime: string;
    setNewAgendaTime: (time: string) => void;
    newAgendaEndTime: string;
    setNewAgendaEndTime: (time: string) => void;
    isAllDay: boolean;
    handleToggleAllDay: () => void;
    newAgendaText: string;
    setNewAgendaText: (text: string) => void;
    newAgendaColor: string;
    setNewAgendaColor: (color: string) => void;
    handleSetPresetDuration: (days: number) => void;
    handleAddAgenda: (e: React.FormEvent) => void;
    handleRemoveAgenda: (id: string | number) => void;
    SCHEDULE_COLOR_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; badge: string; dot: string }>;
}

export const CalendarScheduleSection: React.FC<CalendarScheduleSectionProps> = ({
    calYear,
    calMonth,
    calendarDays,
    selectedDate,
    setSelectedDate,
    handlePrevMonth,
    handleNextMonth,
    handleGoToday,
    isPushSubscribed,
    pushLoading,
    handleTogglePush,
    schedulesByDate,
    displaySchedules,
    newAgendaDate,
    setNewAgendaDate,
    newAgendaEndDate,
    setNewAgendaEndDate,
    newAgendaTime,
    setNewAgendaTime,
    newAgendaEndTime,
    setNewAgendaEndTime,
    isAllDay,
    handleToggleAllDay,
    newAgendaText,
    setNewAgendaText,
    newAgendaColor,
    setNewAgendaColor,
    handleSetPresetDuration,
    handleAddAgenda,
    handleRemoveAgenda,
    SCHEDULE_COLOR_CONFIG,
}) => {
    return (
        <div className="animate-fade-in space-y-6">
            {/* 상단 캘린더 헤더 & 컨트롤 카드 */}
            <div className="border border-slate-200 rounded-3xl p-5 sm:p-7 bg-white shadow-sm flex flex-col gap-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md shadow-emerald-200">
                            <i className="fas fa-calendar-alt"></i>
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-800 text-xl tracking-tight flex items-center gap-2">
                                나의 일정 달력
                                {selectedDate && (
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        {selectedDate} 선택됨
                                    </span>
                                )}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                                월별 캘린더와 색상별 카테고리로 나만의 일정을 손쉽게 관리하세요.
                            </p>
                        </div>
                    </div>

                    {/* 월 네비게이션 & 알림 */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-200">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition-all shadow-2xs"
                                title="이전 달"
                            >
                                <i className="fas fa-chevron-left"></i>
                            </button>
                            <span className="font-black text-slate-800 font-mono text-base px-3">
                                {calYear}년 {calMonth}월
                            </span>
                            <button
                                type="button"
                                onClick={handleNextMonth}
                                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center text-xs font-bold transition-all shadow-2xs"
                                title="다음 달"
                            >
                                <i className="fas fa-chevron-right"></i>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleGoToday}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
                        >
                            오늘
                        </button>

                        <button
                            type="button"
                            onClick={handleTogglePush}
                            disabled={pushLoading}
                            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                                isPushSubscribed
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                            }`}
                            title="일정 1시간 전 모바일 푸시 알림 설정"
                        >
                            <i className={`fas ${isPushSubscribed ? 'fa-bell text-emerald-600' : 'fa-bell-slash text-slate-900'} ${pushLoading ? 'animate-spin' : ''}`}></i>
                            {pushLoading ? '설정 중...' : isPushSubscribed ? '1시간 전 알림 ON' : '🔔 1시간 전 알림 켜기'}
                        </button>
                    </div>
                </div>

                {/* 본문: 달력 그리드 (좌측 3열) + 일정 등록/목록 (우측 2열) */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                    {/* 좌측 (3/5): 7×6 월별 달력 그리드 */}
                    <div className="lg:col-span-3 flex flex-col">
                        {/* 요일 헤더 */}
                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                                <div
                                    key={day}
                                    className={`py-1.5 font-black text-xs ${
                                        idx === 0 ? 'text-rose-500 bg-rose-50/40 rounded-lg' : idx === 6 ? 'text-blue-500 bg-blue-50/40 rounded-lg' : 'text-slate-600 bg-slate-50 rounded-lg'
                                    }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* 달력 날짜 타일 그리드 */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {calendarDays.map((cell: any) => {
                                const daySchedules = schedulesByDate[cell.dateStr] || [];
                                const isSelected = selectedDate === cell.dateStr;

                                return (
                                    <div
                                        key={cell.dateStr}
                                        onClick={() => {
                                            setSelectedDate(cell.dateStr);
                                            setNewAgendaDate(cell.dateStr);
                                            setNewAgendaEndDate(cell.dateStr);
                                        }}
                                        className={`min-h-[72px] sm:min-h-[86px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative group ${
                                            !cell.isCurrentMonth
                                                ? 'bg-slate-50/40 border-slate-100 opacity-40 hover:opacity-80'
                                                : isSelected
                                                ? 'bg-emerald-50/70 border-emerald-400 ring-2 ring-emerald-400 shadow-sm'
                                                : cell.isToday
                                                ? 'bg-amber-50/70 border-amber-300 font-bold'
                                                : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-md'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <span className={`text-xs font-black font-mono leading-none ${
                                                cell.isToday
                                                    ? 'bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-md text-[10px]'
                                                    : isSelected
                                                    ? 'text-emerald-700 font-bold'
                                                    : cell.isCurrentMonth
                                                    ? 'text-slate-700'
                                                    : 'text-slate-400'
                                            }`}>
                                                {cell.dayNum || cell.date}
                                            </span>
                                            {daySchedules.length > 0 && (
                                                <span className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md">
                                                    {daySchedules.length}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-1 mt-1 overflow-hidden max-h-[42px]">
                                            {daySchedules.slice(0, 2).map((sched: any) => {
                                                const cConfig = SCHEDULE_COLOR_CONFIG[sched.color || 'blue'] || SCHEDULE_COLOR_CONFIG.blue;
                                                return (
                                                    <div
                                                        key={sched.id}
                                                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md truncate border ${cConfig.bg} ${cConfig.text} ${cConfig.border}`}
                                                    >
                                                        {sched.schedule_text || sched.title || sched.text}
                                                    </div>
                                                );
                                            })}
                                            {daySchedules.length > 2 && (
                                                <span className="text-[8px] font-bold text-slate-400 pl-0.5">
                                                    +{daySchedules.length - 2}개 더보기
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* 우측 (2/5): 선택 날짜 일정 추가 폼 & 일정 목록 */}
                    <div className="lg:col-span-2 flex flex-col gap-4 bg-slate-50/90 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
                        <div>
                            <h4 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <i className="fas fa-plus-circle text-emerald-600"></i> 일정 추가
                                </span>
                                <span className="text-xs font-mono font-semibold text-slate-500">
                                    {newAgendaDate === newAgendaEndDate ? newAgendaDate : `${newAgendaDate} ~ ${newAgendaEndDate}`}
                                </span>
                            </h4>

                            <form onSubmit={handleAddAgenda} className="flex flex-col gap-2.5">
                                <div className="flex flex-col gap-1 bg-white p-2.5 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600">
                                        <span><i className="far fa-calendar-alt text-emerald-500 mr-1"></i> 일정 기간</span>
                                        <div className="flex gap-1">
                                            <button type="button" onClick={() => handleSetPresetDuration(1)} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">당일</button>
                                            <button type="button" onClick={() => handleSetPresetDuration(2)} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">1박2일</button>
                                            <button type="button" onClick={() => handleSetPresetDuration(3)} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer">2박3일</button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <input
                                            type="date"
                                            value={newAgendaDate}
                                            onChange={(e) => {
                                                setNewAgendaDate(e.target.value);
                                                if (e.target.value > newAgendaEndDate) {
                                                    setNewAgendaEndDate(e.target.value);
                                                }
                                            }}
                                            className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                                        />
                                        <span className="text-slate-400 text-xs font-bold">~</span>
                                        <input
                                            type="date"
                                            value={newAgendaEndDate}
                                            min={newAgendaDate}
                                            onChange={(e) => setNewAgendaEndDate(e.target.value)}
                                            className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1 bg-white p-2.5 rounded-xl border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-extrabold text-slate-600"><i className="far fa-clock text-blue-500 mr-1"></i> 시간 범위</span>
                                        <button
                                            type="button"
                                            onClick={handleToggleAllDay}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all flex items-center gap-1 cursor-pointer ${
                                                isAllDay
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black'
                                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                                            }`}
                                        >
                                            <i className={`fas ${isAllDay ? 'fa-check-circle text-white' : 'fa-sun text-amber-500'}`}></i> 종일
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <input
                                            type="time"
                                            value={newAgendaTime}
                                            disabled={isAllDay}
                                            onChange={(e) => setNewAgendaTime(e.target.value)}
                                            className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                        <span className="text-slate-400 text-xs font-bold">~</span>
                                        <input
                                            type="time"
                                            value={newAgendaEndTime}
                                            disabled={isAllDay}
                                            onChange={(e) => setNewAgendaEndTime(e.target.value)}
                                            className="w-1/2 px-2 py-1 border border-slate-200 rounded-lg text-xs font-mono font-bold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400 disabled:bg-slate-100 disabled:text-slate-400"
                                        />
                                    </div>
                                </div>

                                <input
                                    type="text"
                                    placeholder="일정 내용을 입력하세요 (예: 2박3일 여행, 미팅)"
                                    value={newAgendaText}
                                    onChange={(e) => setNewAgendaText(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
                                />

                                <div className="flex items-center justify-between gap-1 bg-white p-2 rounded-xl border border-slate-200">
                                    <span className="text-[10px] font-bold text-slate-400 pl-1">카테고리:</span>
                                    <div className="flex items-center gap-1.5">
                                        {Object.entries(SCHEDULE_COLOR_CONFIG).map(([cKey, cVal]) => (
                                            <button
                                                key={cKey}
                                                type="button"
                                                onClick={() => setNewAgendaColor(cKey)}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${cVal.dot} ${
                                                    newAgendaColor === cKey ? 'ring-2 ring-slate-800 scale-110 shadow-sm' : 'opacity-70 hover:opacity-100'
                                                }`}
                                                title={cVal.label}
                                            >
                                                {newAgendaColor === cKey && (
                                                    <i className="fas fa-check text-[9px] text-white"></i>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-md active:scale-98 cursor-pointer"
                                >
                                    <i className="fas fa-check mr-1.5"></i> 일정 등록하기
                                </button>
                            </form>
                        </div>

                        {/* 선택 날짜 일정 리스트 */}
                        <div className="border-t border-slate-200/80 pt-3">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                                    <i className="fas fa-list-ul text-slate-500"></i>
                                    {selectedDate ? `${selectedDate} 일정` : '이번 달 전체 일정'}
                                </h5>
                                {selectedDate && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedDate(null)}
                                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
                                    >
                                        전체 보기
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {displaySchedules.length > 0 ? (
                                    displaySchedules.map((item: any) => {
                                        const cConfig = SCHEDULE_COLOR_CONFIG[item.color || 'blue'] || SCHEDULE_COLOR_CONFIG.blue;
                                        const sDate = item.schedule_date ? String(item.schedule_date).substring(0, 10) : '';
                                        const eDate = item.end_date ? String(item.end_date).substring(0, 10) : sDate;
                                        const sTime = item.schedule_time || item.time || '09:00';
                                        const eTime = item.end_time || '18:00';
                                        const isMultiDay = sDate && eDate && sDate !== eDate;
                                        const isAllDayItem = (sTime === '00:00' && (eTime === '23:59' || eTime === '24:00')) || sTime === '종일';

                                        return (
                                            <div
                                                key={item.id}
                                                className={`flex justify-between items-center p-2.5 rounded-xl text-xs border shadow-2xs relative group ${cConfig.bg} ${cConfig.border}`}
                                            >
                                                <div className="flex flex-col gap-0.5 overflow-hidden pr-6">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`font-mono text-[9px] font-black px-1.5 py-0.2 rounded-md shrink-0 ${cConfig.badge}`}>
                                                            {cConfig.label}
                                                        </span>
                                                        <span className={`font-bold truncate ${cConfig.text}`}>
                                                            {item.schedule_text || item.text}
                                                        </span>
                                                    </div>
                                                    <span className="font-bold text-slate-500 font-mono text-[10px]">
                                                        <i className="far fa-clock mr-1 text-[9px]"></i>
                                                        {isAllDayItem
                                                            ? (isMultiDay ? `${sDate.substring(5)} ~ ${eDate.substring(5)} [종일]` : '[종일]')
                                                            : (isMultiDay ? `${sDate.substring(5)} ${sTime} ~ ${eDate.substring(5)} ${eTime}` : `${sTime} ~ ${eTime}`)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAgenda(item.id)}
                                                    className="absolute right-2.5 top-3 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                    title="일정 삭제"
                                                >
                                                    <i className="fas fa-times text-xs"></i>
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-slate-400 text-xs py-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                                        {selectedDate ? `${selectedDate}에 등록된 일정이 없습니다.` : '등록된 일정이 없습니다.'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CalendarScheduleSection;
