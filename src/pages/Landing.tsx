import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { DayDots } from '@/components/DayDots';
import { TopBar } from '@/components/ui';
import { PRICE_MONTHLY_AUD, PRICE_YEARLY_AUD, TRIAL_DAYS } from '@/lib/billing';
import { slipDays, todayIso } from '@/lib/dates';

export function Landing() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/app" replace />;
  const today = todayIso();
  const demoDays = slipDays(shift(today, -4));
  const demoLog: Record<string, true> = {};
  for (const d of demoDays.slice(0, 4)) if (d !== today) demoLog[d] = true;

  return (
    <>
      <TopBar />
      <main className="wrap">
        <section className="hero">
          <p className="eyebrow">For private music teachers</p>
          <h1 style={{ marginTop: 10 }}>The practice notebook, except the parent actually sees it.</h1>
          <p className="lede">
            Write this week's practice in under a minute at the end of the lesson. It becomes a link. Send it to the parent from your own
            phone. They tick each day the child practises. You see who practised before they walk in.
          </p>
          <div className="row" style={{ marginTop: 26, flexWrap: 'wrap' }}>
            <Link to="/signin" className="btn primary big">
              Start free for {TRIAL_DAYS} days
            </Link>
            <span className="small muted">No card. No app for the child to install.</span>
          </div>
        </section>

        <section className="slip" style={{ margin: '28px 0 44px' }}>
          <div className="slip-band" />
          <div className="slip-body">
            <p className="eyebrow">This week</p>
            <h1 style={{ marginTop: 6 }}>Ava's practice this week</h1>
            <ol>
              <li>
                <div>
                  <div className="item-title">Minuet in G</div>
                  <div className="item-instruction">Hands together, bars 1–8, slowly. Three times, no mistakes.</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="item-title">C major scale</div>
                  <div className="item-instruction">Two octaves, hands separately. Say the finger numbers.</div>
                </div>
              </li>
              <li>
                <div>
                  <div className="item-title">Sight-reading card 12</div>
                  <div className="item-instruction">Clap it first.</div>
                </div>
              </li>
            </ol>
            <p className="note">Short and often beats one long session. Five minutes on a school night is a win.</p>
            <div style={{ marginTop: 22 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span className="eyebrow">Tick each day you practise</span>
                <span className="small muted">Aim for 5 days</span>
              </div>
              <DayDots days={demoDays} log={demoLog} today={today} onToggle={() => undefined} />
            </div>
          </div>
          <div className="slip-foot">
            <span>From Ms Chen</span>
            <span>Practice Slip</span>
          </div>
        </section>

        <section className="feature-grid" style={{ marginBottom: 44 }}>
          <Feature title="Under a minute" body="Copy last week's slip, change what changed, done. Templates for the things you assign every week." />
          <Feature title="No app, no login" body="The parent opens a link. That's it. It works in WhatsApp, iMessage, email, whatever your studio already uses." />
          <Feature title="Know before the lesson" body="One screen on Monday: every student, days practised, who's gone quiet since Wednesday." />
          <Feature title="No points, no streaks" body="Nothing for the child to game and nothing to nag about. A slip and seven circles. Prints on one page too." />
        </section>

        <section className="card" style={{ marginBottom: 44 }}>
          <div className="row between" style={{ flexWrap: 'wrap', gap: 20 }}>
            <div>
              <p className="eyebrow">Price</p>
              <div className="row" style={{ alignItems: 'baseline', gap: 10, marginTop: 6 }}>
                <span className="price">${PRICE_MONTHLY_AUD}</span>
                <span className="muted">AUD a month, or ${PRICE_YEARLY_AUD} a year</span>
              </div>
              <p className="muted" style={{ marginTop: 8 }}>
                Per teacher. Unlimited students, unlimited parents. {TRIAL_DAYS} days free first, nothing charged until you decide.
              </p>
            </div>
            <Link to="/signin" className="btn primary">
              Start free
            </Link>
          </div>
        </section>

        <section style={{ marginBottom: 60 }} className="stack">
          <h2>Why this and not a practice app</h2>
          <p className="muted">
            Practice apps are built for the child's device: timers, points, streaks, leaderboards. Teachers of young students keep saying the
            same thing: the parent is the lever. Portals parents have to log into don't get opened. So this one asks the parent for one tap,
            on a link they already have, and asks the child for nothing.
          </p>
          <p className="muted">
            Built in Newcastle, NSW. Questions go to a person, not a bot. Read the <Link to="/signin">first month free</Link> and decide then.
          </p>
        </section>
      </main>
    </>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="muted" style={{ marginTop: 8 }}>
        {body}
      </p>
    </div>
  );
}

function shift(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + days);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
