import { createContext, useEffect, useState, type ReactNode } from 'react';
import { api, clearTokens, getAccessToken, signInRequest, signUpRequest, type ApiUser } from '@/lib/api';

export interface AuthContextValue {
  session: ApiUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateUser: (user: ApiUser) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAccessToken()) { setLoading(false); return; }
    api<ApiUser>('/auth/me').then(setSession).catch(() => { clearTokens(); setSession(null); }).finally(() => setLoading(false));
  }, []);

  async function signIn(email: string, password: string) {
    try { setSession(await signInRequest(email, password)); return null; }
    catch (error) { return error instanceof Error ? error.message : 'Sign in failed.'; }
  }
  async function signUp(name: string, email: string, password: string) {
    try { setSession(await signUpRequest(name, email, password)); return null; }
    catch (error) { return error instanceof Error ? error.message : 'Account creation failed.'; }
  }
  async function signOut() { clearTokens(); setSession(null); }

  return <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut, updateUser: setSession }}>{children}</AuthContext.Provider>;
}
