/**
 * Pulls a point-in-time snapshot of production into ops/data/snapshot.json.
 *
 * Needs GOOGLE_APPLICATION_CREDENTIALS pointing at a Firebase service-account
 * key (HUMAN.md step 2). Without it, prints a note and leaves the previous
 * snapshot in place so the weekly report can still run.
 *
 *   npm run ops:snapshot
 */
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Snapshot } from '../../src/ops/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dataDir = join(root, 'ops', 'data');
const file = join(dataDir, 'snapshot.json');
const prevFile = join(dataDir, 'snapshot.previous.json');

async function siteUp(): Promise<boolean | null> {
  const url = process.env.VITE_PUBLIC_URL ?? readEnv('VITE_PUBLIC_URL');
  if (!url) return null;
  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    return res.ok;
  } catch {
    return false;
  }
}

function readEnv(key: string): string | null {
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return null;
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : null;
}

function ms(v: unknown): number {
  if (v && typeof v === 'object' && 'toMillis' in v && typeof (v as { toMillis: unknown }).toMillis === 'function') return (v as { toMillis: () => number }).toMillis();
  return typeof v === 'number' ? v : 0;
}

async function pull(): Promise<Snapshot> {
  const admin = await import('firebase-admin/app');
  const { getFirestore } = await import('firebase-admin/firestore');
  const app = admin.getApps()[0] ?? admin.initializeApp({ credential: admin.applicationDefault() });
  const db = getFirestore(app);
  const now = Date.now();
  const since = now - 120 * 24 * 60 * 60 * 1000;

  const [teachers, events, feedback, billing, students] = await Promise.all([
    db.collection('teachers').get(),
    db.collection('events').where('at', '>=', new Date(since)).get(),
    db.collection('feedback').get(),
    db.collection('billingRequests').get(),
    db.collection('students').get(),
  ]);

  return {
    takenAt: now,
    siteUp: await siteUp(),
    teachers: teachers.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id,
        email: String(x.email ?? ''),
        name: String(x.name ?? ''),
        studio: String(x.studio ?? ''),
        createdAt: ms(x.createdAt),
        trialEndsAt: ms(x.trialEndsAt),
        plan: (x.plan as 'trial' | 'active' | 'lapsed') ?? 'trial',
        planUntil: x.planUntil == null ? null : ms(x.planUntil),
        activatedAt: x.activatedAt == null ? null : ms(x.activatedAt),
      };
    }),
    events: events.docs.map((d) => {
      const x = d.data();
      return { id: d.id, teacherId: String(x.teacherId ?? ''), studentId: (x.studentId as string | null) ?? null, type: x.type, at: ms(x.at) };
    }),
    feedback: feedback.docs.map((d) => {
      const x = d.data();
      return { id: d.id, teacherId: (x.teacherId as string | null) ?? null, page: String(x.page ?? ''), text: String(x.text ?? ''), at: ms(x.at) };
    }),
    billing: billing.docs.map((d) => {
      const x = d.data();
      return { id: d.id, teacherId: String(x.teacherId ?? ''), email: String(x.email ?? ''), name: String(x.name ?? ''), period: x.period === 'yearly' ? 'yearly' : 'monthly', at: ms(x.at), status: x.status === 'done' ? 'done' : 'open' };
    }),
    students: students.docs.map((d) => {
      const x = d.data();
      const slip = x.slip as { writtenAt?: number } | null | undefined;
      return {
        id: d.id,
        teacherId: String(x.teacherId ?? ''),
        createdAt: ms(x.createdAt),
        hasSlip: !!slip,
        slipWrittenAt: slip?.writtenAt ?? null,
        ticks: Object.keys((x.log as Record<string, unknown>) ?? {}).length,
      };
    }),
  };
}

async function main() {
  mkdirSync(dataDir, { recursive: true });
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('GOOGLE_APPLICATION_CREDENTIALS not set; keeping the previous snapshot. See HUMAN.md step 2.');
    return;
  }
  const snap = await pull();
  if (existsSync(file)) renameSync(file, prevFile);
  writeFileSync(file, JSON.stringify(snap, null, 2));
  console.log(`Snapshot: ${snap.teachers.length} teachers, ${snap.students.length} students, ${snap.events.length} events, site ${snap.siteUp === null ? 'unknown' : snap.siteUp ? 'up' : 'DOWN'}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
