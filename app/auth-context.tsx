"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { withTimeout } from "@/lib/with-timeout";

type AuthResult = { error: string | null; needsEmailConfirm?: boolean };

const AuthContext = createContext<{
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    withTimeout(supabase.auth.getSession(), 5000)
      .then(({ data }) => {
        if (cancelled) return;
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch(() => {
        // Hung/broken request — fail open to a logged-out state rather
        // than leaving the whole app stuck on its loading screen.
        if (cancelled) return;
        setUser(null);
        setLoading(false);
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signUp(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    return { error: null, needsEmailConfirm: !data.session };
  }

  async function signIn(email: string, password: string): Promise<AuthResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signInWithGoogle(): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/` },
    });
    // On success the browser is already navigating away to Google, so
    // there's nothing to return to — this only ever resolves when
    // signInWithOAuth failed before redirecting (e.g. provider disabled).
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function resetPassword(email: string): Promise<AuthResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function updatePassword(newPassword: string): Promise<AuthResult> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function deleteAccount(): Promise<{ error: string | null }> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { error: "로그인 상태가 아니에요" };
    try {
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        return { error: body?.error ?? "계정 삭제에 실패했어요" };
      }
    } catch {
      return { error: "계정 삭제에 실패했어요" };
    }
    await supabase.auth.signOut();
    return { error: null };
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        deleteAccount,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
