import type { AppEvent, BillingRequest, EventType, Feedback, Slip, Student, Teacher } from '@/lib/types';

/**
 * Everything the UI needs from storage. Two implementations: localStorage for
 * local mode and tests, Firestore for production. Keep this small.
 */
export interface Repo {
  // Teachers
  getTeacher(id: string): Promise<Teacher | null>;
  createTeacher(t: Teacher): Promise<void>;
  updateTeacher(id: string, patch: Partial<Pick<Teacher, 'name' | 'studio'>>): Promise<void>;

  // Students (teacher side)
  listStudents(teacherId: string): Promise<Student[]>;
  createStudent(s: Student): Promise<void>;
  updateStudent(id: string, patch: Partial<Student>): Promise<void>;
  deleteStudent(id: string): Promise<void>;
  /** Replace the current slip, archiving the previous one into history. */
  writeSlip(studentId: string, slip: Slip, previous: Slip | null): Promise<void>;
  listSlipHistory(studentId: string): Promise<Slip[]>;

  // Parent side (no auth)
  getStudentPublic(token: string): Promise<Student | null>;
  setDay(token: string, iso: string, ticked: boolean): Promise<void>;
  setParentNote(token: string, text: string): Promise<void>;

  // Analytics and support
  logEvent(teacherId: string, studentId: string | null, type: EventType): Promise<void>;
  addFeedback(f: Omit<Feedback, 'id'>): Promise<void>;
  requestBilling(r: Omit<BillingRequest, 'id' | 'status'>): Promise<void>;

  // Admin
  adminListTeachers(): Promise<Teacher[]>;
  adminListEvents(sinceMs: number): Promise<AppEvent[]>;
  adminListBilling(): Promise<BillingRequest[]>;
  adminListFeedback(): Promise<Feedback[]>;
  adminActivate(teacherId: string, period: 'monthly' | 'yearly', now?: number): Promise<void>;
  adminCloseBilling(id: string): Promise<void>;
}
