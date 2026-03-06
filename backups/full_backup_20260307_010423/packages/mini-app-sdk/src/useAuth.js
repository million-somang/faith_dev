import { useState, useEffect } from 'react';
import axios from 'axios';
export function useAuth() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Relies on same-origin Vite proxy for /api -> localhost:4000
                const { data } = await axios.get('/api/auth/check');
                if (data.success && data.user) {
                    setUser(data.user);
                }
            }
            catch (error) {
                console.error("MiniApp Auth check failed:", error);
            }
            finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, []);
    return { user, isLoading };
}
