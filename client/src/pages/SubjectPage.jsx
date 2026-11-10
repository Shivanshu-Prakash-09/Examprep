// Slide 5B: syllabus (unit-wise), previous-year papers, notes.
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import AddUnit from '../components/AddUnit';
import ResourceList from '../components/ResourceList';
import Spinner from '../components/Spinner';
import UnitCard from '../components/UnitCard';
import { useAuth } from '../context/AuthContext';

const TABS = [['syllabus', 'Syllabus'], ['paper', 'Previous year papers'], ['notes', 'Notes']];

export default function SubjectPage() {
  const { id } = useParams();
  const { role, tracksHistory } = useAuth();
  const navigate = useNavigate();
  const isTeacher = role === 'teacher';
  const [subject, setSubject] = useState(null);
  const [tab, setTab] = useState('syllabus');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSubject(id).then(setSubject).catch((e) => setError(e.message));
    if (tracksHistory) api.addHistory({ subjectId: id, action: 'view_subject' }).catch(() => {});
  }, [id, tracksHistory]);

  const removeSubject = async () => {
    const ok = window.confirm(
      `Delete "${subject.name}" (${subject.branch}, Semester ${subject.semester})?\n\nThis permanently removes the subject with all its papers, notes and likes. This cannot be undone.`
    );
    if (!ok) return;
    try {
      await api.deleteSubject(id);
      navigate(`/subjects?branch=${subject.branch}&year=${subject.year}&semester=${subject.semester}`, { replace: true });
    } catch (e) {
      setError(e.message);
    }
  };

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
        {isTeacher && <button className="btn btn-sm btn-danger meta-action" onClick={removeSubject}>Delete subject</button>}
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}</button>
        ))}
      </div>

      {tab === 'syllabus' && (
        <div>
          {Object.entries(subject.units).map(([unit, text], i) => (
            <UnitCard key={unit} index={i} subjectId={id} unit={unit} text={text} canEdit={isTeacher} onChanged={setSubject} />
          ))}
          {!Object.keys(subject.units).length && <div className="empty">The syllabus for this subject has not been added yet.</div>}
          {subject.note && <p className="muted">Note: {subject.note}</p>}
          {isTeacher && <AddUnit subjectId={id} existing={Object.keys(subject.units)} onChanged={setSubject} />}
        </div>
      )}
      {tab !== 'syllabus' && <ResourceList key={tab} subjectId={id} kind={tab} />}
    </div>
  );
}
