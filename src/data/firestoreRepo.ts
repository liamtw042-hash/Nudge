import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore/lite';

import type { AppEvent, BillingRequest, EventType, Feedback, Slip, Student, Teacher } from '@/lib/types';

import { firestore } from './firebase';
import type { Repo } from './repo';

const DAY_MS = 24 * 60 * 60 * 1000;

function ms(v: unknown): number {
  if (v instanceof Timestamp) return v.toMillis();
  if (typeof v === 'number') return v;
  return 0;
}

function toTeacher(id: string, d: DocumentData): Teacher {
  return {
    id,
    email: String(d.email ?? ''),
    name: String(d.name ?? ''),
    studio: String(d.studio ?? ''),
    createdAt: ms(d.createdAt),
    trialEndsAt: ms(d.trialEndsAt),
    plan: (d.plan as Teacher['plan']) ?? 'trial',
    planUntil: d.planUntil == null ? null : ms(d.planUntil),
    activatedAt: d.activatedAt == null ? null : ms(d.activatedAt),
  };
}

function toStudent(id: string, d: DocumentData): Student {
  return {
    id,
    teacherId: String(d.teacherId ?? ''),
    teacherName: String(d.teacherName ?? ''),
    name: String(d.name ?? ''),
    instrument: String(d.instrument ?? ''),
    parentName: String(d.parentName ?? ''),
    archived: Boolean(d.archived),
    createdAt: ms(d.createdAt),
    updatedAt: ms(d.updatedAt),
    slip: (d.slip as Slip | null) ?? null,
    log: (d.log as Record<string, true>) ?? {},
    parentNote: (d.parentNote as Student['parentNote']) ?? null,
  };
}

/** Production repo. Mirrors LocalRepo; the security rules do the enforcement. */
export class FirestoreRepo implements Repo {
  private get db() {
    return firestore();
  }

  async getTeacher(id: string): Promise<Teacher | null> {
    const snap = await getDoc(doc(this.db, 'teachers', id));
    return snap.exists() ? toTeacher(snap.id, snap.data()) : null;
  }

  async createTeacher(t: Teacher): Promise<void> {
    const { id, ...rest } = t;
    await setDoc(doc(this.db, 'teachers', id), rest);
  }

  async updateTeacher(id: string, patch: Partial<Pick<Teacher, 'name' | 'studio'>>): Promise<void> {
    await updateDoc(doc(this.db, 'teachers', id), patch);
  }

  async listStudents(teacherId: string): Promise<Student[]> {
    const q = query(collection(this.db, 'students'), where('teacherId', '==', teacherId), orderBy('createdAt', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toStudent(d.id, d.data()));
  }

  async createStudent(s: Student): Promise<void> {
    const { id, ...rest } = s;
    await setDoc(doc(this.db, 'students', id), rest);
  }

  async updateStudent(id: string, patch: Partial<Student>): Promise<void> {
    const rest: Record<string, unknown> = { ...patch, updatedAt: Date.now() };
    delete rest.id; // the id is the document path, never a field
    await updateDoc(doc(this.db, 'students', id), rest);
  }

  async deleteStudent(id: string): Promise<void> {
    await deleteDoc(doc(this.db, 'students', id));
  }

  async writeSlip(studentId: string, slip: Slip, previous: Slip | null): Promise<void> {
    if (previous) {
      await setDoc(doc(this.db, 'students', studentId, 'slips', previous.id), { ...previous, archivedAt: Date.now() });
    }
    await updateDoc(doc(this.db, 'students', studentId), { slip, parentNote: null, updatedAt: Date.now() });
  }

  async listSlipHistory(studentId: string): Promise<Slip[]> {
    const q = query(collection(this.db, 'students', studentId, 'slips'), orderBy('writtenAt', 'desc'), limit(52));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Slip);
  }

  async getStudentPublic(token: string): Promise<Student | null> {
    const snap = await getDoc(doc(this.db, 'students', token));
    return snap.exists() ? toStudent(snap.id, snap.data()) : null;
  }

  async setDay(token: string, iso: string, ticked: boolean): Promise<void> {
    await updateDoc(doc(this.db, 'students', token), {
      [`log.${iso}`]: ticked ? true : deleteField(),
      updatedAt: Date.now(),
    });
  }

  async setParentNote(token: string, text: string): Promise<void> {
    const clean = text.trim().slice(0, 500);
    await updateDoc(doc(this.db, 'students', token), {
      parentNote: clean ? { text: clean, at: Date.now() } : null,
      updatedAt: Date.now(),
    });
  }

  async logEvent(teacherId: string, studentId: string | null, type: EventType): Promise<void> {
    await addDoc(collection(this.db, 'events'), { teacherId, studentId, type, at: serverTimestamp() });
  }

  async addFeedback(f: Omit<Feedback, 'id'>): Promise<void> {
    await addDoc(collection(this.db, 'feedback'), f);
  }

  async requestBilling(r: Omit<BillingRequest, 'id' | 'status'>): Promise<void> {
    await addDoc(collection(this.db, 'billingRequests'), { ...r, status: 'open' });
  }

  async adminListTeachers(): Promise<Teacher[]> {
    const snap = await getDocs(query(collection(this.db, 'teachers'), orderBy('createdAt', 'desc')));
    return snap.docs.map((d) => toTeacher(d.id, d.data()));
  }

  async adminListEvents(sinceMs: number): Promise<AppEvent[]> {
    const snap = await getDocs(query(collection(this.db, 'events'), where('at', '>=', Timestamp.fromMillis(sinceMs))));
    return snap.docs.map((d) => {
      const x = d.data();
      return { id: d.id, teacherId: String(x.teacherId), studentId: (x.studentId as string | null) ?? null, type: x.type as EventType, at: ms(x.at) };
    });
  }

  async adminListBilling(): Promise<BillingRequest[]> {
    const snap = await getDocs(query(collection(this.db, 'billingRequests'), orderBy('at', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BillingRequest, 'id'>) }));
  }

  async adminListFeedback(): Promise<Feedback[]> {
    const snap = await getDocs(query(collection(this.db, 'feedback'), orderBy('at', 'desc'), limit(500)));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Feedback, 'id'>) }));
  }

  async adminActivate(teacherId: string, period: 'monthly' | 'yearly', now: number = Date.now()): Promise<void> {
    const t = await this.getTeacher(teacherId);
    if (!t) return;
    const base = t.plan === 'active' && t.planUntil && t.planUntil > now ? t.planUntil : now;
    await updateDoc(doc(this.db, 'teachers', teacherId), {
      plan: 'active',
      activatedAt: now,
      planUntil: base + (period === 'yearly' ? 365 : 31) * DAY_MS,
    });
  }

  async adminCloseBilling(id: string): Promise<void> {
    await updateDoc(doc(this.db, 'billingRequests', id), { status: 'done' });
  }
}
