import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    HomepageConfig,
    DEFAULT_HOMEPAGE_CONFIG,
} from '../types/homepage.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const LOCAL_STORAGE_KEY = 'faithportal_homepage_config';

interface UseUserPreferenceReturn {
    config: HomepageConfig;
    isLoading: boolean;
    isSaving: boolean;
    updateConfig: (partial: Partial<HomepageConfig>) => void;
    saveConfig: (override?: Partial<HomepageConfig>) => Promise<boolean>;
    resetConfig: () => void;
}

/**
 * 홈페이지 개인화 설정 훅
 * - 로그인: API에서 설정 로드/저장
 * - 비로그인: localStorage에 임시 저장
 */
export function useUserPreference(isLoggedIn: boolean): UseUserPreferenceReturn {
    const [config, setConfig] = useState<HomepageConfig>(DEFAULT_HOMEPAGE_CONFIG);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // 설정 로드
    useEffect(() => {
        const loadConfig = async () => {
            if (isLoggedIn) {
                // 로그인: API에서 로드
                setIsLoading(true);
                try {
                    const res = await axios.get<{ success: boolean; config: HomepageConfig }>(
                        `${API_BASE_URL}/api/user/homepage-config`,
                        { withCredentials: true }
                    );
                    if (res.data.success) {
                        setConfig(res.data.config);
                    }
                } catch (err) {
                    console.warn('[Homepage] API 설정 로드 실패, 로컬 데이터 사용:', err);
                    // API 실패 시 localStorage fallback
                    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
                    if (local) {
                        try {
                            setConfig(JSON.parse(local) as HomepageConfig);
                        } catch {
                            setConfig(DEFAULT_HOMEPAGE_CONFIG);
                        }
                    }
                } finally {
                    setIsLoading(false);
                }
            } else {
                // 비로그인: localStorage에서 로드
                const local = localStorage.getItem(LOCAL_STORAGE_KEY);
                if (local) {
                    try {
                        setConfig(JSON.parse(local) as HomepageConfig);
                    } catch {
                        setConfig(DEFAULT_HOMEPAGE_CONFIG);
                    }
                }
            }
        };

        loadConfig();
    }, [isLoggedIn]);

    // 설정 업데이트 (메모리 상태만 변경, 저장은 saveConfig 호출해야 함)
    const updateConfig = useCallback((partial: Partial<HomepageConfig>) => {
        setConfig(prev => ({ ...prev, ...partial }));
    }, []);

    // 설정 저장
    // override를 넘기면 현재 상태 대신 해당 설정을 저장 (setState 비동기 반영 전에 저장해도 안전)
    const saveConfig = useCallback(async (override?: Partial<HomepageConfig>): Promise<boolean> => {
        setIsSaving(true);
        try {
            const configToSave: HomepageConfig = { ...config, ...override, isConfigured: true };

            // 항상 localStorage에 저장 (오프라인 fallback)
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(configToSave));

            if (isLoggedIn) {
                // 로그인: API에 저장
                const res = await axios.post<{ success: boolean }>(
                    `${API_BASE_URL}/api/user/homepage-config`,
                    configToSave,
                    { withCredentials: true }
                );
                if (!res.data.success) return false;
            }

            setConfig(configToSave);
            return true;
        } catch (err) {
            console.error('[Homepage] 설정 저장 실패:', err);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [config, isLoggedIn]);

    // 설정 초기화
    const resetConfig = useCallback(() => {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setConfig(DEFAULT_HOMEPAGE_CONFIG);
    }, []);

    return { config, isLoading, isSaving, updateConfig, saveConfig, resetConfig };
}
