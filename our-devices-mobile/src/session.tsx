import * as SecureStore from "expo-secure-store";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ApiError, apiRequest } from "./api";
import { User } from "./types";

const TOKEN_KEY = "ourdevices.auth-token";

type SessionContextValue = {
  token: string | null;
  user: User | null;
  loading: boolean;
  restoreError: string;
  signIn: (identifier: string, password: string) => Promise<void>;
  register: (data: {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState("");

  const saveLogin = useCallback(async (identifier: string, password: string) => {
    const response = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
    });
    await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      await saveLogin(identifier.trim(), password);
    },
    [saveLogin],
  );

  const register = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      username: string;
      email: string;
      password: string;
    }) => {
      await apiRequest("/users", { method: "POST", body: data });
      await saveLogin(data.email, data.password);
    },
    [saveLogin],
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    async function restoreSession() {
      try {
        const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!savedToken) return;
        const currentUser = await apiRequest<User>("/users/me", { token: savedToken });
        if (active) {
          setToken(savedToken);
          setUser(currentUser);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        } else if (active) {
          setRestoreError(
            error instanceof Error ? error.message : "No se pudo restaurar la sesión.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, restoreError, signIn, register, signOut }),
    [token, user, loading, restoreError, signIn, register, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession debe usarse dentro de SessionProvider.");
  return context;
}
