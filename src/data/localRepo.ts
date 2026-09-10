import { shortId } from '@/lib/ids';
import type { AppEvent, BillingRequest, EventType, Feedback, Slip, Student, Teacher } from '@/lib/types';

import type { Repo } from './repo';

const KEY = 'practiceslip.v1';
const DAY_MS = 24 * 60 * 60 * 1000;

type Db = {
  teachers: Record<string, Teacher>;
  students: Record<string, Student>;
  history: Record<string, Slip[]>;
  events: AppEvent[];
  feedback: Feedback[];
  billing: BillingRequest[];
};

function empty(): Db {
  return { teachers: {}, students: {}, history: {}, events: [], feedback: [], billing: [] };
}

/**
 * localStorage-backed repo. Used when no Firebase config is present, and by
 * the tests. Behaves like the real one, including the parent-side rules.
 */
export class LocalRepo implements Repo {
  private storage: Storage;

  constructor(storage: Storage = window.localStorage) {
    this.storage = storage;
  }

  private read(): Db {
    try {
      const raw = this.storage.getItem(KEY);
      return raw ? { ...empty(), ...(JSON.parse(raw) as Partial<Db>) } : empty();
    } catch {
      return empty();
    }
  }

  private write(db: Db): void {
    this.storage.setItem(KEY, JSON.stringify(db));
  }

  private mutate<T>(fn: (db: Db) => T): T {
    const db = this.read();
    const out = fn(db);
    this.write(db);
    return out;
  }

  async getTeacher(id: string): Promise<Teacher | null> {
    return this.read().teachers[id] ?? null;
  }

  async createTeacher(t: Teacher): Promise<void> {
    this.mutate((db) => {
      db.teachers[t.id] = t;
    });
  }

  async updateTeacher(id: string, patch: Partial<Pick<Teacher, 'name' | 'studio'>>): Promise<void> {
    this.mutate((db) => {
      const t = db.teachers[id];
      if (t) db.teachers[id] = { ...t, ...patch };
    });
  }

  async listStudents(teacherId: string): Promise<Student[]> {
    return Object.values(this.read().students)
      .filter((s) => s.teacherId === teacherId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async createStudent(s: Student): Promise<void> {
    this.mutate((db) => {
      db.students[s.id] = s;
    });
  }

  async updateStudent(id: string, patch: Partial<Student>): Promise<void> {
    this.mutate((db) => {
      const s = db.students[id];
      if (s) db.students[id] = { ...s, ...patch, updatedAt: Date.now() };
    });
  }

  async deleteStudent(id: string): Promise<void> {
    this.mutate((db) => {
      delete db.students[id];
      delete db.history[id];
    });
  }

  async writeSlip(studentId: string, slip: Slip, previous: Slip | null): Promise<void> {
    this.mutate((db) => {
      const s = db.students[studentId];
      if (!s) return;
      if (previous) db.history[studentId] = [previous, ...(db.history[studentId] ?? [])].slice(0, 52);
      db.students[studentId] = { ...s, slip, parentNote: null, updatedAt: Date.now() };
    });
  }

  async listSlipHistory(studentId: string): Promise<Slip[]> {
    return this.read().history[studentId] ?? [];
  }

  async getStudentPublic(token: string): Promise<Student | null> {
    return this.read().students[token] ?? null;
  }

  async setDay(token: string, iso: string, ticked: boolean): Promise<void> {
    this.mutate((db) => {
      const s = db.students[token];
      if (!s) return;
      const log = { ...s.log };
      if (ticked) log[iso] = true;
      else delete log[iso];
      db.students[token] = { ...s, log, updatedAt: Date.now() };
    });
  }

  async setParentNote(token: string, text: string): Promise<void> {
    this.mutate((db) => {
      const s = db.students[token];
      if (!s) return;
      db.students[token] = { ...s, parentNote: text.trim() ? { text: text.trim().slice(0, 500), at: Date.now() } : null, updatedAt: Date.now() };
    });
  }

  async logEvent(teacherId: string, studentId: string | null, type: EventType): Promise<void> {
    this.mutate((db) => {
      db.events.push({ id: shortId(), teacherId, studentId, type, at: Date.now() });
      if (db.events.length > 5000) db.events = db.events.slice(-5000);
    });
  }

  async addFeedback(f: Omit<Feedback, 'id'>): Promise<void> {
    this.mutate((db) => {
      db.feedback.push({ ...f, id: shortId() });
    });
  }

  async requestBilling(r: Omit<BillingRequest, 'id' | 'status'>): Promise<void> {
    this.mutate((db) => {
      db.billing.push({ ...r, id: shortId(), status: 'open' });
    });
  }

  async adminListTeachers(): Promise<Teacher[]> {
    return Object.values(this.read().teachers).sort((a, b) => b.createdAt - a.createdAt);
  }

  async adminListEvents(sinceMs: number): Promise<AppEvent[]> {
    return this.read().events.filter((e) => e.at >= sinceMs);
  }

  async adminListBilling(): Promise<BillingRequest[]> {
    return this.read().billing.slice().sort((a, b) => b.at - a.at);
  }

  async adminListFeedback(): Promise<Feedback[]> {
    return this.read().feedback.slice().sort((a, b) => b.at - a.at);
  }

  async adminActivate(teacherId: string, period: 'monthly' | 'yearly', now: number = Date.now()): Promise<void> {
    this.mutate((db) => {
      const t = db.teachers[teacherId];
      if (!t) return;
      const base = t.plan === 'active' && t.planUntil && t.planUntil > now ? t.planUntil : now;
      db.teachers[teacherId] = {
        ...t,
        plan: 'active',
        activatedAt: now,
        planUntil: base + (period === 'yearly' ? 365 : 31) * DAY_MS,
      };
    });
  }

  async adminCloseBilling(id: string): Promise<void> {
    this.mutate((db) => {
      const r = db.billing.find((b) => b.id === id);
      if (r) r.status = 'done';
    });
  }

  /** Test helper. */
  reset(): void {
    this.storage.removeItem(KEY);
  }
}
