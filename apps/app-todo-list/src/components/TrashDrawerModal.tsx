import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { Dialog, DialogHeader } from '@astryxdesign/core/Dialog';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Layout, LayoutContent, LayoutFooter } from '@astryxdesign/core/Layout';
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
  return (
    <Dialog
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      width={420}
      maxHeight="80dvh"
      purpose="info"
      aria-label="휴지통 복구 목록"
    >
      <Layout
        header={
          <DialogHeader
            title="휴지통 (Soft Delete 보관함)"
            subtitle="삭제한 할 일은 영구 파기되지 않고 안전하게 보관됩니다."
            hasDivider
            onOpenChange={(open) => {
              if (!open) onClose();
            }}
          />
        }
        content={
          <LayoutContent>
            {trashItems.length === 0 ? (
              <EmptyState
                isCompact
                icon={<i className="fas fa-box-archive text-lg text-[#8E8579]"></i>}
                title="휴지통이 비어 있습니다"
                description="삭제한 할 일이 여기 보관되며 언제든 1클릭 복구할 수 있습니다."
              />
            ) : (
              <div className="space-y-2 py-1">
                {trashItems.map((item) => {
                  const pri = PRIORITY_MAP[item.priority];
                  const cat = CATEGORY_MAP[item.category];
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#E5DDD0] flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#24211D] truncate">{item.title}</p>
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[9px] text-[#6C655B]">
                          <Badge variant={pri.badgeVariant} label={pri.shortLabel} />
                          <Badge variant={cat.badgeVariant} label={cat.label} />
                          {item.occurrence.summaryLabel && (
                            <Badge variant="info" label={item.occurrence.summaryLabel} />
                          )}
                          {item.deletedAt && (
                            <span className="font-mono">
                              삭제 {new Date(item.deletedAt).toLocaleDateString('ko-KR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        label="복구"
                        variant="primary"
                        size="sm"
                        onClick={() => onRestore(item.id)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <div className="w-full flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-[#6C655B]">
                보관 중 {trashItems.length}건
              </span>
              <div className="flex items-center gap-2">
                {trashItems.length > 0 && (
                  <Button
                    label="전체 복구"
                    variant="primary"
                    size="sm"
                    onClick={onRestoreAll}
                  />
                )}
                <Button
                  label="닫기"
                  variant="secondary"
                  size="sm"
                  onClick={onClose}
                />
              </div>
            </div>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
