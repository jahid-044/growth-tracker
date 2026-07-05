import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getAccessToken,
  setAccessToken,
  subscribeToToken,
  registerAuthFailureHandler,
} from "@/lib/tokenStore";
import { loginRequest, refreshRequest, meRequest, logoutRequest } from "@/lib/auth";
import type { User } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  bootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(getAccessToken);
  const [isLoading, setIsLoading] = useState(true);
  // Guards against StrictMode's double-mount firing two concurrent /refresh calls,
  // which would race the backend's refresh-token rotation.
  const didBootstrap = useRef(false);

  /**
   * Restore the session on load. With a persisted access token, go straight to
   * `/me` — if the token is expired, the axios interceptor transparently
   * refreshes and retries. Without one, fall back to the httpOnly refresh
   * cookie (e.g. localStorage was cleared). Silent on 401 either way.
   */
  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!getAccessToken()) {
        const { accessToken } = await refreshRequest();
        setAccessToken(accessToken);
      }
      const { user } = await meRequest();
      setUser(user);
    } catch {
      // No valid token or refresh cookie → user simply isn't logged in. Stay silent.
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mirror token changes (interceptor- or other-tab-driven) into React state.
    const unsubscribe = subscribeToToken((token) => {
      setAccessTokenState(token);
      // A null token means logout or unrecoverable refresh failure — possibly
      // from another tab via the storage event. Clear user so guards redirect.
      if (token === null) setUser(null);
    });
    // When refresh ultimately fails, clear user so guards redirect to /login.
    registerAuthFailureHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
    // Restore session on mount (persisted token first, refresh cookie as fallback).
    if (!didBootstrap.current) {
      didBootstrap.current = true;
      void bootstrap();
    }
    return unsubscribe;
  }, [bootstrap]);

  const login = useCallback(async (email: string, password: string) => {
    const { accessToken, user } = await loginRequest(email, password);
    setAccessToken(accessToken);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    accessToken,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    bootstrap,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
