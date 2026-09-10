import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore/lite';

import { config } from '@/lib/config';

let app: FirebaseApp | null = null;

export function firebaseApp(): FirebaseApp {
  if (app) return app;
  app = getApps()[0] ?? initializeApp(config.firebase);
  return app;
}

/**
 * The lite SDK: REST calls, no realtime, a fraction of the size. We never
 * listen to documents, so it is all we need, and it keeps the parent's page
 * fast on a phone.
 */
export function firestore(): Firestore {
  return getFirestore(firebaseApp());
}

/** Auth is only needed on teacher pages, so it loads on demand. */
export async function authModule() {
  const mod = await import('firebase/auth');
  return { mod, auth: mod.getAuth(firebaseApp()) };
}
