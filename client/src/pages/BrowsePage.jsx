// Slide 3B: three ways to find a subject.
//  1) pick branch/year/semester   2) search by old name   3) paste syllabus -> top 5
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import Spinner from '../components/Spinner';
import SubjectCard from '../components/SubjectCard';
import { BRANCHES, YEARS, semestersOfYear } from '../utils/constants';

export default function BrowsePage() {
  const navigate = useNavigate();
  const [sel, setSel] = useState({ branch: '', year: '', semester: '' });
  const [tab, setTab] = useState('name');
  const [query, setQuery] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const showSubjects = (e) => {
    e.preventDefault();
    navigate(`/subjects?${new URLSearchParams(sel)}`);
  };

  const run = async (fn) => {
    setBusy(true); setError(''); setResults(null);
    try { setResults(await fn()); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid-2">
      <form className="card form" onSubmit={showSubjects}>
        <h2>Select your semester</h2>
        <label>Branch
          <select value={sel.branch} onChange={(e) => setSel({ ...sel, branch: e.target.value })} required>
            <option value="">Select branch</option>
            {BRANCHES.map((b) => <option key={b}>{b}</option>)}
          </select>
        </label>
        <label>Year
          <select value={sel.year} onChange={(e) => setSel({ ...sel, year: e.target.value, semester: '' })} required>
            <option value="">Select year</option>
            {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
          </select>
        </label>
        <label>Semester
          <select value={sel.semester} onChange={(e) => setSel({ ...sel, semester: e.target.value })} required disabled={!sel.year}>
            <option value="">Select semester</option>
            {sel.year && semestersOfYear(Number(sel.year)).map((s) => <option key={s} value={s}>Semester {s}</option>)}
          </select>
        </label>
        <button className="btn btn-primary">Show subjects</button>
      </form>

      <div className="card form">
        <h2>Can't find your subject?</h2>
        <p className="muted">If the scheme changed or the subject was renamed:</p>
        <div className="tabs">
          <button className={tab === 'name' ? 'active' : ''} onClick={() => { setTab('name'); setResults(null); }}>Search by old name</button>
          <button className={tab === 'syllabus' ? 'active' : ''} onClick={() => { setTab('syllabus'); setResults(null); }}>Paste syllabus</button>
        </div>

        {tab === 'name' ? (
          <>
            <input placeholder="Subject name (old or new)" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="btn btn-primary" disabled={!query.trim() || busy}
              onClick={() => run(() => api.searchSubjects(query, sel.branch))}>Search</button>
          </>
        ) : (
          <>
            <textarea rows="6" placeholder="Paste the subject's syllabus here..." value={syllabus} onChange={(e) => setSyllabus(e.target.value)} />
            <button className="btn btn-primary" disabled={syllabus.trim().length < 20 || busy}
              onClick={() => run(() => api.matchSyllabus(syllabus, sel.branch, sel.semester))}>Find top 5 matches</button>
            <p className="muted">Tip: choosing a branch/semester on the left narrows the matches.</p>
          </>
        )}

        {error && <p className="error">{error}</p>}
        {busy && <Spinner />}
        {results && (results.length
          ? results.map((s, i) => <SubjectCard key={s.id} subject={s} index={i} />)
          : <div className="empty">No match found.</div>)}
      </div>
    </div>
  );
}
