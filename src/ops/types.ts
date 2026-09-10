import type { AppEvent, BillingRequest, Feedback, Teacher } from '../lib/types.ts';

/** What the ops scripts work from: a point-in-time pull of production. */
export type Snapshot = {
  takenAt: number;
  siteUp: boolean | null;
  teachers: Teacher[];
  events: AppEvent[];
  feedback: Feedback[];
  billing: BillingRequest[];
  /** Per student: enough to know whether slips are flowing. */
  students: { id: string; teacherId: string; createdAt: number; hasSlip: boolean; slipWrittenAt: number | null; ticks: number }[];
};

export type SentLog = Record<string, string[]>; // teacherId -> template keys already sent

export type Alert = { level: 'error' | 'warn' | 'info'; message: string };
