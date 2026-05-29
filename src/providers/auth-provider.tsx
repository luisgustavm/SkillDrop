"use client";

import { onIdTokenChanged, type User } from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getClientAuth, isFirebaseConfigured } from "@/firebase/client";
import { getFirebaseErrorMessage } from "@/firebase/errors";
import {
  loginAsGuest,
  loginWithEmail,
  loginWithGoogle,
  logoutUser,
  recoverPassword,
  registerWithEmail,
} from "@/services/auth-service";
import type { SkillDropUser } from "@/types/user";

type AuthContextValue = {
  firebaseReady: boolean;
  user: User | null;
  profile: SkillDropUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
};

const SESSION_COOKIE_NAME = "skilldrop_session";
const ID_TOKEN_COOKIE_NAME = "skilldrop_id_token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ID_TOKEN_MAX_AGE_SECONDS = 60 * 55;

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getSecureCookieAttribute() {
  return window.location.protocol === "https:" ? "; Secure" : "";
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${getSecureCookieAttribute()}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${getSecureCookieAttribute()}`;
}

function clearSessionCookies() {
  clearCookie(SESSION_COOKIE_NAME);
  clearCookie(ID_TOKEN_COOKIE_NAME);
}

function buildFallbackProfile(currentUser: User, displayName?: string): SkillDropUser {
  const provider = currentUser.isAnonymous
    ? "anonymous"
    : currentUser.providerData.some((item) => item.providerId === "google.com")
      ? "google.com"
      : "password";

  return {
    uid: currentUser.uid,
    name: displayName ?? currentUser.displayName ?? (currentUser.isAnonymous ? "Convidado SkillDrop" : "Estudante"),
    email: currentUser.email,
    avatar: currentUser.photoURL,
    provider,
    isAnonymous: currentUser.isAnonymous,
    createdAt: null,
    updatedAt: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<SkillDropUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncProfileInBackground = useCallback(async (currentUser: User, displayName?: string) => {
    try {
      const { ensureUserProfile, getUserProfile } = await import("@/services/user-service");
      await ensureUserProfile(currentUser, displayName);
      const loadedProfile = await getUserProfile(currentUser.uid);
      if (loadedProfile) setProfile(loadedProfile);
    } catch {
      // Firestore can be unavailable while rules/indexes are being configured.
      // Authentication should remain fast and usable even if profile sync fails.
    }
  }, []);

  const syncTokenCookieInBackground = useCallback(async (currentUser: User) => {
    try {
      const token = await currentUser.getIdToken();
      setCookie(ID_TOKEN_COOKIE_NAME, token, ID_TOKEN_MAX_AGE_SECONDS);
    } catch {
      clearCookie(ID_TOKEN_COOKIE_NAME);
    }
  }, []);

  const applySession = useCallback((currentUser: User | null, displayName?: string) => {
    if (!currentUser) {
      setUser(null);
      setProfile(null);
      clearSessionCookies();
      return;
    }

    setCookie(SESSION_COOKIE_NAME, "1", SESSION_MAX_AGE_SECONDS);
    setUser(currentUser);
    setProfile(buildFallbackProfile(currentUser, displayName));

    void syncTokenCookieInBackground(currentUser);
    void syncProfileInBackground(currentUser, displayName);
  }, [syncProfileInBackground, syncTokenCookieInBackground]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setError("Firebase não está configurado. Confira o arquivo .env.local.");
      return;
    }

    const auth = getClientAuth();
    const unsubscribe = onIdTokenChanged(auth, (currentUser) => {
      setLoading(true);
      setError(null);

      try {
        applySession(currentUser);
      } catch (authError) {
        setError(getFirebaseErrorMessage(authError));
        clearSessionCookies();
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [applySession]);

  const runAuthAction = useCallback(
    async (action: () => Promise<User>, displayName?: string) => {
      setError(null);
      setLoading(true);

      try {
        const signedInUser = await action();
        applySession(signedInUser, displayName);
      } catch (authError) {
        const message = getFirebaseErrorMessage(authError);
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [applySession],
  );

  const runVoidAuthAction = useCallback(async (action: () => Promise<void>) => {
    setError(null);
    setLoading(true);

    try {
      await action();
    } catch (authError) {
      const message = getFirebaseErrorMessage(authError);
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseReady: isFirebaseConfigured,
      user,
      profile,
      loading,
      error,
      login: (email, password) => runAuthAction(() => loginWithEmail(email, password)),
      register: (name, email, password) => runAuthAction(() => registerWithEmail(name, email, password), name),
      loginGoogle: () => runAuthAction(loginWithGoogle),
      loginGuest: () => runAuthAction(loginAsGuest),
      resetPassword: (email) => runVoidAuthAction(() => recoverPassword(email)),
      logout: () =>
        runVoidAuthAction(async () => {
          await logoutUser();
          applySession(null);
        }),
      getIdToken: () => user?.getIdToken() ?? Promise.resolve(null),
    }),
    [applySession, error, loading, profile, runAuthAction, runVoidAuthAction, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth precisa estar dentro de AuthProvider.");
  }

  return context;
}

export function useUser() {
  return useAuth().profile;
}
