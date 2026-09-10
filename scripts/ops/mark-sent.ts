/**
 * After the routine has sent the emails in ops/data/sendlist.json, record
 * them so no template is ever sent twice.
 *
 *   npm run ops:mark-sent
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PlannedEmail } from '../../src/ops/onboarding.ts';
import type { SentLog } from '../../src/ops/types.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const dataDir = join(root, 'ops', 'data');
const listFile = join(dataDir, 'sendlist.json');
const sentFile = join(dataDir, 'sent.json');

const list: PlannedEmail[] = existsSync(listFile) ? (JSON.parse(readFileSync(listFile, 'utf8')) as PlannedEmail[]) : [];
const sent: SentLog = existsSync(sentFile) ? (JSON.parse(readFileSync(sentFile, 'utf8')) as SentLog) : {};

for (const e of list) {
  const arr = sent[e.teacherId] ?? [];
  if (!arr.includes(e.template)) arr.push(e.template);
  sent[e.teacherId] = arr;
}
writeFileSync(sentFile, JSON.stringify(sent, null, 2));
writeFileSync(listFile, '[]');
console.log(`Marked ${list.length} email${list.length === 1 ? '' : 's'} as sent.`);
