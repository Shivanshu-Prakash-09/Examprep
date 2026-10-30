// Slide 2B: Gmail login (history saved, can like) or guest (nothing saved).
// LOCAL MODE: the student types their Gmail address; it is not verified by Google.
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Marquee from '../components/Marquee';
import { useAuth } from '../context/AuthContext';

export default function StudentLoginPage() {
  const { role, loginStudent, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  if (role) return <Navigate to="/browse" replace />;

  const submit = async (e) => {
    e.preventDefault();
    try {
      await loginStudent(email);
      navigate('/browse');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="auth-layout">
        <section className="hero">
          <p className="eyebrow">Student access</p>
          <h1>Study with<br />a memory.</h1>
          <p className="lede">Sign in with Gmail to like the best papers and pick up where you left off. Or just browse as a guest.</p>
          <ul className="ticks">
            <li>Like and rank papers</li>
            <li>Saved learning history</li>
            <li>Guests can browse, download and ask the AI</li>
          </ul>
        </section>

        <div className="card form auth-card">
          <form className="form" onSubmit={submit}>
            <p className="eyebrow">02 / Sign in</p>
            <h2>Continue with Gmail</h2>
            <input type="email" placeholder="yourname@gmail.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            {error && <p className="error">{error}</p>}
            <button className="btn btn-primary">Continue</button>
          </form>
          <div className="divider">or</div>
          <button className="btn" onClick={() => { continueAsGuest(); navigate('/browse'); }}>Continue as guest <span className="arrow">→</span></button>
          <p className="muted center">Guests have no saved history and can't like papers.</p>
        </div>
      </div>
      <Marquee />
    </>
  );
}
