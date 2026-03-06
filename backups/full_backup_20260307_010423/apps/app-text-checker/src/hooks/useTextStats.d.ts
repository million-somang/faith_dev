export interface TextStats {
    charWithSpace: number;
    charWithoutSpace: number;
    byteCount: number;
    lineCount: number;
}
export declare function useTextStats(initialText?: string): {
    text: string;
    setText: import("react").Dispatch<import("react").SetStateAction<string>>;
    platform: "naver" | "jobkorea";
    setPlatform: import("react").Dispatch<import("react").SetStateAction<"naver" | "jobkorea">>;
    stats: TextStats;
};
//# sourceMappingURL=useTextStats.d.ts.map