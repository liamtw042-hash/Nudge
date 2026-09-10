import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { TopBar } from '@/components/ui';
import { config } from '@/lib/config';

export function SignIn() {
  const { user, loading, signInWithGoogle, sendLink, signInLocal, linkSent } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to="/app" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const em = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) {
      setError('That email doesn\'t look right.');
      return;
    }
    setBusy(true);
    try {
      if (config.useFirebase) await sendLink(em);
      else await signInLocal(em, name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TopBar minimal />
      <main className="wrap page" style={{ maxWidth: 440 }}>
        <h1>Sign in</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          New here? This creates your account too. First 30 days are free.
        </p>

        {config.useFirebase ? (
          <button type="button" className="btn block" style={{ marginTop: 24 }} onClick={() => void signInWithGoogle().catch((e: Error) => setError(e.message))}>
            Continue with Google
          </button>
        ) : null}

        {linkSent ? (
          <div className="card" style={{ marginTop: 20 }}>
            <strong>Check your email.</strong>
            <p className="muted" style={{ marginTop: 6 }}>
              We sent a sign-in link to {email}. Open it on this device.
            </p>
          </div>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="stack" style={{ marginTop: 20 }}>
            {!config.useFirebase ? (
              <div className="field">
                <label htmlFor="name">Your name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms Chen" autoComplete="name" />
              </div>
            ) : null}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </div>
            {error ? <p className="error">{error}</p> : null}
            <button type="submit" className="btn primary block" disabled={busy}>
              {config.useFirebase ? 'Email me a sign-in link' : 'Continue'}
            </button>
            {!config.useFirebase ? <p className="hint">Local mode: your data stays in this browser. Set up Firebase to go live.</p> : null}
          </form>
        )}
      </main>
    </>
  );
}
