'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export interface User {
    id: number;
    email: string;
    name: string;
    role: string;
    level: number;
    status: string;
    birth_date?: string | null;
    birth_time?: string | null;
    gender?: string | null;
    is_solar?: boolean;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (userData: User) => void;
    logout: () => void;
    updateUser: (userData: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await axios.get('/api/auth/check', {
                    withCredentials: true
                });
                if (data.success && data.user) {
                    const fetchedUser: User = data.user;

                    if (fetchedUser.birth_date) {
                        localStorage.setItem('user_birth_date', fetchedUser.birth_date);
                        localStorage.setItem('faith_saju_birth_date', fetchedUser.birth_date);
                    } else {
                        const localBirth = localStorage.getItem('user_birth_date') || localStorage.getItem('faith_saju_birth_date');
                        if (localBirth && localBirth.trim()) {
                            try {
                                const profileRes = await axios.put('/api/auth/profile', {
                                    birth_date: localBirth.trim(),
                                    birthDate: localBirth.trim()
                                }, { withCredentials: true });
                                if (profileRes.data?.success && profileRes.data?.user) {
                                    fetchedUser.birth_date = profileRes.data.user.birth_date;
                                }
                            } catch (syncErr) {
                                console.warn('Auto-sync birthdate failed:', syncErr);
                            }
                        }
                    }

                    setUser(fetchedUser);
                }
            } catch (error) {
                // not logged in
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        if (userData.birth_date) {
            localStorage.setItem('user_birth_date', userData.birth_date);
            localStorage.setItem('faith_saju_birth_date', userData.birth_date);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout', {}, { withCredentials: true });
        } catch (error) {
            console.error("Logout failed:", error);
        }
        setUser(null);
    };

    const updateUser = async (userData: Partial<User>): Promise<boolean> => {
        try {
            const { data } = await axios.put('/api/auth/profile', userData, {
                withCredentials: true
            });
            if (data.success && data.user) {
                setUser(data.user);
                if (data.user.birth_date) {
                    localStorage.setItem('user_birth_date', data.user.birth_date);
                    localStorage.setItem('faith_saju_birth_date', data.user.birth_date);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error("Profile update failed:", error);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
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
