// 완전 무음 처리된 사운드 매니저 (소리 비활성화)
class SoundManager {
    playClick() {}
    playSuccess() {}
    playReset() {}
    toggle() { return false; }
}

export const sound = new SoundManager();

