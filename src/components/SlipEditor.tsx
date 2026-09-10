import { emptyItem, MAX_ITEMS } from '@/lib/slip';
import type { Slip, SlipItem } from '@/lib/types';

type Props = {
  slip: Slip;
  onChange: (s: Slip) => void;
  onSave: () => void;
  onCancel: () => void;
};

const SUGGESTIONS = ['Scales', 'Sight-reading', 'Theory page', 'Warm-up', 'Listen to the recording'];

/** Writing a slip should take under a minute. Every control is one tap or one line. */
export function SlipEditor({ slip, onChange, onSave, onCancel }: Props) {
  function setItem(id: string, patch: Partial<SlipItem>) {
    onChange({ ...slip, items: slip.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }
  function removeItem(id: string) {
    const items = slip.items.filter((i) => i.id !== id);
    onChange({ ...slip, items: items.length ? items : [emptyItem()] });
  }
  function addItem(title = '') {
    if (slip.items.length >= MAX_ITEMS) return;
    onChange({ ...slip, items: [...slip.items, { ...emptyItem(), title }] });
  }
  function move(id: string, dir: -1 | 1) {
    const i = slip.items.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= slip.items.length) return;
    const items = slip.items.slice();
    const a = items[i];
    const b = items[j];
    if (!a || !b) return;
    items[i] = b;
    items[j] = a;
    onChange({ ...slip, items });
  }

  return (
    <form
      className="card stack"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}>
      <div className="row between">
        <h2>This week's slip</h2>
        <span className="small muted">Starts today, runs 7 days</span>
      </div>

      <div>
        {slip.items.map((item, idx) => (
          <div className="item-row" key={item.id}>
            <div className="fields">
              <input
                className="input serif"
                value={item.title}
                onChange={(e) => setItem(item.id, { title: e.target.value })}
                placeholder={idx === 0 ? 'Minuet in G' : 'What to practise'}
                aria-label={`Item ${idx + 1} title`}
                autoFocus={idx === slip.items.length - 1 && item.title === ''}
                maxLength={120}
              />
              <input
                className="input"
                value={item.instruction}
                onChange={(e) => setItem(item.id, { instruction: e.target.value })}
                placeholder="How: hands together, bars 1–8, slowly, three times"
                aria-label={`Item ${idx + 1} instruction`}
                maxLength={240}
              />
            </div>
            <div className="stack" style={{ gap: 2 }}>
              <button type="button" className="btn quiet" onClick={() => move(item.id, -1)} aria-label="Move up" disabled={idx === 0}>
                ↑
              </button>
              <button type="button" className="btn quiet" onClick={() => move(item.id, 1)} aria-label="Move down" disabled={idx === slip.items.length - 1}>
                ↓
              </button>
              <button type="button" className="btn quiet danger" onClick={() => removeItem(item.id)} aria-label="Remove item">
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
        <button type="button" className="btn" onClick={() => addItem()} disabled={slip.items.length >= MAX_ITEMS}>
          + Add item
        </button>
        {SUGGESTIONS.map((s) => (
          <button key={s} type="button" className="btn quiet small" onClick={() => addItem(s)} disabled={slip.items.length >= MAX_ITEMS}>
            + {s}
          </button>
        ))}
      </div>

      <div className="row between" style={{ flexWrap: 'wrap' }}>
        <label className="muted" htmlFor="target">
          Aim for
        </label>
        <div className="stepper" id="target">
          <button type="button" onClick={() => onChange({ ...slip, targetDays: Math.max(1, slip.targetDays - 1) })} aria-label="Fewer days">
            −
          </button>
          <span className="value">
            {slip.targetDays} day{slip.targetDays === 1 ? '' : 's'}
          </span>
          <button type="button" onClick={() => onChange({ ...slip, targetDays: Math.min(7, slip.targetDays + 1) })} aria-label="More days">
            +
          </button>
        </div>
      </div>

      <div className="field">
        <label htmlFor="note">Note to the parent (optional)</label>
        <textarea id="note" className="input" value={slip.note} onChange={(e) => onChange({ ...slip, note: e.target.value })} placeholder="Short and often beats one long session." maxLength={500} />
      </div>

      <div className="row">
        <button type="submit" className="btn primary">
          Save slip
        </button>
        <button type="button" className="btn quiet" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
