// Gmail students only: recently studied subjects.
import { useEffect, useState } from 'react';
import { api } from '../api';
import Spinner from '../components/Spinner';
import SubjectCard from '../components/SubjectCard';

export default function HistoryPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.listHistory().then(setItems).catch((e) => setError(e.message)); }, []);

  return (
    <div>
      <h2>Continue learning</h2>
      <p className="muted">Subjects you opened recently.</p>
      {error && <p className="error">{error}</p>}
      {!items && !error && <Spinner />}
      {items && !items.length && <div className="empty">Nothing yet. Open a subject to start.</div>}
      <div className="subject-grid">
        {items?.map((s, i) => <SubjectCard key={s.id} subject={s} index={i} />)}
      </div>
    </div>
  );
}
