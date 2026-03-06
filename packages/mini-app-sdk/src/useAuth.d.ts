export interface MiniAppUser {
    id: number;
    email: string;
    name: string;
    role: string;
    level: number;
}
export declare function useAuth(): {
    user: MiniAppUser | null;
    isLoading: boolean;
};
//# sourceMappingURL=useAuth.d.ts.map