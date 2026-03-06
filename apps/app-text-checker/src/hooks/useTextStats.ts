import { useState, useEffect, useMemo } from 'react';

export interface TextStats {
    charWithSpace: number;
    charWithoutSpace: number;
    byteCount: number;
    lineCount: number;
}

export function useTextStats(initialText: string = '') {
    const [text, setText] = useState<string>(initialText);
    const [platform, setPlatform] = useState<'naver' | 'jobkorea'>('naver');

    // 초기화 시 LocalStorage 복원
    useEffect(() => {
        const saved = localStorage.getItem('textChecker_content');
        if (saved) {
            setText(saved);
        }
    }, []);

    // 텍스트 변경 시 LocalStorage 저장
    useEffect(() => {
        localStorage.setItem('textChecker_content', text);
    }, [text]);

    // 통계 계산
    const stats: TextStats = useMemo(() => {
        const charWithSpace = text.length;
        const charWithoutSpace = text.replace(/\s/g, '').length;
        const byteCount = new Blob([text]).size;

        let lineCount;
        if (platform === 'jobkorea') {
            // 잡코리아: \r\n 2자로 계산 등의 차이가 있으나, 여기서는 일관된 줄바꿈 수 사용
            lineCount = (text.match(/\n/g) || []).length + 1;
        } else {
            lineCount = (text.match(/\n/g) || []).length + 1;
        }

        return { charWithSpace, charWithoutSpace, byteCount, lineCount };
    }, [text, platform]);

    return {
        text,
        setText,
        platform,
        setPlatform,
        stats
    };
}
