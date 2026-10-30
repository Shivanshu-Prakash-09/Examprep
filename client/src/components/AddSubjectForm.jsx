// Teacher can add subjects that were missing from the seed data, with unit-wise syllabus.
import { useState } from 'react';
import { api } from '../api';
import { BRANCHES, UNIT_KEYS, YEARS, semestersOfYear } from '../utils/constants';

const EMPTY = { branch: '', year: '', semester: '', name: '', credits: '', aliases: '', units: {} };

export default function AddSubjectForm() {
  const [form, setForm] = useState(EMPTY);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [unitCount, setUnitCount] = useState(4);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: '', text: '' });
    try {
      await api.createSubject({
        ...form,
        aliases: form.aliases.split(',').map((a) => a.trim()).filter(Boolean),
      });
      setMsg({ type: 'ok', text: `"${form.name}" added.` });
      setForm({ ...EMPTY, branch: form.branch, year: form.year, semester: form.semester });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Add a subject</h2>
      <label>Branch
        <select value={form.branch} onChange={(e) => set({ branch: e.target.value })} required>
          <option value="">Select branch</option>
          {BRANCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
      </label>
      <label>Year
        <select value={form.year} onChange={(e) => set({ year: e.target.value, semester: '' })} required>
          <option value="">Select year</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
      </label>
      <label>Semester
        <select value={form.semester} onChange={(e) => set({ semester: e.target.value })} required disabled={!form.year}>
          <option value="">Select semester</option>
          {form.year && semestersOfYear(Number(form.year)).map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </label>
      <label>Subject name
        <input value={form.name} onChange={(e) => set({ name: e.target.value })} required />
      </label>
      <label>Credits (optional)
        <input type="number" min="0" max="10" value={form.credits} onChange={(e) => set({ credits: e.target.value })} />
      </label>
      <label>Old / other names (optional, comma separated)
        <input value={form.aliases} onChange={(e) => set({ aliases: e.target.value })} placeholder="helps students searching by old name" />
      </label>

      {UNIT_KEYS.slice(0, unitCount).map((u) => (
        <label key={u}>Unit {u} syllabus
          <textarea rows="3" value={form.units[u] || ''} onChange={(e) => set({ units: { ...form.units, [u]: e.target.value } })} />
        </label>
      ))}
      {unitCount < UNIT_KEYS.length && (
        <button type="button" className="btn" onClick={() => setUnitCount((n) => n + 1)}>+ Add another unit</button>
      )}

      {msg.text && <p className={msg.type === 'error' ? 'error' : 'ok'}>{msg.text}</p>}
      <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Add subject'}</button>
    </form>
  );
}
