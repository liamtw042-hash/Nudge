export type Plan = 'trial' | 'active' | 'lapsed';

export type Teacher = {
  id: string;
  email: string;
  name: string;
  studio: string;
  createdAt: number;
  trialEndsAt: number;
  plan: Plan;
  /** Epoch ms the paid period ends, when plan is 'active'. */
  planUntil: number | null;
  activatedAt: number | null;
};

export type SlipItem = {
  id: string;
  title: string;
  instruction: string;
};

export type Slip = {
  id: string;
  /** ISO date (YYYY-MM-DD) of the day the slip was written; the practice week starts here. */
  startDate: string;
  items: SlipItem[];
  targetDays: number;
  note: string;
  writtenAt: number;
};

export type ParentNote = { text: string; at: number } | null;

export type Student = {
  /** Also the parent's link token. Unguessable. */
  id: string;
  teacherId: string;
  teacherName: string;
  name: string;
  instrument: string;
  parentName: string;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
  slip: Slip | null;
  /** ISO date -> true for each day practice was ticked. */
  log: Record<string, true>;
  parentNote: ParentNote;
};

export type EventType =
  | 'signup'
  | 'student_created'
  | 'slip_written'
  | 'slip_shared'
  | 'parent_opened'
  | 'day_ticked'
  | 'parent_note';

export type AppEvent = {
  id: string;
  teacherId: string;
  studentId: string | null;
  type: EventType;
  at: number;
};

export type Feedback = {
  id: string;
  teacherId: string | null;
  page: string;
  text: string;
  at: number;
};

export type BillingRequest = {
  id: string;
  teacherId: string;
  email: string;
  name: string;
  period: 'monthly' | 'yearly';
  at: number;
  status: 'open' | 'done';
};
