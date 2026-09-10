import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { SlipCard } from '@/components/SlipCard';
import { SlipEditor } from '@/components/SlipEditor';
import { Empty, TopBar, useToast } from '@/components/ui';
import { repo } from '@/data';
import { access } from '@/lib/billing';
import { config } from '@/lib/config';
import { longDate, todayIso } from '@/lib/dates';
import { cleanSlip, newSlip, shareText, slipDateRange, weekStatus } from '@/lib/slip';
import type { Slip, Student } from '@/lib/types';

export function StudentPage() {
  const { id = '' } = useParams();
  const { user, teacher } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [history, setHistory] = useState<Slip[]>([]);
  const [draft, setDraft] = useState<Slip | null>(null);
  const [toast, showToast] = useToast();
  const today = todayIso();
  const acc = teacher ? access(teacher) : null;

  const load = useCallback(async () => {
    const s = await repo().getStudentPublic(id);
    if (!s || !user || s.teacherId !== user.id) {
      setStudent(null);
      return;
    }
    setStudent(s);
    setHistory(await repo().listSlipHistory(id));
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const link = `${config.publicUrl}/s/${id}`;

  function startSlip(from: Slip | null) {
    setDraft(newSlip(today, from));
  }

  async function save() {
    if (!student || !draft || !user) return;
    const clean = cleanSlip(draft);
    if (!clean) {
      showToast('Add at least one thing to practise.');
      return;
    }
    await repo().writeSlip(student.id, clean, student.slip);
    await repo().logEvent(user.id, student.id, 'slip_written');
    setDraft(null);
    await load();
    showToast('Slip saved. Now send it.');
  }

  async function share() {
    if (!student || !user) return;
    const text = shareText(student, link);
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: `${student.name}'s practice this week`, text });
      } else {
        await navigator.clipboard.writeText(text);
        showToast('Copied. Paste it into a message to the parent.');
      }
      await repo().logEvent(user.id, student.id, 'slip_shared');
    } catch {
      // user cancelled the share sheet
    }
  }

  async function copyLink() {
    if (!user || !student) return;
    await navigator.clipboard.writeText(link);
    await repo().logEvent(user.id, student.id, 'slip_shared');
    showToast('Link copied.');
  }

  async function toggleArchive() {
    if (!student) return;
    await repo().updateStudent(student.id, { archived: !student.archived });
    await load();
  }

  async function remove() {
    if (!student) return;
    if (!window.confirm(`Delete ${student.name} and their slips? The parent's link will stop working.`)) return;
    await repo().deleteStudent(student.id);
    navigate('/app');
  }

  if (student === undefined) return <><TopBar /><main className="wrap page"><p className="muted">Loading…</p></main></>;
  if (student === null) return <><TopBar /><main className="wrap page"><Empty title="Student not found"><Link to="/app">Back to students</Link></Empty></main></>;

  const ws = weekStatus(student, today);

  return (
    <>
      <TopBar />
      <main className="wrap page">
        <p className="small">
          <Link to="/app">← Students</Link>
        </p>
        <div className="page-head" style={{ marginTop: 8 }}>
          <div>
            <p className="eyebrow">{student.instrument}{student.parentName ? ` · Parent: ${student.parentName}` : ''}</p>
            <h1>{student.name}</h1>
          </div>
          {!draft ? (
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {student.slip ? (
                <button type="button" className="btn" onClick={() => startSlip(student.slip)} disabled={!acc?.canWrite}>
                  New slip from last week
                </button>
              ) : null}
              <button type="button" className="btn primary" onClick={() => startSlip(null)} disabled={!acc?.canWrite}>
                {student.slip ? 'New blank slip' : 'Write first slip'}
              </button>
            </div>
          ) : null}
        </div>

        {acc && !acc.canWrite ? (
          <p className="small muted" style={{ marginBottom: 16 }}>
            Trial ended. <Link to="/app/billing">Subscribe</Link> to write new slips.
          </p>
        ) : null}

        {draft ? (
          <SlipEditor slip={draft} onChange={setDraft} onSave={() => void save()} onCancel={() => setDraft(null)} />
        ) : (
          <div className="stack" style={{ gap: 20 }}>
            {student.parentNote ? (
              <div className="card tight" style={{ borderColor: 'var(--marigold)' }}>
                <p className="eyebrow">Note from {student.parentName || 'the parent'}</p>
                <p className="serif" style={{ fontSize: '1.1rem', marginTop: 4 }}>
                  {student.parentNote.text}
                </p>
              </div>
            ) : null}

            {student.slip && ws ? (
              <div className="card tight row between" style={{ flexWrap: 'wrap' }}>
                <div>
                  <strong>
                    {ws.tickedCount} of {ws.targetDays} days
                  </strong>
                  <span className="muted"> practised this week</span>
                  {ws.quietDays >= 2 ? <span className="pill warn" style={{ marginLeft: 8 }}>Quiet {ws.quietDays} days</span> : null}
                </div>
                <div className="row">
                  <button type="button" className="btn primary" onClick={() => void share()}>
                    Send to parent
                  </button>
                  <button type="button" className="btn" onClick={() => void copyLink()}>
                    Copy link
                  </button>
                  <a className="btn" href={`/s/${student.id}/print`} target="_blank" rel="noreferrer">
                    Print
                  </a>
                </div>
              </div>
            ) : null}

            <SlipCard student={student} today={today} footer={<span className="small">Parent link: {link.replace(/^https?:\/\//, '')}</span>} />

            {!student.slip ? (
              <p className="muted small">
                The parent link is permanent: <span className="serif">{link}</span>. Send it once; every new slip shows up there.
              </p>
            ) : null}

            {history.length > 0 ? (
              <details>
                <summary className="muted" style={{ cursor: 'pointer' }}>
                  Past slips ({history.length})
                </summary>
                <div className="stack" style={{ marginTop: 12 }}>
                  {history.map((h) => (
                    <div key={h.id} className="card tight">
                      <p className="eyebrow">{slipDateRange(h)}</p>
                      <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                        {h.items.map((i) => (
                          <li key={i.id} className="small">
                            <strong>{i.title}</strong>
                            {i.instruction ? ` – ${i.instruction}` : ''}
                          </li>
                        ))}
                      </ul>
                      <button type="button" className="btn quiet small" style={{ marginTop: 6 }} onClick={() => startSlip(h)} disabled={!acc?.canWrite}>
                        Reuse this slip
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}

            <div className="row" style={{ marginTop: 20, flexWrap: 'wrap' }}>
              <button type="button" className="btn quiet" onClick={() => void toggleArchive()}>
                {student.archived ? 'Un-archive' : 'Archive student'}
              </button>
              <button type="button" className="btn quiet danger" onClick={() => void remove()}>
                Delete
              </button>
              <span className="small faint">Added {longDate(new Date(student.createdAt).toISOString().slice(0, 10))}</span>
            </div>
          </div>
        )}
      </main>
      {toast}
    </>
  );
}
