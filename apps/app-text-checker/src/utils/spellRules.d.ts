export interface SpellRule {
    regex: RegExp;
    replacement: string;
    type: string;
    example?: string;
}
export interface SpellError {
    wrong: string;
    correct: string;
    type: string;
    desc: string;
}
export declare const spellRules: SpellRule[];
export declare function findSimpleErrors(text: string): SpellError[];
export declare function applyAllCorrections(text: string, errors: SpellError[]): string;
//# sourceMappingURL=spellRules.d.ts.map