// Teacher: add a new unit to an existing subject.
import { useState } from 'react';
import { api } from '../api';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export default function AddUnit({ subjectId, existing, onChanged }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const suggestion = ROMAN.find((r) => !existing.includes(r)) || '';
  const unitName = name.trim() || suggestion;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      onChanged(await api.saveUnit(subjectId, unitName, text));
      setOpen(false); setName(''); setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return <button className="btn" onClick={() => setOpen(true)}>+ Add a unit</button>;
  return (
    <form className="card form" onSubmit={submit}>
      <h3>Add a unit</h3>
      <label>Unit name
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={suggestion} maxLength={12} />
      </label>
      {existing.includes(unitName) && <p className="muted">Unit {unitName} already exists. Saving will replace its text.</p>}
      <label>Syllabus
        <textarea rows="5" value={text} onChange={(e) => setText(e.target.value)} required />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row-end">
        <button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button>
        <button className="btn btn-sm btn-primary" disabled={busy || !text.trim()}>{busy ? 'Saving...' : 'Add unit'}</button>
      </div>
    </form>
  );
}
