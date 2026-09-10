import { config } from '@/lib/config';

import { FirestoreRepo } from './firestoreRepo';
import { LocalRepo } from './localRepo';
import type { Repo } from './repo';

let instance: Repo | null = null;

export function repo(): Repo {
  if (!instance) instance = config.useFirebase ? new FirestoreRepo() : new LocalRepo();
  return instance;
}

/** Tests swap the instance. */
export function setRepo(r: Repo | null): void {
  instance = r;
}
