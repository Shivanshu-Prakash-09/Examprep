// Papers (with sorting, likes, download, Ask with AI) or Notes for one subject.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import { botLinkForPaper } from '../utils/constants';

export default function ResourceList({ subjectId, kind }) {
  const { role, canLike, tracksHistory } = useAuth();
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState('likes');
  const [examType, setExamType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);   // which row a teacher is editing
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await api.listResources(subjectId, { kind, sort, examType }));
      setError('');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subjectId, kind, sort, examType]);

  useEffect(() => { load(); }, [load]);

  const track = (item, action) => {
    if (tracksHistory) api.addHistory({ subjectId, resourceId: item.id, action }).catch(() => {});
  };

  const like = async (item) => {
    try {
      const { liked, likes } = await api.toggleLike(item.id);
      setItems((list) => list.map((r) => (r.id === item.id ? { ...r, liked_by_me: liked, likes } : r)));
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? The file and its likes will be removed.`)) return;
    try {
      await api.deleteResource(item.id);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const startEdit = (item) => {
    setError('');
    setEditId(item.id);
    setDraft({ title: item.title, examType: item.exam_type || '', paperYear: item.paper_year ?? '' });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const updated = await api.updateResource(editId, draft);
      setItems((list) => list.map((r) => (r.id === editId ? updated : r)));
      setEditId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {kind === 'paper' && (
        <div className="toolbar">
          <label>Sort by
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="likes">Most liked</option>
              <option value="year">Year</option>
              <option value="newest">Newest upload</option>
            </select>
          </label>
          <label>Type
            <select value={examType} onChange={(e) => setExamType(e.target.value)}>
              <option value="">All</option>
              <option value="mid">Mid-term</option>
              <option value="end">End-term</option>
            </select>
          </label>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {loading && <Spinner />}
      {!loading && !items.length && (
        <div className="empty">Nothing uploaded here yet.</div>
      )}

      {items.map((item, i) => (editId === item.id ? (
        <form className="card resource-edit form" key={item.id} onSubmit={saveEdit}>
          <label>Name
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required autoFocus />
          </label>
          {kind === 'paper' && (
            <div className="edit-row">
              <label>Type
                <select value={draft.examType} onChange={(e) => setDraft({ ...draft, examType: e.target.value })}>
                  <option value="">Not known</option>
                  <option value="mid">Mid-term</option>
                  <option value="end">End-term</option>
                </select>
              </label>
              <label>Year
                <input type="number" min="2000" max="2100" placeholder="2024" value={draft.paperYear} onChange={(e) => setDraft({ ...draft, paperYear: e.target.value })} />
              </label>
            </div>
          )}
          <div className="row-end">
            <button type="button" className="btn btn-sm" onClick={() => setEditId(null)}>Cancel</button>
            <button className="btn btn-sm btn-primary" disabled={saving || !draft.title.trim()}>{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      ) : (
        <div className="card resource" key={item.id} style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
          <div className="resource-title">
            <div className="file-icon">{kind === 'paper' ? 'PYQ' : 'NTS'}</div>
            <div>
              <strong>{item.title}</strong>
              <div className="meta">
                {kind === 'paper' ? (
                  <>
                    {item.exam_type && <span className={`tag tag-${item.exam_type}`}>{item.exam_type === 'mid' ? 'Mid-term' : 'End-term'}</span>}
                    <span>{item.paper_year ?? 'Year unspecified'}</span>
                  </>
                ) : (
                  <span>Notes</span>
                )}
              </div>
            </div>
          </div>
          <div className="resource-actions">
            {kind === 'paper' && (
              <button
                className={`btn btn-like ${item.liked_by_me ? 'liked' : ''}`}
                disabled={!canLike}
                title={canLike ? 'Like this paper' : 'Login with Gmail to like'}
                onClick={() => like(item)}
              >
                <span className="heart">{item.liked_by_me ? '♥' : '♡'}</span> {item.likes}
              </button>
            )}
            <a className="btn" href={item.download_url} onClick={() => track(item, 'open_paper')}>Download</a>
            {kind === 'paper' && (
              <a
                className="btn btn-primary"
                href={botLinkForPaper(item.file_url)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track(item, 'ask_ai')}
              >
                Ask with AI ↗
              </a>
            )}
            {role === 'teacher' && (
              <>
                <button className="btn" onClick={() => startEdit(item)}>Edit</button>
                <button className="btn btn-danger" onClick={() => remove(item)}>Delete</button>
              </>
            )}
          </div>
        </div>
      )))}
      {!canLike && kind === 'paper' && role !== 'teacher' && (
        <p className="muted">Guests can't like papers. Log in with Gmail to like and to save your history.</p>
      )}
    </div>
  );
}
