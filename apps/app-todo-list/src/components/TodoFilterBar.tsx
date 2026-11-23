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
  const [filtersOpen, setFiltersOpen] = useState<boolean>(false);
  const hasActiveSortOrCategory = filter.category !== 'all' || filter.sortBy !== 'manual';

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
    <div className="bg-white shrink-0">
      <div className="px-3 border-b border-[#F1ECE3] flex items-center justify-between gap-2">
        {/* 상태 필터 언더라인 탭 5종 */}
        <div className="flex items-center gap-3 flex-1 min-w-0 overflow-x-auto hide-scrollbar">
          {STATUS_TABS.map((tab) => {
            const isSelected = filter.status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeFilter({ ...filter, status: tab.key })}
                className={`py-2 text-[12px] border-b-2 inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors ${
                  isSelected
                    ? 'font-black text-[#1C1917] border-[#1C1917]'
                    : 'font-semibold text-[#8E8579] hover:text-[#4D473F] border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono tabular-nums ${
                    isSelected ? 'text-indigo-600 font-black' : 'text-[#A8A29E]'
                  }`}
                >
                  {countByStatus(tab.key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* 접이식 분류·정렬 & 검색 토글 */}
        <div className="flex items-center gap-1 shrink-0 py-1">
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-label="분류 및 정렬 설정"
            aria-expanded={filtersOpen || hasActiveSortOrCategory}
            title="분류 · 정렬"
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] cursor-pointer transition-colors ${
              filtersOpen || hasActiveSortOrCategory
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-[#8E8579] hover:text-[#24211D] hover:bg-[#F5F1EA]'
            }`}
          >
            <i className="fas fa-sliders"></i>
          </button>

          <button
            type="button"
            onClick={() => {
              if (searchOpen && filter.searchQuery) {
                onChangeFilter({ ...filter, searchQuery: '' });
              }
              setSearchOpen((prev) => !prev);
            }}
            aria-label="할 일 검색 토글"
            aria-expanded={searchOpen || filter.searchQuery.length > 0}
            title="검색"
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] cursor-pointer transition-colors ${
              searchOpen || filter.searchQuery
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-[#8E8579] hover:text-[#24211D] hover:bg-[#F5F1EA]'
            }`}
          >
            <i className="fas fa-magnifying-glass"></i>
          </button>
        </div>
      </div>

      {/* 접이식 분류 · 정렬 바 */}
      {(filtersOpen || hasActiveSortOrCategory) && (
        <div className="px-3 py-2 bg-[#FAF8F5] border-b border-[#F1ECE3] flex items-center gap-2 animate-fade-in">
          <select
            value={filter.category}
            onChange={(e) =>
              onChangeFilter({
                ...filter,
                category: e.target.value as TodoFilterState['category'],
              })
            }
            aria-label="카테고리 필터"
            className="flex-1 h-7 px-2 rounded-lg bg-white border border-[#E5DDD0] text-[11px] font-bold text-[#4D473F] outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">분류: 전체</option>
            {CATEGORY_LIST.map((cat) => (
              <option key={cat.key} value={cat.key}>
                분류: {cat.label}
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
            className="flex-1 h-7 px-2 rounded-lg bg-white border border-[#E5DDD0] text-[11px] font-bold text-[#4D473F] outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="manual">정렬: 우선순위순</option>
            <option value="dueDate">정렬: 예정일순</option>
            <option value="createdAt">정렬: 최신순</option>
          </select>

          {hasActiveSortOrCategory && (
            <button
              type="button"
              onClick={() =>
                onChangeFilter({
                  ...filter,
                  category: 'all',
                  sortBy: 'manual',
                })
              }
              className="text-[11px] font-bold text-indigo-700 hover:underline px-1.5 shrink-0 cursor-pointer"
            >
              초기화
            </button>
          )}
        </div>
      )}

      {/* 검색 입력창 (Astryx TextInput) */}
      {(searchOpen || filter.searchQuery.length > 0) && (
        <div className="px-3 py-2 bg-[#FAF8F5] border-b border-[#F1ECE3] animate-fade-in">
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
