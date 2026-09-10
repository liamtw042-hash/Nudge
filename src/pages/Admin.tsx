import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { TopBar, useToast } from '@/components/ui';
import { repo } from '@/data';
import { summarise, type Summary } from '@/lib/analytics';
import { access } from '@/lib/billing';
import { isAdminEmail } from '@/lib/config';
import type { BillingRequest, Feedback, Teacher } from '@/lib/types';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Signups, activation, retention, revenue, open invoices, feedback. One page, no manual work. */
export function Admin() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [billing, setBilling] = useState<BillingRequest[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    const r = repo();
    const [t, e, b, f] = await Promise.all([r.adminListTeachers(), r.adminListEvents(Date.now() - 90 * DAY_MS), r.adminListBilling(), r.adminListFeedback()]);
    setTeachers(t);
    setBilling(b);
    setFeedback(f);
    setSummary(summarise(t, e));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!user || !isAdminEmail(user.email)) return <Navigate to="/app" replace />;

  async function activate(teacherId: string, period: 'monthly' | 'yearly', requestId?: string) {
    await repo().adminActivate(teacherId, period);
    if (requestId) await repo().adminCloseBilling(requestId);
    await load();
    showToast('Activated.');
  }

  return (
    <>
      <TopBar />
      <main className="wrap page">
        <p className="eyebrow">Admin</p>
        <h1 style={{ marginTop: 6 }}>Dashboard</h1>

        {summary ? (
          <>
            <div className="feature-grid" style={{ marginTop: 20 }}>
              <Stat n={summary.teachers} label="Teachers" />
              <Stat n={summary.active} label="Paying" />
              <Stat n={summary.trialing} label="On trial" />
              <Stat n={`$${summary.mrrAud}`} label="MRR (AUD)" />
              <Stat n={summary.retention14 == null ? '–' : `${summary.retention14}%`} label="Wrote a slip in last 14d" />
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Activation funnel (teachers, last 90 days of events)</h3>
              <table className="data" style={{ marginTop: 10 }}>
                <tbody>
                  <Row k="Signed up" v={summary.funnel.signups} />
                  <Row k="Added a student" v={summary.funnel.addedStudent} />
                  <Row k="Wrote a slip" v={summary.funnel.wroteSlip} />
                  <Row k="Sent it to a parent" v={summary.funnel.shared} />
                  <Row k="A parent opened it" v={summary.funnel.parentOpened} />
                  <Row k="A parent ticked a day" v={summary.funnel.dayTicked} />
                </tbody>
              </table>
            </div>

            <div className="card" style={{ marginTop: 16 }}>
              <h3>Signups by week</h3>
              <table className="data" style={{ marginTop: 10 }}>
                <tbody>
                  {summary.signupsByWeek.length === 0 ? (
                    <tr>
                      <td className="muted">None yet</td>
                    </tr>
                  ) : (
                    summary.signupsByWeek.map((w) => <Row key={w.week} k={`w/c ${w.week}`} v={w.count} />)
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted">Loading…</p>
        )}

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Open invoice requests ({billing.filter((b) => b.status === 'open').length})</h3>
          <table className="data" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Who</th>
                <th>Plan</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {billing
                .filter((b) => b.status === 'open')
                .map((b) => (
                  <tr key={b.id}>
                    <td>
                      {b.name}
                      <br />
                      <span className="small muted">{b.email}</span>
                    </td>
                    <td>{b.period}</td>
                    <td>{new Date(b.at).toLocaleDateString('en-AU')}</td>
                    <td>
                      <button type="button" className="btn small" onClick={() => void activate(b.teacherId, b.period, b.id)}>
                        Mark paid + activate
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Teachers</h3>
          <table className="data" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((t) => {
                const a = access(t);
                return (
                  <tr key={t.id}>
                    <td>
                      {t.name || '(no name)'}
                      <br />
                      <span className="small muted">{t.email}</span>
                    </td>
                    <td>
                      {a.state === 'active' ? <span className="pill">Paying</span> : a.state === 'trial' ? <span className="pill plain">Trial · {a.daysLeft}d</span> : <span className="pill bad">{a.state === 'lapsed' ? 'Lapsed' : 'Trial ended'}</span>}
                    </td>
                    <td>{new Date(t.createdAt).toLocaleDateString('en-AU')}</td>
                    <td className="row" style={{ gap: 6 }}>
                      <button type="button" className="btn quiet small" onClick={() => void activate(t.id, 'monthly')}>
                        +1 month
                      </button>
                      <button type="button" className="btn quiet small" onClick={() => void activate(t.id, 'yearly')}>
                        +1 year
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3>Feedback ({feedback.length})</h3>
          <div className="stack" style={{ marginTop: 10 }}>
            {feedback.length === 0 ? <p className="muted">Nothing yet.</p> : null}
            {feedback.slice(0, 50).map((f) => (
              <div key={f.id} className="small">
                <span className="faint">
                  {new Date(f.at).toLocaleDateString('en-AU')} · {f.page}
                </span>
                <div>{f.text}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      {toast}
    </>
  );
}

function Stat({ n, label }: { n: number | string; label: string }) {
  return (
    <div className="card stat">
      <span className="n">{n}</span>
      <span className="small muted">{label}</span>
    </div>
  );
}

function Row({ k, v }: { k: string; v: number }) {
  return (
    <tr>
      <td>{k}</td>
      <td style={{ textAlign: 'right' }}>{v}</td>
    </tr>
  );
}
