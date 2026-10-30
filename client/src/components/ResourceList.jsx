// Papers (with sorting, likes, download, Ask with AI) or Notes for one subject.
import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';
import { botLinkForPaper } from '../utils/constants';

export default function ResourceList({ subjectId, kind, subject }) {
  const { role, canLike, tracksHistory } = useAuth();
  const [items, setItems] = useState([]);
  const [sort, setSort] = useState('likes');
  const [examType, setExamType] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

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
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    await api.deleteResource(item.id);
    load();
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

      {items.map((item, i) => (
        <div className="card resource" key={item.id} style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}>
          <div className="resource-title">
            <div className="file-icon">{kind === 'paper' ? 'PYQ' : 'NTS'}</div>
            <div>
              <strong>{item.title}</strong>
              <div className="meta">
                {kind === 'paper' ? (
                  <>
                    <span className={`tag tag-${item.exam_type}`}>{item.exam_type === 'mid' ? 'Mid-term' : 'End-term'}</span>
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
                href={botLinkForPaper(item, subject)}
                target="_blank"
                rel="noreferrer"
                onClick={() => track(item, 'ask_ai')}
              >
                Ask with AI ↗
              </a>
            )}
            {role === 'teacher' && <button className="btn btn-danger" onClick={() => remove(item)}>Delete</button>}
          </div>
        </div>
      ))}
      {!canLike && kind === 'paper' && role !== 'teacher' && (
        <p className="muted">Guests can't like papers. Log in with Gmail to like and to save your history.</p>
      )}
    </div>
  );
}
