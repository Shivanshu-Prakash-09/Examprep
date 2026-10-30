// Slide 5B: syllabus (unit-wise), previous-year papers, notes.
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import ResourceList from '../components/ResourceList';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

const TABS = [['syllabus', 'Syllabus'], ['paper', 'Previous year papers'], ['notes', 'Notes']];

export default function SubjectPage() {
  const { id } = useParams();
  const { tracksHistory } = useAuth();
  const [subject, setSubject] = useState(null);
  const [tab, setTab] = useState('syllabus');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSubject(id).then(setSubject).catch((e) => setError(e.message));
    if (tracksHistory) api.addHistory({ subjectId: id, action: 'view_subject' }).catch(() => {});
  }, [id, tracksHistory]);

  if (error) return <p className="error">{error}</p>;
  if (!subject) return <Spinner />;

  return (
    <div>
      <Link to={`/subjects?branch=${subject.branch}&year=${subject.year}&semester=${subject.semester}`} className="back-link">← Back to subjects</Link>
      <h2>{subject.name}</h2>
      <div className="meta">
        <span className="tag">{subject.branch}</span>
        <span>Year {subject.year}</span><span>Semester {subject.semester}</span>
        {subject.credits ? <span>{subject.credits} credits</span> : null}
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'syllabus' && (
        <div>
          {Object.entries(subject.units).map(([unit, text], i) => (
            <div className="card unit" key={unit} style={{ animationDelay: `${i * 70}ms` }}><strong>Unit {unit}</strong><p>{text}</p></div>
          ))}
          {subject.note && <p className="muted">Note: {subject.note}</p>}
        </div>
      )}
      {tab !== 'syllabus' && <ResourceList key={tab} subjectId={id} kind={tab} subject={subject} />}
    </div>
  );
}
