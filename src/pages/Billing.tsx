import { useState } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { TopBar, useToast } from '@/components/ui';
import { repo } from '@/data';
import { access, PRICE_MONTHLY_AUD, PRICE_YEARLY_AUD } from '@/lib/billing';
import { config } from '@/lib/config';
import { longDate } from '@/lib/dates';

/**
 * Billing without a payment processor: an invoice request the teacher pays
 * by bank transfer, then a manual switch-on. Hosted checkout links appear
 * automatically once the env has them.
 */
export function Billing() {
  const { user, teacher } = useAuth();
  const [toast, showToast] = useToast();
  const [requested, setRequested] = useState<'monthly' | 'yearly' | null>(null);
  if (!user || !teacher) return null;
  const acc = access(teacher);

  async function request(period: 'monthly' | 'yearly') {
    if (!user || !teacher) return;
    await repo().requestBilling({ teacherId: user.id, email: user.email, name: teacher.name, period, at: Date.now() });
    setRequested(period);
    const subject = encodeURIComponent(`Practice Slip invoice (${period})`);
    const body = encodeURIComponent(`Hi,\n\nPlease invoice me for Practice Slip, ${period}.\n\nName: ${teacher.name}\nStudio: ${teacher.studio}\nEmail: ${user.email}\n\nThanks`);
    window.location.href = `mailto:${config.supportEmail}?subject=${subject}&body=${body}`;
    showToast('Request sent. Invoice within a day.');
  }

  const status =
    acc.state === 'active'
      ? `Subscribed${teacher.planUntil ? ` until ${longDate(new Date(teacher.planUntil).toISOString().slice(0, 10))}` : ''}.`
      : acc.state === 'trial'
        ? `Free trial, ${acc.daysLeft} day${acc.daysLeft === 1 ? '' : 's'} left.`
        : acc.state === 'lapsed'
          ? 'Subscription ended. Renew below to keep writing slips.'
          : 'Trial ended. Subscribe below to keep writing slips.';

  return (
    <>
      <TopBar />
      <main className="wrap page" style={{ maxWidth: 620 }}>
        <p className="eyebrow">Billing</p>
        <h1 style={{ marginTop: 6 }}>{status}</h1>
        <p className="muted" style={{ marginTop: 10 }}>
          One price, per teacher, unlimited students and parents. Everything stays readable if you stop; you just can't write new slips.
        </p>

        <div className="feature-grid" style={{ marginTop: 24 }}>
          <PlanCard
            title="Monthly"
            price={`$${PRICE_MONTHLY_AUD}`}
            per="AUD / month"
            checkout={config.checkoutMonthly}
            requested={requested === 'monthly'}
            onRequest={() => void request('monthly')}
          />
          <PlanCard
            title="Yearly"
            price={`$${PRICE_YEARLY_AUD}`}
            per="AUD / year · two months free"
            checkout={config.checkoutYearly}
            requested={requested === 'yearly'}
            onRequest={() => void request('yearly')}
            highlight
          />
        </div>

        {!config.checkoutMonthly && !config.checkoutYearly ? (
          <div className="card" style={{ marginTop: 20 }}>
            <h3>How paying works right now</h3>
            <p className="muted" style={{ marginTop: 8, whiteSpace: 'pre-line' }}>
              {config.payInstructions}
            </p>
            <p className="small faint" style={{ marginTop: 10 }}>
              Card payments are coming. Until then it's an invoice from a sole trader with an ABN, paid however you pay any other invoice.
            </p>
          </div>
        ) : null}

        <p className="small muted" style={{ marginTop: 24 }}>
          Questions: <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
        </p>
      </main>
      {toast}
    </>
  );
}

function PlanCard({
  title,
  price,
  per,
  checkout,
  requested,
  onRequest,
  highlight = false,
}: {
  title: string;
  price: string;
  per: string;
  checkout: string;
  requested: boolean;
  onRequest: () => void;
  highlight?: boolean;
}) {
  return (
    <div className="card" style={highlight ? { borderColor: 'var(--green)' } : undefined}>
      <p className="eyebrow">{title}</p>
      <div className="row" style={{ alignItems: 'baseline', gap: 8, marginTop: 6 }}>
        <span className="price">{price}</span>
      </div>
      <p className="muted small">{per}</p>
      <div style={{ marginTop: 16 }}>
        {checkout ? (
          <a className={`btn block ${highlight ? 'primary' : ''}`} href={checkout}>
            Pay by card
          </a>
        ) : requested ? (
          <span className="pill">Invoice requested</span>
        ) : (
          <button type="button" className={`btn block ${highlight ? 'primary' : ''}`} onClick={onRequest}>
            Request invoice
          </button>
        )}
      </div>
    </div>
  );
}
