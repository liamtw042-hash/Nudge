import { LocalRepo } from '@/data/localRepo';
import { newSlip } from '@/lib/slip';
import type { Student, Teacher } from '@/lib/types';

function teacher(): Teacher {
  return { id: 't1', email: 't@x.test', name: 'Ms Chen', studio: '', createdAt: 1, trialEndsAt: 2, plan: 'trial', planUntil: null, activatedAt: null };
}

function student(id = 'tokentokentokentokenAB'): Student {
  return { id, teacherId: 't1', teacherName: 'Ms Chen', name: 'Ava', instrument: 'Piano', parentName: '', archived: false, createdAt: 1, updatedAt: 1, slip: null, log: {}, parentNote: null };
}

describe('LocalRepo', () => {
  it('stores teachers and students per teacher', async () => {
    const r = new LocalRepo();
    await r.createTeacher(teacher());
    await r.createStudent(student('a234567890123456789012'));
    await r.createStudent({ ...student('b234567890123456789012'), teacherId: 't2' });
    expect((await r.getTeacher('t1'))?.name).toBe('Ms Chen');
    expect((await r.listStudents('t1')).map((s) => s.id)).toEqual(['a234567890123456789012']);
  });

  it('writes slips, archives the previous one, and clears the parent note', async () => {
    const r = new LocalRepo();
    const s = student();
    await r.createStudent(s);
    const first = newSlip('2026-09-01', null);
    await r.writeSlip(s.id, first, null);
    await r.setParentNote(s.id, 'bar 6 is hard');
    expect((await r.getStudentPublic(s.id))?.parentNote?.text).toBe('bar 6 is hard');

    const second = newSlip('2026-09-08', first);
    await r.writeSlip(s.id, second, first);
    const after = await r.getStudentPublic(s.id);
    expect(after?.slip?.id).toBe(second.id);
    expect(after?.parentNote).toBeNull();
    expect((await r.listSlipHistory(s.id)).map((h) => h.id)).toEqual([first.id]);
  });

  it('lets a parent tick and untick days', async () => {
    const r = new LocalRepo();
    const s = student();
    await r.createStudent(s);
    await r.setDay(s.id, '2026-09-08', true);
    await r.setDay(s.id, '2026-09-09', true);
    await r.setDay(s.id, '2026-09-08', false);
    expect((await r.getStudentPublic(s.id))?.log).toEqual({ '2026-09-09': true });
  });

  it('activates plans and extends an unexpired one', async () => {
    const r = new LocalRepo();
    await r.createTeacher(teacher());
    const now = 1_000_000;
    await r.adminActivate('t1', 'monthly', now);
    const a = await r.getTeacher('t1');
    expect(a?.plan).toBe('active');
    expect(a?.planUntil).toBe(now + 31 * 24 * 60 * 60 * 1000);
    await r.adminActivate('t1', 'yearly', now + 1000);
    const b = await r.getTeacher('t1');
    expect(b?.planUntil).toBe(now + (31 + 365) * 24 * 60 * 60 * 1000);
  });

  it('records events, feedback and billing requests', async () => {
    const r = new LocalRepo();
    await r.logEvent('t1', null, 'signup');
    await r.addFeedback({ teacherId: 't1', page: '/app', text: 'more colours', at: 5 });
    await r.requestBilling({ teacherId: 't1', email: 't@x.test', name: 'Ms Chen', period: 'yearly', at: 6 });
    expect((await r.adminListEvents(0)).map((e) => e.type)).toEqual(['signup']);
    expect((await r.adminListFeedback())[0]?.text).toBe('more colours');
    const b = await r.adminListBilling();
    expect(b[0]).toMatchObject({ period: 'yearly', status: 'open' });
    await r.adminCloseBilling(b[0]!.id);
    expect((await r.adminListBilling())[0]?.status).toBe('done');
  });
});
