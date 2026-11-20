import { CATEGORY_MAP, PRIORITY_MAP } from '../constants/todoMeta';
import type { TodoItem } from '../types/todo';

interface TrashDrawerModalProps {
  readonly isOpen: boolean;
  readonly trashItems: readonly TodoItem[];
  readonly onClose: () => void;
  readonly onRestore: (id: string) => void;
  readonly onRestoreAll: () => void;
}

export default function TrashDrawerModal({
  isOpen,
  trashItems,
  onClose,
  onRestore,
  onRestoreAll,
}: TrashDrawerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-[#2D2A26]/40 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="휴지통 복구 목록"
    >
      <div className="bg-white rounded-3xl border border-[#EBE6DD] shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[#EBE6DD] bg-[#FAF8F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xs">
              <i className="fas fa-box-archive"></i>
            </span>
            <div>
              <h3 className="text-sm font-black text-[#2D2A26]">
                휴지통 (Soft Delete 보관함)
              </h3>
              <p className="text-[10px] text-[#7A7369]">
                삭제한 할 일은 영구 파기되지 않고 안전하게 보관됩니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="휴지통 닫기"
            className="w-7 h-7 rounded-xl bg-white hover:bg-[#F5F2EB] border border-[#EBE6DD] text-[#57514A] flex items-center justify-center text-xs cursor-pointer"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-3.5 flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {trashItems.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-[#FAF8F5] border border-[#EBE6DD] text-[#A39C90] flex items-center justify-center text-base">
                <i className="fas fa-sparkles"></i>
              </div>
              <p className="text-xs font-bold text-[#7A7369]">휴지통이 비어 있습니다.</p>
            </div>
          ) : (
            trashItems.map((item) => {
              const pri = PRIORITY_MAP[item.priority];
              const cat = CATEGORY_MAP[item.category];
              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE6DD] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#2D2A26] truncate">{item.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] text-[#7A7369]">
                      <span className={`px-1.5 py-0.5 rounded border font-bold ${pri.pillClass}`}>
                        {pri.shortLabel}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded border font-bold ${cat.badgeClass}`}>
                        {cat.label}
                      </span>
                      {item.deletedAt && (
                        <span className="font-mono">
                          삭제 {new Date(item.deletedAt).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRestore(item.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black shrink-0 cursor-pointer active:scale-95"
                  >
                    복구
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#EBE6DD] bg-[#FAF8F5] flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#7A7369]">
            보관 중 {trashItems.length}건
          </span>
          <div className="flex items-center gap-2">
            {trashItems.length > 0 && (
              <button
                type="button"
                onClick={onRestoreAll}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black cursor-pointer"
              >
                전체 복구
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F2EB] border border-[#DFD9CE] text-xs font-bold text-[#57514A] cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
