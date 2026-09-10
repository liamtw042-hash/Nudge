import { cleanSlip, newSlip, possessive, shareText, weekStatus } from '@/lib/slip';
import type { Slip, Student } from '@/lib/types';

function student(over: Partial<Student> = {}): Student {
  return {
    id: 'tok',
    teacherId: 't1',
    teacherName: 'Ms Chen',
    name: 'Ava',
    instrument: 'Piano',
    parentName: 'Priya',
    archived: false,
    createdAt: 0,
    updatedAt: 0,
    slip: null,
    log: {},
    parentNote: null,
    ...over,
  };
}

function slip(over: Partial<Slip> = {}): Slip {
  return {
    id: 's1',
    startDate: '2026-09-07',
    items: [
      { id: 'a', title: 'Minuet in G', instruction: 'bars 1–8' },
      { id: 'b', title: 'C major scale', instruction: '' },
    ],
    targetDays: 5,
    note: '',
    writtenAt: 0,
    ...over,
  };
}

describe('cleanSlip', () => {
  it('drops blank rows and trims', () => {
    const s = cleanSlip(slip({ items: [{ id: 'x', title: '  Minuet ', instruction: ' slowly ' }, { id: 'y', title: '', instruction: '' }] }));
    expect(s?.items).toEqual([{ id: 'x', title: 'Minuet', instruction: 'slowly' }]);
  });

  it('promotes an instruction-only row to a title', () => {
    const s = cleanSlip(slip({ items: [{ id: 'x', title: '', instruction: 'Listen to the recording' }] }));
    expect(s?.items[0]).toMatchObject({ title: 'Listen to the recording', instruction: '' });
  });

  it('returns null when nothing is left', () => {
    expect(cleanSlip(slip({ items: [{ id: 'x', title: ' ', instruction: '' }] }))).toBeNull();
  });

  it('clamps target days to 1..7', () => {
    expect(cleanSlip(slip({ targetDays: 0 }))?.targetDays).toBe(1);
    expect(cleanSlip(slip({ targetDays: 12 }))?.targetDays).toBe(7);
  });
});

describe('newSlip', () => {
  it('copies items from a previous slip with fresh ids', () => {
    const prev = slip();
    const next = newSlip('2026-09-14', prev);
    expect(next.items.map((i) => i.title)).toEqual(['Minuet in G', 'C major scale']);
    expect(next.items[0]?.id).not.toBe(prev.items[0]?.id);
    expect(next.targetDays).toBe(5);
    expect(next.note).toBe('');
  });

  it('starts blank without a previous slip', () => {
    const next = newSlip('2026-09-14', null);
    expect(next.items).toHaveLength(1);
    expect(next.items[0]?.title).toBe('');
  });
});

describe('weekStatus', () => {
  it('is null without a slip', () => {
    expect(weekStatus(student(), '2026-09-10')).toBeNull();
  });

  it('counts ticked days within the slip week only', () => {
    const s = student({ slip: slip(), log: { '2026-09-07': true, '2026-09-08': true, '2026-09-01': true } });
    const ws = weekStatus(s, '2026-09-10');
    expect(ws?.tickedCount).toBe(2);
    expect(ws?.elapsed).toBe(4);
    expect(ws?.weekOver).toBe(false);
  });

  it('counts quiet days back from yesterday', () => {
    const s = student({ slip: slip(), log: { '2026-09-07': true } });
    // Today is the 11th; 8th, 9th, 10th were quiet.
    expect(weekStatus(s, '2026-09-11')?.quietDays).toBe(3);
    // Today itself never counts as quiet.
    expect(weekStatus(s, '2026-09-08')?.quietDays).toBe(0);
  });

  it('knows when the target is out of reach', () => {
    const s = student({ slip: slip({ targetDays: 5 }), log: {} });
    expect(weekStatus(s, '2026-09-09')?.onTrack).toBe(true); // 5 days remain
    expect(weekStatus(s, '2026-09-11')?.onTrack).toBe(false); // only 3 remain
  });

  it('marks the week over after seven days', () => {
    expect(weekStatus(student({ slip: slip() }), '2026-09-14')?.weekOver).toBe(true);
    expect(weekStatus(student({ slip: slip() }), '2026-09-13')?.weekOver).toBe(false);
  });
});

describe('shareText', () => {
  it('reads like a message a teacher would send', () => {
    const text = shareText(student({ slip: slip({ note: 'Little and often.' }) }), 'https://x.test/s/tok');
    expect(text).toBe(
      ["Ava's practice this week from Ms Chen", '1. Minuet in G – bars 1–8', '2. C major scale', 'Aim for 5 days.', 'Little and often.', 'Tick off each day here: https://x.test/s/tok'].join('\n'),
    );
  });

  it('handles possessives ending in s', () => {
    expect(possessive('James')).toBe("James'");
    expect(possessive('Ava')).toBe("Ava's");
  });
});
