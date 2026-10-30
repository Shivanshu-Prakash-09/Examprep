// Slide 4B: all subjects for the chosen branch / year / semester.
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/Spinner';
import SubjectCard from '../components/SubjectCard';

export default function SubjectListPage() {
  const [params] = useSearchParams();
  const [subjects, setSubjects] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listSubjects(Object.fromEntries(params)).then(setSubjects).catch((e) => setError(e.message));
  }, [params]);

  return (
    <div>
      <Link to="/browse" className="back-link">← Back</Link>
      <h2>{params.get('branch')} · Year {params.get('year')} · Semester {params.get('semester')}</h2>
      {subjects && <p className="muted">{subjects.length} subjects</p>}
      {error && <p className="error">{error}</p>}
      {!subjects && !error && <Spinner />}
      {subjects && !subjects.length && (
        <div className="empty">No subjects found. Try the search options on the previous page.</div>
      )}
      <div className="subject-grid">
        {subjects?.map((s, i) => <SubjectCard key={s.id} subject={s} index={i} />)}
      </div>
    </div>
  );
}
