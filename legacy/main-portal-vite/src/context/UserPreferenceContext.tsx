import React, { createContext, useContext } from 'react';
import { useUserPreference } from '../hooks/useUserPreference';
import { useAuth } from './AuthContext';
import { HomepageConfig } from '../types/homepage.types';

interface UserPreferenceContextValue {
    config: HomepageConfig;
    isLoading: boolean;
    isSaving: boolean;
    updateConfig: (partial: Partial<HomepageConfig>) => void;
    saveConfig: (override?: Partial<HomepageConfig>) => Promise<boolean>;
    resetConfig: () => void;
}

const UserPreferenceContext = createContext<UserPreferenceContextValue | null>(null);

export function UserPreferenceProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const preference = useUserPreference(!!user);

    return (
        <UserPreferenceContext.Provider value={preference}>
            {children}
        </UserPreferenceContext.Provider>
    );
}

export function useUserPreferenceContext(): UserPreferenceContextValue {
    const ctx = useContext(UserPreferenceContext);
    if (!ctx) {
        throw new Error('useUserPreferenceContext must be used within UserPreferenceProvider');
    }
    return ctx;
}
