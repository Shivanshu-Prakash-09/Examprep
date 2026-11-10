// One syllabus unit. Teachers also get Edit and Delete on it.
import { useState } from 'react';
import { api } from '../api';

export default function UnitCard({ subjectId, unit, text, canEdit, onChanged, index = 0 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      onChanged(await api.saveUnit(subjectId, unit, draft));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Delete Unit ${unit}? Its syllabus text will be removed.`)) return;
    try {
      onChanged(await api.deleteUnit(subjectId, unit));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`card unit ${editing ? 'is-editing' : ''}`} style={{ animationDelay: `${index * 70}ms` }}>
      <div className="unit-head">
        <strong>Unit {unit}</strong>
        {canEdit && !editing && (
          <span className="unit-actions">
            <button className="btn btn-sm" onClick={() => { setDraft(text); setEditing(true); }}>Edit</button>
            <button className="btn btn-sm btn-danger" onClick={remove}>Delete</button>
          </span>
        )}
      </div>
      {editing ? (
        <form className="form" onSubmit={save}>
          <textarea rows="6" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus required />
          {error && <p className="error" role="alert">{error}</p>}
          <div className="row-end">
            <button type="button" className="btn btn-sm" onClick={() => { setEditing(false); setError(''); }}>Cancel</button>
            <button className="btn btn-sm btn-primary" disabled={busy || !draft.trim()}>{busy ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      ) : (
        <>
          <p>{text}</p>
          {error && <p className="error" role="alert">{error}</p>}
        </>
      )}
    </div>
  );
}
