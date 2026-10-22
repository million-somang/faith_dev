'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    MinihomeGuestbookEntry,
    MinihomeMoodType,
    MinihomeProfileData,
    MinihomeRoomLayout,
    MinihomeSurfData,
} from '@/types/minihome.types';
import { DEFAULT_CLIENT_LAYOUT, getCatalogItemById } from '@/data/minihomeCatalogData';

interface ApiStandardResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: number;
        message: string;
    };
}

interface RoomResponsePayload {
    profile: MinihomeProfileData;
    guestbook: MinihomeGuestbookEntry[];
    surf: MinihomeSurfData;
}

export function useMinihome(routeHandle: string) {
    const { user } = useAuth();

    const [profile, setProfile] = useState<MinihomeProfileData | null>(null);
    const [guestbook, setGuestbook] = useState<MinihomeGuestbookEntry[]>([]);
    const [surfData, setSurfData] = useState<MinihomeSurfData>({
        randomHandle: '',
        popularRooms: [],
    });

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // 꾸미기 모드 & 상점 팝업(모달) 상태
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [isShopModalOpen, setIsShopModalOpen] = useState<boolean>(false);
    const [isGuestbookModalOpen, setIsGuestbookModalOpen] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isBuyingItemId, setIsBuyingItemId] = useState<string | null>(null);

    // 편집 중인 드래프트 상태
    const [draftLayout, setDraftLayout] = useState<MinihomeRoomLayout>(DEFAULT_CLIENT_LAYOUT);
    const [draftRoomTitle, setDraftRoomTitle] = useState<string>('');
    const [draftMood, setDraftMood] = useState<MinihomeMoodType>('happy');
    const [draftStatusMessage, setDraftStatusMessage] = useState<string>('');
    const [draftBgmTrackId, setDraftBgmTrackId] = useState<string>('bgm-orgel');

    // 아이소메트릭 캔버스에서 현재 선택된 이동 대상 ('minimi' 또는 placedItem의 instanceId)
    const [selectedTargetId, setSelectedTargetId] = useState<string>('minimi');

    const showToast = useCallback((msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((prev) => (prev === msg ? null : prev));
        }, 3000);
    }, []);

    const getViewerIdentity = useCallback(() => {
        let localHandle = 'vera_guest';
        let localName = '베라 이웃';
        if (typeof window !== 'undefined') {
            const savedLoungeHandle = localStorage.getItem('vera_lounge_handle');
            const savedLoungeName = localStorage.getItem('vera_lounge_name');
            const savedMiniHandle = localStorage.getItem('vera_minihome_guest_handle');
            if (savedLoungeHandle) {
                localHandle = savedLoungeHandle.replace(/^@+/, '');
            } else if (savedMiniHandle) {
                localHandle = savedMiniHandle;
            } else {
                const generated = `guest_${Math.floor(1000 + Math.random() * 9000)}`;
                localStorage.setItem('vera_minihome_guest_handle', generated);
                localHandle = generated;
            }
            if (savedLoungeName) {
                localName = savedLoungeName;
            }
        }

        const effectiveHandle = user?.email
            ? user.email.split('@')[0].toLowerCase()
            : localHandle.toLowerCase();
        const effectiveName = user?.name || localName;

        return { effectiveHandle, effectiveName };
    }, [user]);

    const fetchMinihome = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);
        try {
            const { effectiveHandle, effectiveName } = getViewerIdentity();
            const target = !routeHandle || routeHandle === 'me' || routeHandle === 'my'
                ? effectiveHandle
                : decodeURIComponent(routeHandle).replace(/^@+/, '');

            const qs = new URLSearchParams({
                viewerHandle: effectiveHandle,
                viewerName: effectiveName,
            });

            const res = await fetch(`/api/minihome/room/${encodeURIComponent(target)}?${qs.toString()}`, {
                credentials: 'include',
            });
            const json = (await res.json()) as ApiStandardResponse<RoomResponsePayload>;

            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error?.message || '아지트를 불러오지 못했습니다.');
            }

            const loadedProfile = json.data.profile;
            setProfile(loadedProfile);
            setGuestbook(json.data.guestbook || []);
            setSurfData(json.data.surf || { randomHandle: '', popularRooms: [] });

            // 드래프트 초기화
            setDraftLayout(loadedProfile.layout || DEFAULT_CLIENT_LAYOUT);
            setDraftRoomTitle(loadedProfile.roomTitle);
            setDraftMood(loadedProfile.statusMood);
            setDraftStatusMessage(loadedProfile.statusMessage);
            setDraftBgmTrackId(loadedProfile.bgmTrackId || 'bgm-orgel');
        } catch (err) {
            const msg = err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.';
            setErrorMessage(msg);
        } finally {
            setIsLoading(false);
        }
    }, [routeHandle, getViewerIdentity]);

    useEffect(() => {
        fetchMinihome();
    }, [fetchMinihome]);

    // ==================== 꾸미기 조작 핸들러 ====================
    const handleEnterEditMode = useCallback((openShopModal = false) => {
        if (!profile) return;
        setDraftLayout(profile.layout);
        setDraftRoomTitle(profile.roomTitle);
        setDraftMood(profile.statusMood);
        setDraftStatusMessage(profile.statusMessage);
        setDraftBgmTrackId(profile.bgmTrackId);
        setSelectedTargetId('minimi');
        setIsEditMode(true);
        if (openShopModal) {
            setIsShopModalOpen(true);
        }
    }, [profile]);

    const handleCancelEditMode = useCallback(() => {
        if (profile) {
            setDraftLayout(profile.layout);
            setDraftRoomTitle(profile.roomTitle);
            setDraftMood(profile.statusMood);
            setDraftStatusMessage(profile.statusMessage);
            setDraftBgmTrackId(profile.bgmTrackId);
        }
        setIsShopModalOpen(false);
        setIsEditMode(false);
    }, [profile]);

    const handleTileClick = useCallback((gridX: number, gridY: number) => {
        if (!isEditMode) return;
        const clampedX = Math.max(0, Math.min(7, gridX));
        const clampedY = Math.max(0, Math.min(7, gridY));

        setDraftLayout((prev) => {
            if (selectedTargetId === 'minimi') {
                return {
                    ...prev,
                    minimiX: clampedX,
                    minimiY: clampedY,
                };
            }
            return {
                ...prev,
                placedItems: prev.placedItems.map((item) =>
                    item.instanceId === selectedTargetId
                        ? { ...item, gridX: clampedX, gridY: clampedY }
                        : item
                ),
            };
        });
    }, [isEditMode, selectedTargetId]);

    const handleApplyCatalogItem = useCallback((itemId: string) => {
        const meta = getCatalogItemById(itemId);
        if (!meta) return;

        if (!isEditMode) {
            setIsEditMode(true);
        }

        if (meta.category === 'wall') {
            setDraftLayout((prev) => ({ ...prev, wallItemId: itemId }));
            showToast(`🎨 [${meta.name}] 벽지가 적용되었습니다!`);
            return;
        }
        if (meta.category === 'floor') {
            setDraftLayout((prev) => ({ ...prev, floorItemId: itemId }));
            showToast(`🪵 [${meta.name}] 바닥재가 적용되었습니다!`);
            return;
        }
        if (meta.category === 'minimi') {
            setDraftLayout((prev) => ({ ...prev, minimiItemId: itemId }));
            setSelectedTargetId('minimi');
            showToast(`🧍 [${meta.name}] 아바타로 변경되었습니다!`);
            return;
        }

        // 가구(furniture) 또는 소품(prop)인 경우: 새로 배치
        setDraftLayout((prev) => {
            if (prev.placedItems.length >= 14) {
                showToast('아지트에는 최대 14개의 가구·소품까지 배치할 수 있습니다.');
                return prev;
            }
            const newInstanceId = `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            let targetX = 3;
            let targetY = 3;
            for (let y = 1; y <= 6; y++) {
                for (let x = 1; x <= 6; x++) {
                    const occupied = prev.placedItems.some((p) => p.gridX === x && p.gridY === y);
                    if (!occupied && !(prev.minimiX === x && prev.minimiY === y)) {
                        targetX = x;
                        targetY = y;
                        break;
                    }
                }
            }
            const nextItem = {
                instanceId: newInstanceId,
                itemId,
                gridX: targetX,
                gridY: targetY,
                flipped: false,
            };
            setSelectedTargetId(newInstanceId);
            showToast(`✨ [${meta.name}] 배치 완료! 바닥 타일을 클릭해 위치를 옮겨보세요.`);
            return {
                ...prev,
                placedItems: [...prev.placedItems, nextItem],
            };
        });
    }, [isEditMode, showToast]);

    const handleFlipSelectedItem = useCallback(() => {
        if (selectedTargetId === 'minimi') return;
        setDraftLayout((prev) => ({
            ...prev,
            placedItems: prev.placedItems.map((item) =>
                item.instanceId === selectedTargetId
                    ? { ...item, flipped: !item.flipped }
                    : item
            ),
        }));
    }, [selectedTargetId]);

    const handleRemoveSelectedItem = useCallback(() => {
        if (selectedTargetId === 'minimi') {
            showToast('아바타 캐릭터는 아지트에서 제거할 수 없습니다. 위치를 옮기거나 의상을 바꿔보세요!');
            return;
        }
        setDraftLayout((prev) => ({
            ...prev,
            placedItems: prev.placedItems.filter((item) => item.instanceId !== selectedTargetId),
        }));
        setSelectedTargetId('minimi');
        showToast('선택한 가구를 보관함으로 넣었습니다.');
    }, [selectedTargetId, showToast]);

    const handleResetDefaultRoom = useCallback(() => {
        setDraftLayout(DEFAULT_CLIENT_LAYOUT);
        setSelectedTargetId('minimi');
        showToast('기본 아지트 배치로 초기화되었습니다.');
    }, [showToast]);

    const handleSaveMinihome = useCallback(async (overridePartial?: {
        statusMood?: MinihomeMoodType;
        statusMessage?: string;
        bgmTrackId?: string;
        roomTitle?: string;
    }) => {
        if (!profile) return false;
        setIsSaving(true);
        try {
            const payload = {
                ownerName: profile.ownerName,
                roomTitle: overridePartial?.roomTitle ?? draftRoomTitle,
                statusMood: overridePartial?.statusMood ?? draftMood,
                statusMessage: overridePartial?.statusMessage ?? draftStatusMessage,
                bgmTrackId: overridePartial?.bgmTrackId ?? draftBgmTrackId,
                layout: draftLayout,
            };

            const res = await fetch(`/api/minihome/room/${encodeURIComponent(profile.handle)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const json = (await res.json()) as ApiStandardResponse<{ updated: boolean }>;
            if (!res.ok || !json.success) {
                throw new Error(json.error?.message || '저장에 실패했습니다.');
            }

            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          roomTitle: payload.roomTitle,
                          statusMood: payload.statusMood,
                          statusMessage: payload.statusMessage,
                          bgmTrackId: payload.bgmTrackId,
                          layout: payload.layout,
                      }
                    : null
            );
            setIsShopModalOpen(false);
            setIsEditMode(false);
            showToast('✅ 나만의 아지트 설정이 저장되었습니다!');
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
            showToast(`⚠️ ${msg}`);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [profile, draftRoomTitle, draftMood, draftStatusMessage, draftBgmTrackId, draftLayout, showToast]);

    // ==================== 상점 구매 핸들러 ====================
    const handlePurchaseItem = useCallback(async (itemId: string) => {
        if (!profile) return false;
        setIsBuyingItemId(itemId);
        try {
            const res = await fetch('/api/minihome/shop/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    handle: profile.handle,
                    itemId,
                }),
            });
            const json = (await res.json()) as ApiStandardResponse<{
                ownedItemIds: string[];
                remainingPoints: number;
                purchasedItemName: string;
            }>;

            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error?.message || '아이템 획득에 실패했습니다.');
            }

            const { ownedItemIds, remainingPoints, purchasedItemName } = json.data;
            setProfile((prev) =>
                prev
                    ? {
                          ...prev,
                          ownedItemIds,
                          veraPoints: remainingPoints,
                      }
                    : null
            );
            showToast(`🎁 [${purchasedItemName}] 획득 완료! 내 보관함에 추가되었습니다.`);
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : '아이템 획득 처리 중 오류가 발생했습니다.';
            showToast(`⚠️ ${msg}`);
            return false;
        } finally {
            setIsBuyingItemId(null);
        }
    }, [profile, showToast]);

    // ==================== 방명록 핸들러 ====================
    const handleAddGuestbook = useCallback(async (content: string, authorMinimiId?: string) => {
        if (!profile) return false;
        const { effectiveHandle, effectiveName } = getViewerIdentity();

        try {
            const res = await fetch(`/api/minihome/guestbook/${encodeURIComponent(profile.handle)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    authorName: effectiveName,
                    authorHandle: effectiveHandle,
                    authorMinimiId: authorMinimiId || draftLayout.minimiItemId || 'minimi-casual',
                    content,
                }),
            });
            const json = (await res.json()) as ApiStandardResponse<{ guestbook: MinihomeGuestbookEntry[] }>;
            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error?.message || '방명록 등록 실패');
            }
            setGuestbook(json.data.guestbook);
            showToast('💌 따뜻한 아지트 방명록을 남겼습니다!');
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : '방명록 작성 중 오류가 발생했습니다.';
            showToast(`⚠️ ${msg}`);
            return false;
        }
    }, [profile, getViewerIdentity, draftLayout.minimiItemId, showToast]);

    const handleReplyGuestbook = useCallback(async (entryId: number, replyText: string) => {
        if (!profile) return false;
        const { effectiveHandle } = getViewerIdentity();
        try {
            const res = await fetch(`/api/minihome/guestbook/${entryId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    hostHandle: profile.handle,
                    replyText,
                    viewerHandle: effectiveHandle,
                }),
            });
            const json = (await res.json()) as ApiStandardResponse<{ guestbook: MinihomeGuestbookEntry[] }>;
            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error?.message || '답글 등록 실패');
            }
            setGuestbook(json.data.guestbook);
            showToast('💬 방명록 답글이 등록되었습니다.');
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : '답글 등록 중 오류가 발생했습니다.';
            showToast(`⚠️ ${msg}`);
            return false;
        }
    }, [profile, getViewerIdentity, showToast]);

    const handleSoftDeleteGuestbook = useCallback(async (entryId: number) => {
        if (!profile) return false;
        const { effectiveHandle } = getViewerIdentity();
        try {
            const res = await fetch(`/api/minihome/guestbook/${entryId}/delete`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    hostHandle: profile.handle,
                    requesterHandle: effectiveHandle,
                }),
            });
            const json = (await res.json()) as ApiStandardResponse<{ guestbook: MinihomeGuestbookEntry[] }>;
            if (!res.ok || !json.success || !json.data) {
                throw new Error(json.error?.message || '방명록 삭제 실패');
            }
            setGuestbook(json.data.guestbook);
            showToast('방명록 글이 숨김(삭제) 처리되었습니다.');
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : '방명록 삭제 중 오류가 발생했습니다.';
            showToast(`⚠️ ${msg}`);
            return false;
        }
    }, [profile, getViewerIdentity, showToast]);

    return {
        profile,
        guestbook,
        surfData,
        isLoading,
        errorMessage,
        toastMessage,
        isEditMode,
        isShopModalOpen,
        setIsShopModalOpen,
        isGuestbookModalOpen,
        setIsGuestbookModalOpen,
        isSaving,
        isBuyingItemId,
        draftLayout,
        setDraftLayout,
        draftRoomTitle,
        setDraftRoomTitle,
        draftMood,
        setDraftMood,
        draftStatusMessage,
        setDraftStatusMessage,
        draftBgmTrackId,
        setDraftBgmTrackId,
        selectedTargetId,
        setSelectedTargetId,
        handleEnterEditMode,
        handleCancelEditMode,
        handleTileClick,
        handleApplyCatalogItem,
        handleFlipSelectedItem,
        handleRemoveSelectedItem,
        handleResetDefaultRoom,
        handleSaveMinihome,
        handlePurchaseItem,
        handleAddGuestbook,
        handleReplyGuestbook,
        handleSoftDeleteGuestbook,
        refreshMinihome: fetchMinihome,
        showToast,
    };
}
