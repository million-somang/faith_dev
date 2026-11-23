import { useState } from 'react';
import { TextInput } from '@astryxdesign/core/TextInput';
import { CATEGORY_LIST } from '../constants/todoMeta';
import type { TodoFilterState, TodoSortKey, TodoStatusFilter } from '../types/todo';

interface TodoFilterBarProps {
  readonly filter: TodoFilterState;
  readonly onChangeFilter: (next: TodoFilterState) => void;
  readonly activeCount: number;
  readonly completedCount: number;
  readonly recurringCount: number;
  readonly todayCount: number;
  readonly totalCount: number;
}

const STATUS_TABS: { key: TodoStatusFilter; label: string }[] = [
  { key: 'today', label: '오늘' },
  { key: 'active', label: '진행' },
  { key: 'recurring', label: '반복' },
  { key: 'completed', label: '완료' },
  { key: 'all', label: '전체' },
];

export default function TodoFilterBar({
  filter,
  onChangeFilter,
  activeCount,
  completedCount,
  recurringCount,
  todayCount,
  totalCount,
}: TodoFilterBarProps) {
  const [searchOpen, setSearchOpen] = useState<boolean>(false);

  const countByStatus = (status: TodoStatusFilter): number => {
    switch (status) {
      case 'active':
        return activeCount;
      case 'recurring':
        return recurringCount;
      case 'today':
        return todayCount;
      case 'completed':
        return completedCount;
      case 'all':
      default:
        return totalCount;
    }
  };

  return (
    <div className="px-2.5 py-1.5 border-b border-[#EFE8DC] bg-[#FCFBF8] space-y-1.5 shrink-0">
      <div className="flex items-center justify-between gap-1">
        {/* 상태 필터 알약 5종 (430px 내 0px 클리핑) */}
        <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
          {STATUS_TABS.map((tab) => {
            const isSelected = filter.status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeFilter({ ...filter, status: tab.key })}
                className={`px-2 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 border ${
                  isSelected
                    ? 'bg-[#24211D] text-white border-[#24211D]'
                    : 'bg-white/90 text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] font-mono ${
                    isSelected ? 'text-emerald-300' : 'text-[#9B9183]'
                  }`}
                >
                  {countByStatus(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 분류 + 정렬 + 검색 토글 */}
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
            className="h-7 px-1 rounded-lg bg-white border border-[#E5DDD0] text-[10px] font-bold text-[#4D473F] outline-none focus:border-indigo-500 cursor-pointer"
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
            className="h-7 px-1 rounded-lg bg-white border border-[#E5DDD0] text-[10px] font-bold text-[#4D473F] outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="manual">우선순위순</option>
            <option value="dueDate">예정일순</option>
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
            title="검색"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] cursor-pointer transition-colors ${
              searchOpen || filter.searchQuery
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-[#6C655B] border-[#E5DDD0] hover:bg-[#F2EDE4]'
            }`}
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* 검색 입력창 (Astryx TextInput) */}
      {(searchOpen || filter.searchQuery.length > 0) && (
        <div className="animate-fade-in">
          <TextInput
            type="search"
            label="할 일 제목 또는 메모 검색"
            isLabelHidden
            size="sm"
            width="100%"
            hasClear
            value={filter.searchQuery}
            onChange={(val) => onChangeFilter({ ...filter, searchQuery: val })}
            placeholder="제목, 메모, 반복 규칙 검색..."
            startIcon={<i className="fas fa-magnifying-glass text-[10px]"></i>}
          />
        </div>
      )}
    </div>
  );
}
