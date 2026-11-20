import { useCallback, useEffect, useState } from 'react';

export interface AuthSessionUser {
  readonly id: number;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly level: number;
}

interface AuthCheckResponse {
  readonly success?: boolean;
  readonly user?: AuthSessionUser | null;
}

export function useAuthSession() {
  const [user, setUser] = useState<AuthSessionUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        setUser(null);
        return null;
      }
      const data = (await res.json()) as AuthCheckResponse;
      const nextUser = data.success && data.user ? data.user : null;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    void refreshAuth();

    const handleFocus = () => {
      void refreshAuth();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void refreshAuth();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshAuth]);

  return {
    user,
    isAuthenticated: user !== null,
    isCheckingAuth,
    refreshAuth,
  };
}
