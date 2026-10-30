// Route guard: sends people to the right login if their role isn't allowed here.
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ roles }) {
  const { ready, role } = useAuth();
  if (!ready) return <p className="muted">Loading...</p>;
  if (!role) return <Navigate to="/" replace />;
  if (!roles.includes(role)) return <Navigate to={role === 'teacher' ? '/admin' : '/browse'} replace />;
  return <Outlet />;
}
