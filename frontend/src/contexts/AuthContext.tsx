import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';

const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const ACTIVITY_KEY = 'lastActivity';
const REMEMBER_KEY = 'rememberMe';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  setAuthData: (token: string, user: User, refreshToken?: string, rememberMe?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRemembered = (): boolean => localStorage.getItem(REMEMBER_KEY) === 'true';

  // Stable reference — must not be recreated on re-render (removeEventListener must match)
  const updateActivityRef = useRef(() => {
    localStorage.setItem(ACTIVITY_KEY, Date.now().toString());
  });
  const updateActivity = updateActivityRef.current;

  const clearSession = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem(ACTIVITY_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  };

  // Start idle-check interval and activity listeners
  const startIdleWatch = () => {
    stopIdleWatch();
    if (isRemembered()) return; // skip if "remember me"

    updateActivity();

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    idleTimerRef.current = setInterval(() => {
      if (isRemembered()) return;
      const last = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10);
      if (Date.now() - last > IDLE_TIMEOUT_MS) {
        clearSession();
      }
    }, 30_000); // check every 30 s

    // Clean up listeners when session ends
    (idleTimerRef as any)._events = events;
  };

  const stopIdleWatch = () => {
    if (idleTimerRef.current) {
      clearInterval(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    const events = (idleTimerRef as any)._events as string[] | undefined;
    if (events) {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
      (idleTimerRef as any)._events = undefined;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      // Check if idle timeout already expired before restoring session
      const remembered = localStorage.getItem(REMEMBER_KEY) === 'true';
      const last = parseInt(localStorage.getItem(ACTIVITY_KEY) || '0', 10);
      const expired = !remembered && last > 0 && Date.now() - last > IDLE_TIMEOUT_MS;

      if (!expired) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        startIdleWatch();
      } else {
        // Session expired while tab was closed — clear it silently
        clearSession();
      }
    }
    setIsLoading(false);

    return () => stopIdleWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Also stop watching when token is removed (i.e. logout triggered by idle check)
  useEffect(() => {
    if (!token) stopIdleWatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const login = async (email: string, password: string, rememberMe = false): Promise<void> => {
    const response: AuthResponse = await authApi.login(email, password);

    setToken(response.token);
    setUser(response.user);

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    startIdleWatch();
  };

  const setAuthData = (newToken: string, newUser: User, refreshToken?: string, rememberMe = false): void => {
    setToken(newToken);
    setUser(newUser);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    if (rememberMe) {
      localStorage.setItem(REMEMBER_KEY, 'true');
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    startIdleWatch();
  };

  const logout = (): void => {
    stopIdleWatch();
    // Invalidate server-side refresh token (fire-and-forget)
    authApi.logout().catch(() => { /* ignore errors on logout */ });
    clearSession();
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    setAuthData,
    logout,
    isAuthenticated: !!token && !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
