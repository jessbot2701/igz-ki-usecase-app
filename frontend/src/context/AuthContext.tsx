import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';
import { User } from '../types';
import { authApi, EmailLinkResponse, LoginResponse } from '../api/authApi';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyEmailLink: (token: string) => Promise<EmailLinkResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  const raw = localStorage.getItem('igz_user');
  try {
    const user = raw ? (JSON.parse(raw) as User) : null;
    return user?.id && localStorage.getItem('igz_token') ? user : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const acceptSession = useCallback(
    (result: LoginResponse) => {
      queryClient.clear();
      localStorage.setItem('igz_token', result.token);
      localStorage.setItem('igz_user', JSON.stringify(result.user));
      setUser(result.user);
    },
    [queryClient]
  );

  const verifyEmailLink = useCallback(
    async (token: string): Promise<EmailLinkResponse> => {
      setLoading(true);
      try {
        const result = await authApi.verifyEmailLink(token);
        acceptSession(result);
        return result;
      } finally {
        setLoading(false);
      }
    },
    [acceptSession]
  );

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      try {
        const result = await authApi.login(email, password);
        acceptSession(result);
      } finally {
        setLoading(false);
      }
    },
    [acceptSession]
  );

  const logout = useCallback((): void => {
    localStorage.removeItem('igz_token');
    localStorage.removeItem('igz_user');
    queryClient.clear();
    setUser(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, loading, login, verifyEmailLink, logout }),
    [user, loading, login, verifyEmailLink, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden');
  }
  return ctx;
}
