"use client";

import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  createHandleEmail,
  getSupabaseBrowserClient,
  isValidAuthHandle,
  normalizeAuthHandle,
} from "@/shared/api/supabase";

export type AuthProfile = Readonly<{
  handle: string;
  id: string;
  isAdmin: boolean;
}>;

type AuthContextValue = Readonly<{
  client: SupabaseClient | null;
  error: string | null;
  isConfigured: boolean;
  isLoading: boolean;
  profile: AuthProfile | null;
  session: Session | null;
  signIn: (handle: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  signUp: (handle: string, password: string) => Promise<string | null>;
  user: User | null;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = Readonly<{
  children: ReactNode;
}>;

function getAdminHandles(): Set<string> {
  return new Set(
    (process.env.NEXT_PUBLIC_PLANORA_ADMIN_HANDLES ?? "")
      .split(",")
      .map((handle) => normalizeAuthHandle(handle))
      .filter(isValidAuthHandle),
  );
}

function getHandleFromSession(session: Session | null): string | null {
  const handle = session?.user.user_metadata.handle;

  return typeof handle === "string" && isValidAuthHandle(handle)
    ? normalizeAuthHandle(handle)
    : null;
}

function createProfile(session: Session | null): AuthProfile | null {
  const handle = getHandleFromSession(session);

  if (!session || !handle) {
    return null;
  }

  return {
    handle,
    id: session.user.id,
    isAdmin: getAdminHandles().has(handle),
  };
}

function getAuthErrorMessage(message: string): string {
  if (message.includes("Invalid login credentials")) {
    return "Неверный логин или пароль.";
  }

  if (message.includes("User already registered")) {
    return "Такой аккаунт уже зарегистрирован.";
  }

  return message;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const client = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(client));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoading(false);
      return;
    }

    let isDisposed = false;

    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (isDisposed) {
        return;
      }

      if (sessionError) {
        setError(getAuthErrorMessage(sessionError.message));
      }

      setSession(data.session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError(null);
    });

    return () => {
      isDisposed = true;
      subscription.unsubscribe();
    };
  }, [client]);

  const upsertProfile = useCallback(
    async (nextSession: Session | null, handle: string) => {
      if (!client || !nextSession) {
        return;
      }

      await client.from("profiles").upsert({
        handle,
        id: nextSession.user.id,
        updated_at: new Date().toISOString(),
      });
    },
    [client],
  );

  const signIn = useCallback(
    async (handle: string, password: string): Promise<string | null> => {
      if (!client) {
        return "Supabase не настроен. Добавьте переменные окружения.";
      }

      const normalizedHandle = normalizeAuthHandle(handle);

      if (!isValidAuthHandle(normalizedHandle)) {
        return "Логин должен начинаться с @ и содержать только lowercase буквы, цифры и _.";
      }

      setIsLoading(true);
      setError(null);

      const { data, error: signInError } = await client.auth.signInWithPassword(
        {
          email: createHandleEmail(normalizedHandle),
          password,
        },
      );

      setIsLoading(false);

      if (signInError) {
        const message = getAuthErrorMessage(signInError.message);
        setError(message);
        return message;
      }

      await upsertProfile(data.session, normalizedHandle);
      return null;
    },
    [client, upsertProfile],
  );

  const signUp = useCallback(
    async (handle: string, password: string): Promise<string | null> => {
      if (!client) {
        return "Supabase не настроен. Добавьте переменные окружения.";
      }

      const normalizedHandle = normalizeAuthHandle(handle);

      if (!isValidAuthHandle(normalizedHandle)) {
        return "Логин должен начинаться с @ и содержать только lowercase буквы, цифры и _.";
      }

      setIsLoading(true);
      setError(null);

      const { data, error: signUpError } = await client.auth.signUp({
        email: createHandleEmail(normalizedHandle),
        password,
        options: {
          data: {
            handle: normalizedHandle,
          },
        },
      });

      setIsLoading(false);

      if (signUpError) {
        const message = getAuthErrorMessage(signUpError.message);
        setError(message);
        return message;
      }

      await upsertProfile(data.session, normalizedHandle);
      return null;
    },
    [client, upsertProfile],
  );

  const signOut = useCallback(async () => {
    if (!client) {
      return;
    }

    setIsLoading(true);
    await client.auth.signOut();
    setSession(null);
    setIsLoading(false);
  }, [client]);

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      error,
      isConfigured: Boolean(client),
      isLoading,
      profile: createProfile(session),
      session,
      signIn,
      signOut,
      signUp,
      user: session?.user ?? null,
    }),
    [client, error, isLoading, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
