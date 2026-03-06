import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    level: number;
    status: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || '';
                const { data } = await axios.get(`${API_BASE_URL}/api/auth/check`, {
                    withCredentials: true
                });
                if (data.success && data.user) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || '';
            await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout failed:", error);
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
