'use client';

import React, { useState } from 'react';
import { useAppLauncherWorkspace } from '@/hooks/useAppLauncherWorkspace';
import { AppCatalogPanel, CatalogPanelTab } from './AppCatalogPanel';
import { PhoneHomeScreen } from './PhoneHomeScreen';

export const FrequentAppsSection: React.FC = () => {
    const workspace = useAppLauncherWorkspace();
    const [catalogTab, setCatalogTab] = useState<CatalogPanelTab>('catalog');
    const [isMobileCatalogOpen, setIsMobileCatalogOpen] = useState<boolean>(false);

    const handleOpenMobileCatalog = (tab: CatalogPanelTab) => {
        setCatalogTab(tab);
        setIsMobileCatalogOpen(true);
    };

    return (
        <div className="animate-fade-in space-y-4">
            {/* 토스트 알림 */}
            {workspace.toastMessage && (
                <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-slate-900/95 text-white text-xs sm:text-sm font-extrabold shadow-xl border border-indigo-400/40">
                    {workspace.toastMessage}
                </div>
            )}

            {/* PC 2컬럼 (좌 스마트폰 목업 5 : 우 앱 카탈로그/관리 7) / 모바일 풀폭 런처 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 min-w-0">
                    <PhoneHomeScreen
                        layout={workspace.layout}
                        activePageIndex={workspace.activePageIndex}
                        setActivePageIndex={workspace.setActivePageIndex}
                        isEditMode={workspace.isEditMode}
                        setIsEditMode={workspace.setIsEditMode}
                        openFolder={workspace.openFolder}
                        openFolderState={workspace.openFolderState}
                        setOpenFolderState={workspace.setOpenFolderState}
                        totalItemCount={workspace.totalItemCount}
                        saveStatus={workspace.saveStatus}
                        onOpenApp={workspace.openApp}
                        onCreateEmptyFolder={workspace.createEmptyFolder}
                        onRenameFolder={workspace.renameFolder}
                        onDissolveFolder={workspace.dissolveFolder}
                        onMoveAppOutOfFolder={workspace.moveAppOutOfFolder}
                        onMoveAppIntoFolder={workspace.moveAppIntoFolder}
                        onWrapAppInNewFolder={workspace.wrapAppInNewFolder}
                        onReorderOrMergeInPage={workspace.reorderOrMergeInPage}
                        onDropAtPageEnd={workspace.dropAtPageEnd}
                        onMoveAppToDock={workspace.moveAppToDock}
                        onRemoveEntry={workspace.removeEntry}
                        onMoveEntryStep={workspace.moveEntryStep}
                        onMoveEntryToPage={workspace.moveEntryToPage}
                        onAddPage={workspace.addPage}
                        onRemoveEmptyPage={workspace.removeEmptyPage}
                        onOpenMobileCatalog={handleOpenMobileCatalog}
                    />
                </div>

                <div className="hidden lg:block lg:col-span-7 min-w-0">
                    <AppCatalogPanel
                        activeTab={catalogTab}
                        onTabChange={setCatalogTab}
                        catalogItems={workspace.allCatalogItems}
                        registeredCatalogKeys={workspace.registeredCatalogKeys}
                        isLoading={workspace.isLoading}
                        catalogError={workspace.catalogError}
                        currentWallpaper={workspace.layout.wallpaper}
                        onRetryCatalog={workspace.retryCatalogFetch}
                        onAddCatalogApp={workspace.addCatalogApp}
                        onAddCustomUrlApp={workspace.addCustomUrlApp}
                        onSelectWallpaper={workspace.setWallpaper}
                    />
                </div>
            </div>

            {/* 모바일 전용 앱 카탈로그 / URL 추가 / 배경화면 모달 */}
            {isMobileCatalogOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4"
                    onClick={() => setIsMobileCatalogOpen(false)}
                >
                    <div
                        className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl shadow-2xl space-y-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-end px-1 pt-1">
                            <button
                                type="button"
                                onClick={() => setIsMobileCatalogOpen(false)}
                                className="px-3.5 py-1.5 rounded-full bg-white text-slate-800 text-xs font-black shadow-md cursor-pointer"
                            >
                                닫기 ✕
                            </button>
                        </div>
                        <AppCatalogPanel
                            activeTab={catalogTab}
                            onTabChange={setCatalogTab}
                            catalogItems={workspace.allCatalogItems}
                            registeredCatalogKeys={workspace.registeredCatalogKeys}
                            isLoading={workspace.isLoading}
                            catalogError={workspace.catalogError}
                            currentWallpaper={workspace.layout.wallpaper}
                            onRetryCatalog={workspace.retryCatalogFetch}
                            onAddCatalogApp={(item) => {
                                workspace.addCatalogApp(item);
                            }}
                            onAddCustomUrlApp={(input) => {
                                const res = workspace.addCustomUrlApp(input);
                                if (res.ok) {
                                    setIsMobileCatalogOpen(false);
                                }
                                return res;
                            }}
                            onSelectWallpaper={(wp) => {
                                workspace.setWallpaper(wp);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
