import { ALL_MOBILE_TAB_ITEMS, MAX_MOBILE_TABS, MobileTabItem } from '../../types/homepage.types';

interface MobileTabEditorProps {
    value: string[];                       // 선택된 탭 id 순서 목록
    onChange: (ids: string[]) => void;
}

/**
 * 모바일 하단 탭 편집 컴포넌트
 * - 선택된 탭(순서)과 추가 가능한 탭을 분리해서 표시
 * - 최대 MAX_MOBILE_TABS개까지 선택, 화살표로 순서 변경
 * - 전체메뉴 버튼은 코드상 항상 마지막에 고정되므로 여기서 다루지 않음
 */
export function MobileTabEditor({ value, onChange }: MobileTabEditorProps) {
    const map = new Map<string, MobileTabItem>(ALL_MOBILE_TAB_ITEMS.map(t => [t.id, t]));
    const selected = value.map(id => map.get(id)).filter((t): t is MobileTabItem => !!t);
    const available = ALL_MOBILE_TAB_ITEMS.filter(t => !value.includes(t.id));
    const atMax = selected.length >= MAX_MOBILE_TABS;

    const add = (id: string) => {
        if (value.includes(id) || value.length >= MAX_MOBILE_TABS) return;
        onChange([...value, id]);
    };
    const remove = (id: string) => onChange(value.filter(v => v !== id));
    const move = (id: string, dir: -1 | 1) => {
        const idx = value.indexOf(id);
        const next = idx + dir;
        if (idx < 0 || next < 0 || next >= value.length) return;
        const arr = [...value];
        [arr[idx], arr[next]] = [arr[next], arr[idx]];
        onChange(arr);
    };

    return (
        <div className="space-y-4">
            <p className="text-xs text-gray-500">
                <i className="fas fa-info-circle mr-1 text-blue-400"></i>
                모바일 화면 하단에 표시할 탭을 최대 {MAX_MOBILE_TABS}개까지 고를 수 있어요. 선택한 순서대로 하단바에 표시됩니다.
            </p>

            {/* 선택된 탭 (순서) */}
            <div>
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">표시 중인 탭 ({selected.length}/{MAX_MOBILE_TABS})</div>
                {selected.length === 0 ? (
                    <div className="text-sm text-gray-400 py-4 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        아래에서 탭을 추가해 주세요.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {selected.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border-2 border-green-300 bg-green-50">
                                <span className="w-7 h-7 rounded-lg bg-white border border-green-200 flex items-center justify-center text-green-600 font-bold text-xs flex-shrink-0">{idx + 1}</span>
                                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                                    <i className={`${item.icon} text-gray-600 text-sm`}></i>
                                </div>
                                <span className="flex-1 font-semibold text-gray-800 text-sm">{item.label}</span>
                                <div className="flex flex-col gap-0.5">
                                    <button onClick={() => move(item.id, -1)} disabled={idx === 0}
                                        className="w-6 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white transition-colors" aria-label="위로 이동">
                                        <i className="fas fa-chevron-up text-[10px]"></i>
                                    </button>
                                    <button onClick={() => move(item.id, 1)} disabled={idx === selected.length - 1}
                                        className="w-6 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white transition-colors" aria-label="아래로 이동">
                                        <i className="fas fa-chevron-down text-[10px]"></i>
                                    </button>
                                </div>
                                <button onClick={() => remove(item.id)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0" aria-label={`${item.label} 제거`}>
                                    <i className="fas fa-times text-xs"></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 추가 가능한 탭 */}
            {available.length > 0 && (
                <div>
                    <div className="text-xs font-bold text-gray-400 uppercase mb-2">추가 가능한 탭</div>
                    <div className="flex flex-wrap gap-2">
                        {available.map(item => (
                            <button key={item.id} onClick={() => add(item.id)} disabled={atMax}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-green-300 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                aria-label={`${item.label} 추가`}>
                                <i className={`${item.icon} text-gray-500 text-sm`}></i>
                                {item.label}
                                <i className="fas fa-plus text-[10px] text-green-500"></i>
                            </button>
                        ))}
                    </div>
                    {atMax && <p className="text-[11px] text-amber-600 mt-2"><i className="fas fa-circle-exclamation mr-1"></i>최대 {MAX_MOBILE_TABS}개까지 선택할 수 있어요. 추가하려면 먼저 표시 중인 탭을 제거하세요.</p>}
                </div>
            )}
        </div>
    );
}
