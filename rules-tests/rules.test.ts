import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;
const TOKEN = 'tokentokentokentokenAB';
const ADMIN = 'liamtw042@gmail.com';

const student = {
  teacherId: 't1',
  teacherName: 'Ms Chen',
  name: 'Ava',
  instrument: 'Piano',
  parentName: '',
  archived: false,
  createdAt: 1,
  updatedAt: 1,
  slip: { id: 's', startDate: '2026-09-07', items: [{ id: 'i', title: 'Minuet', instruction: '' }], targetDays: 5, note: '', writtenAt: 1 },
  log: {},
  parentNote: null,
};

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'practice-slip-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'students', TOKEN), student);
    await setDoc(doc(ctx.firestore(), 'teachers', 't1'), { email: 't1@x.test', name: 'Ms Chen', studio: '', createdAt: 1, trialEndsAt: 2, plan: 'trial', planUntil: null, activatedAt: null });
  });
});

describe('students', () => {
  it('owner can read, list and update; strangers cannot list or update', async () => {
    const owner = env.authenticatedContext('t1').firestore();
    const other = env.authenticatedContext('t2').firestore();
    await assertSucceeds(getDoc(doc(owner, 'students', TOKEN)));
    await assertSucceeds(updateDoc(doc(owner, 'students', TOKEN), { name: 'Ava B' }));
    await assertFails(updateDoc(doc(other, 'students', TOKEN), { name: 'Hacked' }));
    await assertFails(getDocs(collection(other, 'students')));
  });

  it('parent can get by token and tick days, nothing else', async () => {
    const parent = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(parent, 'students', TOKEN)));
    await assertFails(getDocs(collection(parent, 'students')));
    await assertSucceeds(updateDoc(doc(parent, 'students', TOKEN), { 'log.2026-09-08': true, updatedAt: 5 }));
    await assertSucceeds(updateDoc(doc(parent, 'students', TOKEN), { parentNote: { text: 'bar 6', at: 5 }, updatedAt: 6 }));
    await assertFails(updateDoc(doc(parent, 'students', TOKEN), { name: 'Nope' }));
    await assertFails(updateDoc(doc(parent, 'students', TOKEN), { 'slip.note': 'nope' }));
    await assertFails(updateDoc(doc(parent, 'students', TOKEN), { parentNote: { text: 'x'.repeat(501), at: 5 }, updatedAt: 7 }));
  });

  it('creating requires a long token and the caller as teacher', async () => {
    const owner = env.authenticatedContext('t1').firestore();
    await assertSucceeds(setDoc(doc(owner, 'students', 'anothertokenthatislong1'), { ...student, name: 'Ben' }));
    await assertFails(setDoc(doc(owner, 'students', 'short'), { ...student, name: 'Ben' }));
    await assertFails(setDoc(doc(owner, 'students', 'anothertokenthatislong2'), { ...student, teacherId: 't2' }));
  });
});

describe('teachers', () => {
  it('cannot change their own plan; admin can', async () => {
    const owner = env.authenticatedContext('t1').firestore();
    const admin = env.authenticatedContext('admin', { email: ADMIN }).firestore();
    await assertSucceeds(updateDoc(doc(owner, 'teachers', 't1'), { name: 'New' }));
    await assertFails(updateDoc(doc(owner, 'teachers', 't1'), { plan: 'active' }));
    await assertSucceeds(updateDoc(doc(admin, 'teachers', 't1'), { plan: 'active', planUntil: 99 }));
  });
});

describe('events and feedback', () => {
  it('accept allowed shapes only', async () => {
    const anon = env.unauthenticatedContext().firestore();
    await assertSucceeds(addDoc(collection(anon, 'events'), { teacherId: 't1', studentId: TOKEN, type: 'parent_opened', at: new Date() }));
    await assertFails(addDoc(collection(anon, 'events'), { teacherId: 't1', studentId: TOKEN, type: 'evil', at: new Date() }));
    await assertSucceeds(addDoc(collection(anon, 'feedback'), { teacherId: null, page: '/', text: 'hello', at: 1 }));
    await assertFails(addDoc(collection(anon, 'feedback'), { teacherId: null, page: '/', text: '', at: 1 }));
  });
});
