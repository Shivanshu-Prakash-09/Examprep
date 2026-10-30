// Slide -1: one login page. Teachers/faculty use the shared credentials; students click "Student access".
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Marquee from '../components/Marquee';
import Stat from '../components/Stat';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { role, loginTeacher } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (role) return <Navigate to={role === 'teacher' ? '/admin' : '/browse'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await loginTeacher(username, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="auth-layout">
        <section className="hero">
          <p className="eyebrow">Previous year papers · Notes · Syllabus</p>
          <h1>
            Find every
            <span className="rotator">
              <span className="rotator-inner">
                <span>paper.</span><span>note.</span><span>unit.</span><span>answer.</span><span>paper.</span>
              </span>
            </span>
            In one place.
          </h1>
          <p className="lede">A study library for CSE, IT, ECE and EEE, with an AI assistant that can read any paper with you.</p>
          <div className="stats">
            <Stat value={4} label="branches" />
            <Stat value={7} label="semesters" />
            <Stat value={165} suffix="+" label="subjects" />
          </div>
        </section>

        <form className="card form auth-card" onSubmit={submit}>
          <p className="eyebrow">01 / Faculty access</p>
          <h2>Sign in</h2>
          <input placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <p className="error">{error}</p>}
          <button className="btn btn-primary">Sign in</button>
          <div className="divider">or</div>
          <button type="button" className="btn" onClick={() => navigate('/student')}>Student access <span className="arrow">→</span></button>
        </form>
      </div>
      <Marquee />
    </>
  );
}
