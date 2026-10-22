export type MinihomeItemCategory = 'wall' | 'floor' | 'furniture' | 'prop' | 'minimi';

export type MinihomeMoodType = 'happy' | 'passion' | 'relax' | 'focus' | 'gaming' | 'lucky';

export interface MinihomeMoodMeta {
    id: MinihomeMoodType;
    label: string;
    emoji: string;
    badgeBg: string;
    badgeText: string;
    border: string;
}

export interface MinihomeCatalogItem {
    itemId: string;
    name: string;
    category: MinihomeItemCategory;
    price: number; // 현재 적용 가격 (무료 오픈 시 0, 유료화 시 pointPrice)
    pointPrice?: number; // 추후 베라포인트 활성화 시 차감될 정가 포인트
    isTrophy?: boolean;
    unlockCondition?: string;
    badgeText?: string;
    description: string;
    accentColor: string;
    spriteUrl?: string;
    spriteWidth?: number;
    spriteHeight?: number;
    spriteOffsetY?: number;
}

export interface MinihomeBgmTrack {
    trackId: string;
    title: string;
    artist: string;
    moodLabel: string;
    tempoBpm: number;
    notesHz: number[];
    waveType: OscillatorType;
}

export interface PlacedRoomItem {
    instanceId: string;
    itemId: string;
    gridX: number; // 0 ~ 7
    gridY: number; // 0 ~ 7
    flipped: boolean;
}

export interface MinihomeRoomLayout {
    wallItemId: string;
    floorItemId: string;
    minimiItemId: string;
    minimiX: number; // 0 ~ 7
    minimiY: number; // 0 ~ 7
    speechBubble: string;
    placedItems: PlacedRoomItem[];
}

export interface MinihomeProfileData {
    handle: string;
    userId: number | null;
    ownerName: string;
    roomTitle: string;
    statusMood: MinihomeMoodType;
    statusMessage: string;
    bgmTrackId: string;
    todayVisitors: number;
    totalVisitors: number;
    layout: MinihomeRoomLayout;
    ownedItemIds: string[];
    veraPoints: number;
    isOwner: boolean;
    updatedAt: string;
}

export interface MinihomeGuestbookEntry {
    id: number;
    hostHandle: string;
    authorUserId: number | null;
    authorName: string;
    authorHandle: string;
    authorMinimiId: string;
    content: string;
    ownerReply: string | null;
    ownerRepliedAt: string | null;
    createdAt: string;
    isMine: boolean;
}

export interface MinihomeSurfRoomSummary {
    handle: string;
    ownerName: string;
    roomTitle: string;
    statusMood: MinihomeMoodType;
    statusMessage: string;
    todayVisitors: number;
    totalVisitors: number;
    minimiItemId: string;
}

export interface MinihomeSurfData {
    randomHandle: string;
    popularRooms: MinihomeSurfRoomSummary[];
}
