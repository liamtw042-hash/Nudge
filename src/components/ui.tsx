import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { config } from '@/lib/config';

export function Logo() {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="6" width="48" height="52" rx="4" fill="#fff" stroke="#2E5E4E" strokeWidth="4" />
      <line x1="18" y1="20" x2="46" y2="20" stroke="#2E5E4E" strokeWidth="4" strokeLinecap="round" />
      <line x1="18" y1="30" x2="40" y2="30" stroke="#2E5E4E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="22" cy="44" r="5" fill="#E4A63A" />
      <circle cx="34" cy="44" r="5" fill="#E4A63A" />
      <circle cx="46" cy="44" r="5" fill="none" stroke="#2E5E4E" strokeWidth="3" />
    </svg>
  );
}

export function Tick() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#1e2521" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TopBar({ minimal = false }: { minimal?: boolean }) {
  const { user, teacher, signOut } = useAuth();
  const isAdmin = !!user && config.adminEmails.includes(user.email.toLowerCase());
  return (
    <header className="topbar">
      <div className="wrap">
        <Link to={user ? '/app' : '/'} className="brand">
          <Logo />
          Practice Slip
        </Link>
        {!minimal && user ? (
          <nav className="nav" aria-label="Main">
            <NavLink to="/app" end>
              Students
            </NavLink>
            <NavLink to="/app/billing">Billing</NavLink>
            <NavLink to="/app/settings">Settings</NavLink>
            {isAdmin ? <NavLink to="/app/admin">Admin</NavLink> : null}
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                void signOut();
              }}>
              Sign out{teacher?.name ? '' : ''}
            </a>
          </nav>
        ) : null}
        {!minimal && !user ? (
          <nav className="nav" aria-label="Main">
            <NavLink to="/signin">Sign in</NavLink>
          </nav>
        ) : null}
      </div>
    </header>
  );
}

export function useToast(): [ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2400);
    return () => clearTimeout(t);
  }, [msg]);
  const node = msg ? (
    <div className="toast" role="status">
      {msg}
    </div>
  ) : null;
  return [node, setMsg];
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: 36 }}>
      <h2>{title}</h2>
      {children ? <div className="muted" style={{ marginTop: 8 }}>{children}</div> : null}
    </div>
  );
}

export function Loading() {
  return (
    <div className="wrap page">
      <p className="muted">Loading…</p>
    </div>
  );
}
