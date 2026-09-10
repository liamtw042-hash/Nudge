import type { Feedback } from '../lib/types.ts';

export type Cluster = { key: string; label: string; count: number; samples: string[] };

const BUCKETS: { key: string; label: string; words: string[] }[] = [
  { key: 'sending', label: 'Sending the slip to parents', words: ['send', 'share', 'whatsapp', 'message', 'sms', 'text', 'copy link', 'email the'] },
  { key: 'parent', label: 'Parent page and ticking', words: ['parent', 'tick', 'circle', 'link', 'open', 'bookmark', 'mum', 'dad'] },
  { key: 'editor', label: 'Writing slips', words: ['slip', 'write', 'item', 'template', 'copy last', 'reorder', 'attach', 'video', 'audio', 'recording', 'pdf'] },
  { key: 'students', label: 'Students and groups', words: ['student', 'sibling', 'group', 'class', 'archive', 'family'] },
  { key: 'print', label: 'Printing', words: ['print', 'paper', 'pdf'] },
  { key: 'billing', label: 'Price and paying', words: ['price', 'pay', 'invoice', 'card', 'subscription', 'cost', 'expensive', 'cheap', 'trial'] },
  { key: 'mobile', label: 'Phone and layout', words: ['phone', 'mobile', 'iphone', 'android', 'screen', 'small', 'layout', 'font'] },
  { key: 'auth', label: 'Signing in', words: ['sign in', 'login', 'log in', 'password', 'email link', 'google'] },
  { key: 'praise', label: 'Positive', words: ['love', 'great', 'thank', 'brilliant', 'perfect', 'easy'] },
];

/** Keyword clustering. Crude on purpose: it needs to be readable, not clever. */
export function clusterFeedback(items: Pick<Feedback, 'text'>[]): Cluster[] {
  const clusters = new Map<string, Cluster>();
  const other: Cluster = { key: 'other', label: 'Other', count: 0, samples: [] };
  for (const item of items) {
    const text = item.text.toLowerCase();
    const bucket = BUCKETS.find((b) => b.words.some((w) => text.includes(w)));
    const c = bucket ? (clusters.get(bucket.key) ?? { key: bucket.key, label: bucket.label, count: 0, samples: [] }) : other;
    c.count++;
    if (c.samples.length < 3) c.samples.push(item.text.trim().slice(0, 160));
    if (bucket) clusters.set(bucket.key, c);
  }
  const list = [...clusters.values()].sort((a, b) => b.count - a.count);
  if (other.count > 0) list.push(other);
  return list;
}

export function backlogMarkdown(clusters: Cluster[]): string {
  if (clusters.length === 0) return '_No feedback yet._';
  return clusters
    .map((c) => `- **${c.label}** (${c.count})${c.samples.map((s) => `\n  - "${s.replace(/"/g, "'")}"`).join('')}`)
    .join('\n');
}
