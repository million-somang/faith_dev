import { useState, useEffect } from 'react';
import axios from 'axios';

export interface MiniAppUser {
    id: number;
    email: string;
    name: string;
    role: string;
    level: number;
}

export function useAuth() {
    const [user, setUser] = useState<MiniAppUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Relies on same-origin Vite proxy for /api -> localhost:4000
                const { data } = await axios.get('/api/auth/check', {
                    withCredentials: true // 프록시 포트가 달라도 세션 쿠키를 전달하기 위함
                });
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error("MiniApp Auth check failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    return { user, isLoading };
}
