import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '@/auth/AuthProvider';
import { DayDots } from '@/components/DayDots';
import { Empty, TopBar } from '@/components/ui';
import { repo } from '@/data';
import { access } from '@/lib/billing';
import { todayIso } from '@/lib/dates';
import { token } from '@/lib/ids';
import { weekStatus } from '@/lib/slip';
import type { Student } from '@/lib/types';

export function Dashboard() {
  const { user, teacher } = useAuth();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('Piano');
  const [parentName, setParentName] = useState('');
  const today = todayIso();

  const load = useCallback(async () => {
    if (!user) return;
    setStudents(await repo().listStudents(user.id));
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    if (!user || !teacher || !name.trim()) return;
    const now = Date.now();
    const s: Student = {
      id: token(),
      teacherId: user.id,
      teacherName: teacher.name,
      name: name.trim(),
      instrument: instrument.trim(),
      parentName: parentName.trim(),
      archived: false,
      createdAt: now,
      updatedAt: now,
      slip: null,
      log: {},
      parentNote: null,
    };
    await repo().createStudent(s);
    await repo().logEvent(user.id, s.id, 'student_created');
    setName('');
    setParentName('');
    setAdding(false);
    await load();
  }

  const acc = teacher ? access(teacher) : null;
  const active = (students ?? []).filter((s) => !s.archived);
  const noSlips = active.length > 0 && active.every((s) => !s.slip);

  return (
    <>
      <TopBar />
      <main className="wrap page">
        <div className="page-head">
          <div>
            <p className="eyebrow">{teacher?.studio || 'Your studio'}</p>
            <h1>Students</h1>
          </div>
          <button type="button" className="btn primary" onClick={() => setAdding((v) => !v)}>
            {adding ? 'Cancel' : '+ Add student'}
          </button>
        </div>

        {acc && acc.state === 'trial' && acc.daysLeft <= 7 ? (
          <div className="card tight" style={{ marginBottom: 16 }}>
            <span className="pill warn">Trial ends in {acc.daysLeft} day{acc.daysLeft === 1 ? '' : 's'}</span>{' '}
            <Link to="/app/billing" style={{ marginLeft: 8 }}>
              Keep it going
            </Link>
          </div>
        ) : null}
        {acc && !acc.canWrite ? (
          <div className="card tight" style={{ marginBottom: 16 }}>
            <span className="pill bad">Trial ended</span>{' '}
            <span className="muted" style={{ marginLeft: 8 }}>
              You can still see everything. To write next week's slips, <Link to="/app/billing">subscribe</Link>.
            </span>
          </div>
        ) : null}

        {adding ? (
          <form onSubmit={(e) => void add(e)} className="card stack" style={{ marginBottom: 20 }}>
            <div className="field">
              <label htmlFor="s-name">Student's first name</label>
              <input id="s-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ava" autoFocus required />
            </div>
            <div className="row" style={{ alignItems: 'stretch' }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="s-inst">Instrument</label>
                <input id="s-inst" className="input" value={instrument} onChange={(e) => setInstrument(e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="s-parent">Parent's name (optional)</label>
                <input id="s-parent" className="input" value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="Priya" />
              </div>
            </div>
            <div>
              <button type="submit" className="btn primary">
                Add
              </button>
            </div>
          </form>
        ) : null}

        {students === null ? (
          <p className="muted">Loading…</p>
        ) : active.length === 0 ? (
          <Empty title="Add your first student">Takes ten seconds. Then write their first slip and send it to a parent.</Empty>
        ) : (
          <div className="card" style={{ padding: '4px 20px' }}>
            {noSlips ? (
              <p className="muted small" style={{ padding: '12px 0 0' }}>
                Tap a student to write this week's slip.
              </p>
            ) : null}
            {active.map((s) => (
              <StudentRow key={s.id} student={s} today={today} />
            ))}
          </div>
        )}

        {(students ?? []).some((s) => s.archived) ? (
          <p className="small faint" style={{ marginTop: 12 }}>
            {(students ?? []).filter((s) => s.archived).length} archived. Open a student and un-archive to bring them back.
          </p>
        ) : null}
      </main>
    </>
  );
}

function StudentRow({ student, today }: { student: Student; today: string }) {
  const ws = weekStatus(student, today);
  let status: React.ReactNode;
  if (!student.slip || !ws) status = <span className="pill plain">No slip yet</span>;
  else if (ws.weekOver) status = <span className="pill plain">Week over · {ws.tickedCount} days</span>;
  else if (ws.quietDays >= 3) status = <span className="pill bad">Quiet {ws.quietDays} days</span>;
  else if (!ws.onTrack) status = <span className="pill warn">Behind</span>;
  else status = <span className="pill">{ws.tickedCount} of {ws.targetDays} days</span>;

  return (
    <Link to={`/app/students/${student.id}`} className="student-row">
      <div>
        <div className="name">{student.name}</div>
        <div className="small muted row" style={{ gap: 8, marginTop: 4 }}>
          <span>{student.instrument}</span>
          {student.parentNote ? <span className="pill warn">Note from parent</span> : null}
        </div>
      </div>
      <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
        {status}
        {ws ? <DayDots days={ws.days} log={student.log} today={today} size="small" /> : null}
      </div>
    </Link>
  );
}
