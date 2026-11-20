import { useState } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import type { MainTab } from '../types/todo';

interface HeaderProps {
  readonly activeTab: MainTab;
  readonly onChangeTab: (tab: MainTab) => void;
  readonly onShare: () => void;
  readonly isAuthenticated: boolean;
  readonly userName?: string;
}

export default function Header({
  activeTab,
  onChangeTab,
  onShare,
  isAuthenticated,
  userName,
}: HeaderProps) {
  const [logoError, setLogoError] = useState<boolean>(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E5DDD0] px-3 sm:px-4 pt-2.5 pb-1 shrink-0">
      {/* 1열: VeraNex 공식 홈 로고 + DB 동기화 상태 + 공유 버튼 (음소거/도움말 아이콘 배제) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <a
          href="https://veranex.app"
          target="_top"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer group shrink-0"
          title="VeraNex 포털 홈으로 이동"
        >
          <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] flex items-center justify-center p-1">
            {!logoError ? (
              <img
                src="https://veranex.app/logo-192.png"
                alt="VeraNex 공식 로고"
                className="w-full h-full object-contain"
                onError={() => setLogoError(true)}
              />
            ) : (
              <span className="text-sm font-black text-indigo-600">V</span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="font-black text-[15px] sm:text-base tracking-tight text-[#24211D] leading-none group-hover:text-indigo-600 transition-colors">
              V<span className="text-indigo-600">ERANEX</span>
            </span>
            <span className="text-[9px] font-bold tracking-wider text-[#8E8579] leading-tight mt-0.5">
              SMART TO-DO
            </span>
          </div>
        </a>

        <div className="flex items-center gap-1.5 min-w-0">
          <div className="hidden sm:block text-right min-w-0 mr-1">
            <h1 className="text-[13px] font-extrabold text-[#24211D] leading-tight truncate">
              스마트 투두(TO-DO) 플래너
            </h1>
          </div>

          <Badge
            variant={isAuthenticated ? 'success' : 'neutral'}
            icon={
              <StatusDot
                variant={isAuthenticated ? 'success' : 'warning'}
                label={isAuthenticated ? 'DB 동기화 활성화' : '로컬 체험 모드'}
                isPulsing={isAuthenticated}
              />
            }
            label={isAuthenticated ? `${userName || '회원'} DB 동기화` : '로컬 모드'}
          />

          <Button
            label="공유"
            variant="secondary"
            size="sm"
            onClick={onShare}
            aria-label="투두 플래너 링크 공유하기"
            icon={<i className="fas fa-share-nodes text-[10px] text-indigo-600"></i>}
          />
        </div>
      </div>

      {/* 2열: Astryx TabList (할일 정리 / 사용방법 / FAQ) */}
      <TabList
        value={activeTab}
        onChange={(value) => onChangeTab(value as MainTab)}
        layout="fill"
        size="sm"
        aria-label="투두 플래너 메뉴"
      >
        <Tab
          value="todo"
          label="할일 정리"
          icon={<i className="fas fa-check-double text-[10px]"></i>}
        />
        <Tab
          value="howto"
          label="사용방법"
          icon={<i className="fas fa-book-open text-[10px]"></i>}
        />
        <Tab
          value="faq"
          label="FAQ"
          icon={<i className="fas fa-circle-question text-[10px]"></i>}
        />
      </TabList>
    </header>
  );
}
