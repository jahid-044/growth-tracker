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
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Guards against StrictMode's double-mount firing two concurrent /refresh calls,
  // which would race the backend's refresh-token rotation.
  const didBootstrap = useRef(false);

  /** Restore the session on load using the httpOnly refresh cookie. Silent on 401. */
  const bootstrap = useCallback(async () => {
    setIsLoading(true);
    try {
      const { accessToken } = await refreshRequest();
      setAccessToken(accessToken);
      const { user } = await meRequest();
      setUser(user);
    } catch {
      // No valid refresh cookie → user simply isn't logged in. Stay silent.
      setAccessToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Mirror interceptor-driven token changes into React state.
    const unsubscribe = subscribeToToken(setAccessTokenState);
    // When refresh ultimately fails, clear user so guards redirect to /login.
    registerAuthFailureHandler(() => {
      setAccessToken(null);
      setUser(null);
    });
    // Restore session on mount (sets loading state, then fetches via the refresh cookie).
    if (!didBootstrap.current) {
      didBootstrap.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
