import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { repo } from '@/data';

/** One textarea, always there. Feeds the weekly feedback summary. */
export function FeedbackButton() {
  const { user } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  async function send() {
    if (!text.trim()) return;
    await repo().addFeedback({ teacherId: user?.id ?? null, page: location.pathname, text: text.trim(), at: Date.now() });
    setText('');
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setOpen(false);
    }, 1500);
  }

  if (!open) {
    return (
      <button type="button" className="btn fab no-print" onClick={() => setOpen(true)}>
        Feedback
      </button>
    );
  }
  return (
    <div className="card fab no-print" style={{ width: 'min(360px, calc(100vw - 32px))' }}>
      <div className="stack" style={{ gap: 10 }}>
        <div className="row between">
          <strong>What's missing or annoying?</strong>
          <button type="button" className="btn quiet" onClick={() => setOpen(false)} aria-label="Close feedback">
            ×
          </button>
        </div>
        {done ? (
          <p className="muted">Thanks. Read every week.</p>
        ) : (
          <>
            <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Say it plainly." maxLength={2000} />
            <button type="button" className="btn primary" onClick={() => void send()} disabled={!text.trim()}>
              Send
            </button>
          </>
        )}
      </div>
    </div>
  );
}
