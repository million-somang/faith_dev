import { useState } from 'react';
import { CATEGORY_LIST } from '../constants/todoMeta';
import type { TodoFilterState, TodoSortKey, TodoStatusFilter } from '../types/todo';

interface TodoFilterBarProps {
  readonly filter: TodoFilterState;
  readonly onChangeFilter: (next: TodoFilterState) => void;
  readonly activeCount: number;
  readonly completedCount: number;
  readonly todayCount: number;
  readonly totalCount: number;
}

const STATUS_TABS: { key: TodoStatusFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '진행중' },
  { key: 'today', label: '오늘' },
  { key: 'completed', label: '완료' },
];

export default function TodoFilterBar({
  filter,
  onChangeFilter,
  activeCount,
  completedCount,
  todayCount,
  totalCount,
}: TodoFilterBarProps) {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  const countByStatus = (status: TodoStatusFilter): number => {
    switch (status) {
      case 'active':
        return activeCount;
      case 'completed':
        return completedCount;
      case 'today':
        return todayCount;
      case 'all':
      default:
        return totalCount;
    }
  };

  return (
    <div className="space-y-1.5 shrink-0">
      <div className="flex items-center justify-between gap-1.5">
        {/* 상태 필터 알약 4종 (잘림 없이 100% 노출) */}
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {STATUS_TABS.map((tab) => {
            const isSelected = filter.status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeFilter({ ...filter, status: tab.key })}
                className={`px-2 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 border ${
                  isSelected
                    ? 'bg-[#2D2A26] text-white border-[#2D2A26] shadow-2xs'
                    : 'bg-white text-[#6B645B] border-[#EBE6DD] hover:bg-[#F5F2EB]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] font-mono ${
                    isSelected ? 'text-emerald-300' : 'text-[#A39C90]'
                  }`}
                >
                  {countByStatus(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 정렬 + 분류 + 검색 토글 */}
        <div className="flex items-center gap-1 shrink-0">
          <select
            value={filter.category}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                category: e.target.value as TodoFilterState['category'],
              })
            }
            aria-label="카테고리 필터"
            className="h-7 px-1.5 rounded-lg bg-white border border-[#EBE6DD] text-[10px] font-bold text-[#57514A] outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">분류</option>
            {CATEGORY_LIST.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.label}
              </option>
            ))}
          </select>

          <select
            value={filter.sortBy}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                sortBy: e.target.value as TodoSortKey,
              })
            }
            aria-label="정렬 기준 선택"
            className="h-7 px-1.5 rounded-lg bg-white border border-[#EBE6DD] text-[10px] font-bold text-[#57514A] outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="manual">기본순</option>
            <option value="priority">중요순</option>
            <option value="dueDate">마감순</option>
            <option value="createdAt">최신순</option>
          </select>

          <button
            type="button"
            onClick={() => {
              if (searchOpen && filter.searchQuery) {
                onChangeFilter({ ...filter, searchQuery: '' });
              }
              setSearchOpen((prev) => !prev);
            }}
            aria-label="할 일 검색 토글"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] transition-colors cursor-pointer ${
              searchOpen || filter.searchQuery
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-[#6B645B] border-[#EBE6DD] hover:bg-[#F5F2EB]'
            }`}
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* 검색창 */}
      {(searchOpen || filter.searchQuery) && (
        <div className="relative animate-fade-in">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A39C90]"></i>
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => onChangeFilter({ ...filter, searchQuery: e.target.value })}
            placeholder="제목 또는 메모 키워드 검색..."
            aria-label="할 일 검색어 입력"
            className="w-full h-8 pl-8 pr-8 rounded-xl bg-white border border-[#E2DDD3] focus:border-indigo-500 text-xs font-medium text-[#2D2A26] outline-none"
          />
          {filter.searchQuery && (
            <button
              type="button"
              onClick={() => onChangeFilter({ ...filter, searchQuery: '' })}
              aria-label="검색어 지우기"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#A39C90] hover:text-[#2D2A26] cursor-pointer"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
