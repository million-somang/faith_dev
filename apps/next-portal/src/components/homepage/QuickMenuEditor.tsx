import { useState } from 'react';
import { ALL_QUICK_MENU_ITEMS, QuickMenuItem } from '../../types/homepage.types';

interface QuickMenuEditorProps {
    selectedIds: string[];
    orderedIds: string[];
    onChange: (selectedIds: string[], orderedIds: string[]) => void;
}

/**
 * 퀵메뉴 편집 컴포넌트
 * - 체크박스로 메뉴 선택/해제
 * - 화살표 버튼으로 순서 이동 (드래그 없이 순수 구현)
 */
export function QuickMenuEditor({ selectedIds, orderedIds, onChange }: QuickMenuEditorProps) {
    const [localOrder, setLocalOrder] = useState<string[]>(orderedIds);
    const [localSelected, setLocalSelected] = useState<string[]>(selectedIds);

    const toggleItem = (id: string) => {
        const newSelected = localSelected.includes(id)
            ? localSelected.filter(s => s !== id)
            : [...localSelected, id];
        setLocalSelected(newSelected);
        onChange(newSelected, localOrder);
    };

    const moveUp = (id: string) => {
        const idx = localOrder.indexOf(id);
        if (idx <= 0) return;
        const newOrder = [...localOrder];
        [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
        setLocalOrder(newOrder);
        onChange(localSelected, newOrder);
    };

    const moveDown = (id: string) => {
        const idx = localOrder.indexOf(id);
        if (idx < 0 || idx >= localOrder.length - 1) return;
        const newOrder = [...localOrder];
        [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
        setLocalOrder(newOrder);
        onChange(localSelected, newOrder);
    };

    const menuMap = new Map<string, QuickMenuItem>(ALL_QUICK_MENU_ITEMS.map(m => [m.id, m]));
    const orderedMenus = localOrder.map(id => menuMap.get(id)).filter((m): m is QuickMenuItem => !!m);

    return (
        <div className="space-y-2">
            <p className="text-xs text-gray-500 mb-4">
                <i className="fas fa-info-circle mr-1 text-blue-400"></i>
                체크된 항목이 메인 페이지 퀵메뉴에 표시됩니다. 화살표로 순서를 바꿀 수 있어요.
            </p>
            {orderedMenus.map((item, idx) => {
                const isSelected = localSelected.includes(item.id);
                return (
                    <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                            isSelected
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 bg-white opacity-60'
                        }`}
                    >
                        {/* 체크박스 */}
                        <button
                            onClick={() => toggleItem(item.id)}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                isSelected
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'bg-white border-gray-300'
                            }`}
                            aria-label={`${item.label} ${isSelected ? '선택 해제' : '선택'}`}
                        >
                            {isSelected && <i className="fas fa-check text-[10px]"></i>}
                        </button>

                        {/* 아이콘 & 이름 */}
                        <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                            <i className={`fas ${item.icon} ${item.color} text-sm`}></i>
                        </div>
                        <span className="flex-1 font-semibold text-gray-800 text-sm">{item.label}</span>

                        {/* 순서 조정 버튼 */}
                        <div className="flex flex-col gap-0.5">
                            <button
                                onClick={() => moveUp(item.id)}
                                disabled={idx === 0}
                                className="w-6 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                aria-label="위로 이동"
                            >
                                <i className="fas fa-chevron-up text-[10px]"></i>
                            </button>
                            <button
                                onClick={() => moveDown(item.id)}
                                disabled={idx === orderedMenus.length - 1}
                                className="w-6 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                                aria-label="아래로 이동"
                            >
                                <i className="fas fa-chevron-down text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                );
            })}

            {/* 선택 개수 안내 */}
            <div className="text-right text-xs text-gray-400 pt-1">
                {localSelected.length}개 선택됨 (최대 {ALL_QUICK_MENU_ITEMS.length}개)
            </div>
        </div>
    );
}
