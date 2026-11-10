// Page frame: animated backdrop, header (wordmark, Chat with AI, logout), animated content area.
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BOT_URL } from '../utils/constants';
import Backdrop from './Backdrop';

export default function Layout() {
  const { role, email, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isStudentSide = role === 'student' || role === 'guest';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <Backdrop />
      <header className="header">
        <Link to={role === 'teacher' ? '/admin' : role ? '/browse' : '/'} className="wordmark">
          <span className="pulse" /> Exam<b>Prep</b>
        </Link>
        <nav className="header-actions">
          {role === 'student' && <span className="user-pill">{email}</span>}
          {role === 'teacher' && <span className="user-pill">faculty</span>}
          {role === 'guest' && <span className="user-pill">guest</span>}
          {role === 'teacher' && (
            <>
              <Link className={`btn btn-ghost ${location.pathname === '/admin' ? 'btn-current' : ''}`} to="/admin">Upload and add</Link>
              <Link className={`btn btn-ghost ${location.pathname === '/admin' ? '' : 'btn-current'}`} to="/browse">Manage subjects</Link>
            </>
          )}
          {role === 'student' && <Link className="btn btn-ghost" to="/history">History</Link>}
          {isStudentSide && (
            <a className="btn btn-ghost" href={BOT_URL} target="_blank" rel="noreferrer">Chat with AI ↗</a>
          )}
          {role && <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>}
        </nav>
      </header>
      <main className="container">
        <div className="page" key={location.pathname}><Outlet /></div>
      </main>
    </>
  );
}
