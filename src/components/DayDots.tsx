import { dayLetter, isFuture, shortDate } from '@/lib/dates';

import { Tick } from './ui';

type Props = {
  days: string[];
  log: Record<string, true>;
  today: string;
  size?: 'normal' | 'small';
  onToggle?: (iso: string, ticked: boolean) => void;
};

/**
 * Seven circles, one per day of the practice week. Tap to tick. This is the
 * whole parent interface, so it has to feel like something: a real press,
 * a real fill.
 */
export function DayDots({ days, log, today, size = 'normal', onToggle }: Props) {
  return (
    <div className={`days${size === 'small' ? ' small' : ''}`} role="group" aria-label="Practice days">
      {days.map((iso) => {
        const ticked = !!log[iso];
        const future = isFuture(iso, today);
        const isToday = iso === today;
        const interactive = !!onToggle && !future;
        const cls = ['day', ticked ? 'ticked' : '', isToday ? 'today' : '', future ? 'future' : ''].filter(Boolean).join(' ');
        return (
          <button
            key={iso}
            type="button"
            className={cls}
            disabled={!interactive}
            aria-pressed={ticked}
            aria-label={`${shortDate(iso)}${ticked ? ', practised' : ''}`}
            title={shortDate(iso)}
            onClick={() => onToggle?.(iso, !ticked)}>
            <span className="dot">
              <Tick />
            </span>
            {size === 'normal' ? <span className="label">{dayLetter(iso)}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
