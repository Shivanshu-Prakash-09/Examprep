import { Link } from 'react-router-dom';

export default function SubjectCard({ subject, index = 0 }) {
  return (
    <Link to={`/subjects/${subject.id}`} className="card subject-card" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
      <div className="card-top">
        <span className="tag">{subject.branch}</span>
        <span className="card-no">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <strong>{subject.name}</strong>
      <div className="meta">
        <span>Year {subject.year}</span><span>Sem {subject.semester}</span>
        {subject.credits ? <span>{subject.credits} cr</span> : null}
      </div>
      {subject.score != null && (
        <div className="match">
          <div className="match-bar"><span style={{ width: `${Math.min(100, Math.round(subject.score * 100))}%` }} /></div>
          <span>{Math.round(subject.score * 100)}% match</span>
        </div>
      )}
    </Link>
  );
}
