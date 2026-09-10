import { useState, type FormEvent } from 'react';

import { useAuth } from '@/auth/AuthProvider';
import { TopBar, useToast } from '@/components/ui';

export function Settings() {
  const { teacher, updateTeacher } = useAuth();
  const [name, setName] = useState(teacher?.name ?? '');
  const [studio, setStudio] = useState(teacher?.studio ?? '');
  const [toast, showToast] = useToast();

  async function save(e: FormEvent) {
    e.preventDefault();
    await updateTeacher({ name: name.trim(), studio: studio.trim() });
    showToast('Saved.');
  }

  return (
    <>
      <TopBar />
      <main className="wrap page" style={{ maxWidth: 520 }}>
        <p className="eyebrow">Settings</p>
        <h1 style={{ marginTop: 6 }}>You</h1>
        <form onSubmit={(e) => void save(e)} className="stack" style={{ marginTop: 20 }}>
          <div className="field">
            <label htmlFor="t-name">Your name, as parents see it</label>
            <input id="t-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms Chen" />
            <p className="hint">Appears on every slip: "From Ms Chen". New students pick it up; existing slips keep what they have.</p>
          </div>
          <div className="field">
            <label htmlFor="t-studio">Studio name (optional)</label>
            <input id="t-studio" className="input" value={studio} onChange={(e) => setStudio(e.target.value)} placeholder="Chen Piano Studio" />
          </div>
          <div>
            <button type="submit" className="btn primary">
              Save
            </button>
          </div>
        </form>
        <p className="small muted" style={{ marginTop: 32 }}>
          Signed in as {teacher?.email}. To delete your account and all students, email support from this address.
        </p>
      </main>
      {toast}
    </>
  );
}
