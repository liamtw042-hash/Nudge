import { slipDateRange, slipTitle } from '@/lib/slip';
import type { Student } from '@/lib/types';

import { DayDots } from './DayDots';

type Props = {
  student: Student;
  today: string;
  onToggle?: (iso: string, ticked: boolean) => void;
  footer?: React.ReactNode;
};

/** The slip as the parent sees it. Also the print view. */
export function SlipCard({ student, today, onToggle, footer }: Props) {
  const slip = student.slip;
  return (
    <article className="slip" aria-label={slipTitle(student)}>
      <div className="slip-band" />
      <div className="slip-body">
        <p className="eyebrow">{slip ? slipDateRange(slip) : 'No slip yet'}</p>
        <h1 style={{ marginTop: 6 }}>{slipTitle(student)}</h1>
        {slip ? (
          <>
            <ol>
              {slip.items.map((item) => (
                <li key={item.id}>
                  <div>
                    <div className="item-title">{item.title}</div>
                    {item.instruction ? <div className="item-instruction">{item.instruction}</div> : null}
                  </div>
                </li>
              ))}
            </ol>
            {slip.note ? <p className="note">{slip.note}</p> : null}
            <div style={{ marginTop: 22 }}>
              <div className="row between" style={{ marginBottom: 10 }}>
                <span className="eyebrow">Tick each day you practise</span>
                <span className="small muted">
                  Aim for {slip.targetDays} day{slip.targetDays === 1 ? '' : 's'}
                </span>
              </div>
              <DayDots days={slipDaysOf(slip.startDate)} log={student.log} today={today} onToggle={onToggle} />
            </div>
          </>
        ) : (
          <p className="muted" style={{ marginTop: 12 }}>
            {student.teacherName || 'Your teacher'} hasn't written this week's slip yet.
          </p>
        )}
      </div>
      <div className="slip-foot">
        <span>{student.teacherName ? `From ${student.teacherName}` : ''}</span>
        <span>{footer ?? 'Practice Slip'}</span>
      </div>
    </article>
  );
}

function slipDaysOf(startDate: string): string[] {
  const out: string[] = [];
  const [y, m, d] = startDate.split('-').map(Number);
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y ?? 1970, (m ?? 1) - 1, (d ?? 1) + i);
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`);
  }
  return out;
}
