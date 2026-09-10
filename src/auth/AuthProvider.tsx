import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authModule } from '@/data/firebase';
import { repo } from '@/data';
import { trialEnd } from '@/lib/billing';
import { config } from '@/lib/config';
import type { Teacher } from '@/lib/types';

export type AuthUser = { id: string; email: string; displayName: string };

type AuthState = {
  loading: boolean;
  user: AuthUser | null;
  teacher: Teacher | null;
  /** Email link flow: true after the link has been sent. */
  linkSent: boolean;
  signInWithGoogle(): Promise<void>;
  sendLink(email: string): Promise<void>;
  /** Local mode only. */
  signInLocal(email: string, name: string): Promise<void>;
  signOut(): Promise<void>;
  refreshTeacher(): Promise<void>;
  updateTeacher(patch: Partial<Pick<Teacher, 'name' | 'studio'>>): Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);
const LOCAL_KEY = 'practiceslip.localUser';
const EMAIL_KEY = 'practiceslip.emailForSignIn';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [linkSent, setLinkSent] = useState(false);

  const ensureTeacher = useCallback(async (u: AuthUser) => {
    const existing = await repo().getTeacher(u.id);
    if (existing) {
      setTeacher(existing);
      return;
    }
    const now = Date.now();
    const fresh: Teacher = {
      id: u.id,
      email: u.email,
      name: u.displayName || u.email.split('@')[0] || '',
      studio: '',
      createdAt: now,
      trialEndsAt: trialEnd(now),
      plan: 'trial',
      planUntil: null,
      activatedAt: null,
    };
    await repo().createTeacher(fresh);
    await repo().logEvent(u.id, null, 'signup');
    setTeacher(fresh);
  }, []);

  // Firebase mode: listen to auth (loaded on demand). Local mode: read the fake session.
  useEffect(() => {
    if (!config.useFirebase) {
      try {
        const raw = localStorage.getItem(LOCAL_KEY);
        const u = raw ? (JSON.parse(raw) as AuthUser) : null;
        if (u) {
          setUser(u);
          ensureTeacher(u).finally(() => setLoading(false));
          return;
        }
      } catch {
        // fall through
      }
      setLoading(false);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    authModule().then(({ mod, auth }) => {
      if (cancelled) return;
      if (mod.isSignInWithEmailLink(auth, window.location.href)) {
        const email = localStorage.getItem(EMAIL_KEY) ?? window.prompt('Confirm your email to finish signing in') ?? '';
        mod
          .signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem(EMAIL_KEY);
            window.history.replaceState({}, '', window.location.pathname);
          })
          .catch(() => undefined);
      }
      unsubscribe = mod.onAuthStateChanged(auth, async (fu) => {
        if (!fu) {
          setUser(null);
          setTeacher(null);
          setLoading(false);
          return;
        }
        const u: AuthUser = { id: fu.uid, email: fu.email ?? '', displayName: fu.displayName ?? '' };
        setUser(u);
        try {
          await ensureTeacher(u);
        } finally {
          setLoading(false);
        }
      });
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [ensureTeacher]);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      teacher,
      linkSent,
      async signInWithGoogle() {
        const { mod, auth } = await authModule();
        await mod.signInWithPopup(auth, new mod.GoogleAuthProvider());
      },
      async sendLink(email) {
        const { mod, auth } = await authModule();
        localStorage.setItem(EMAIL_KEY, email);
        await mod.sendSignInLinkToEmail(auth, email, { url: `${config.publicUrl}/app`, handleCodeInApp: true });
        setLinkSent(true);
      },
      async signInLocal(email, name) {
        const u: AuthUser = { id: `local-${email.toLowerCase()}`, email: email.toLowerCase(), displayName: name };
        localStorage.setItem(LOCAL_KEY, JSON.stringify(u));
        setUser(u);
        await ensureTeacher(u);
      },
      async signOut() {
        if (config.useFirebase) {
          const { mod, auth } = await authModule();
          await mod.signOut(auth);
        }
        localStorage.removeItem(LOCAL_KEY);
        setUser(null);
        setTeacher(null);
      },
      async refreshTeacher() {
        if (!user) return;
        setTeacher(await repo().getTeacher(user.id));
      },
      async updateTeacher(patch) {
        if (!user) return;
        await repo().updateTeacher(user.id, patch);
        setTeacher((t) => (t ? { ...t, ...patch } : t));
      },
    }),
    [loading, user, teacher, linkSent, ensureTeacher],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
