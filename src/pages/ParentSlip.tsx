import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { SlipCard } from '@/components/SlipCard';
import { Logo } from '@/components/ui';
import { repo } from '@/data';
import { todayIso } from '@/lib/dates';
import { weekStatus } from '@/lib/slip';
import type { Student } from '@/lib/types';

const OPEN_KEY = 'practiceslip.opened';

/**
 * The parent's page. No login, no app. The URL is the key. It has to load
 * fast, work one-handed, and never ask for anything but a tap.
 */
export function ParentSlip({ print = false }: { print?: boolean }) {
  const { token = '' } = useParams();
  const [student, setStudent] = useState<Student | null | undefined>(undefined);
  const [note, setNote] = useState('');
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const today = todayIso();
  const loggedOpen = useRef(false);

  const load = useCallback(async () => {
    const s = await repo().getStudentPublic(token);
    setStudent(s);
    if (s && !loggedOpen.current) {
      loggedOpen.current = true;
      // Once per device per day, so the teacher's stats mean something.
      const key = `${OPEN_KEY}.${token}`;
      try {
        if (localStorage.getItem(key) !== today) {
          localStorage.setItem(key, today);
          await repo().logEvent(s.teacherId, s.id, 'parent_opened');
        }
      } catch {
        // storage unavailable; skip the event
      }
    }
  }, [token, today]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (print && student) setTimeout(() => window.print(), 300);
  }, [print, student]);

  async function toggle(iso: string, ticked: boolean) {
    if (!student) return;
    // Optimistic: the tap must feel instant.
    const log = { ...student.log };
    if (ticked) log[iso] = true;
    else delete log[iso];
    setStudent({ ...student, log });
    await repo().setDay(token, iso, ticked);
    if (ticked) await repo().logEvent(student.teacherId, student.id, 'day_ticked');
  }

  async function sendNote() {
    if (!student || !note.trim()) return;
    setNoteState('saving');
    await repo().setParentNote(token, note);
    await repo().logEvent(student.teacherId, student.id, 'parent_note');
    setNoteState('saved');
    setStudent({ ...student, parentNote: { text: note.trim(), at: Date.now() } });
    setNote('');
  }

  if (student === undefined) return <main className="wrap page"><p className="muted">Loading…</p></main>;
  if (student === null) {
    return (
      <main className="wrap page" style={{ maxWidth: 480 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>This link isn't active</h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Ask the teacher to send it again.
          </p>
        </div>
      </main>
    );
  }

  const ws = weekStatus(student, today);
  const encouragement = ws ? line(ws.tickedCount, ws.targetDays, ws.weekOver) : null;

  return (
    <main className="wrap page" style={{ maxWidth: 560, paddingTop: 20 }}>
      <SlipCard student={student} today={today} onToggle={print ? undefined : toggle} />
      {!print && student.slip ? (
        <div className="stack" style={{ marginTop: 16 }}>
          {encouragement ? <p className="muted" style={{ textAlign: 'center' }}>{encouragement}</p> : null}
          <div className="card tight">
            <label htmlFor="pnote" className="small muted">
              Anything {student.teacherName || 'the teacher'} should know before the lesson?
            </label>
            <div className="row" style={{ marginTop: 8, alignItems: 'stretch' }}>
              <input id="pnote" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Bar 6 kept going wrong" maxLength={500} />
              <button type="button" className="btn" onClick={() => void sendNote()} disabled={!note.trim() || noteState === 'saving'}>
                Send
              </button>
            </div>
            {noteState === 'saved' ? <p className="small muted" style={{ marginTop: 6 }}>Sent. They'll see it on their side.</p> : null}
            {student.parentNote && noteState !== 'saved' ? (
              <p className="small faint" style={{ marginTop: 6 }}>Last note: “{student.parentNote.text}”</p>
            ) : null}
          </div>
          <p className="small faint" style={{ textAlign: 'center' }}>
            Bookmark this page. Every new slip from {student.teacherName || 'the teacher'} appears here.
          </p>
        </div>
      ) : null}
      <p className="small faint row" style={{ justifyContent: 'center', gap: 6, marginTop: 28 }}>
        <span style={{ width: 16, height: 16, display: 'inline-flex' }}>
          <Logo />
        </span>
        Practice Slip
      </p>
    </main>
  );
}

function line(ticked: number, target: number, over: boolean): string {
  if (over) return ticked >= target ? `${ticked} days last week. That's the habit.` : `${ticked} day${ticked === 1 ? '' : 's'} last week. New slip coming after the lesson.`;
  if (ticked === 0) return 'Five minutes counts. Tick it when it happens.';
  if (ticked >= target) return `${ticked} days already. Anything more is a bonus.`;
  return `${ticked} down, ${target - ticked} to go.`;
}
