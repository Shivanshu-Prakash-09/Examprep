// Who is using the app?  role = 'teacher' | 'student' (Gmail) | 'guest' | null (not chosen yet)
import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api';
import { AUTH_KEY, readAuth } from '../api/http';

const GUEST_KEY = 'cb_guest';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readAuth());                                   // teacher or student
  const [guest, setGuest] = useState(!!sessionStorage.getItem(GUEST_KEY));

  const save = (value) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(value));
    setAuth(value);
  };

  const value = useMemo(() => {
    const role = auth?.role || (guest ? 'guest' : null);
    return {
      ready: true,
      role,
      email: auth?.email || null,
      canLike: role === 'student',
      tracksHistory: role === 'student',

      async loginTeacher(username, password) {
        const { token } = await api.teacherLogin(username, password);
        save({ token, role: 'teacher' });
      },
      async loginStudent(email) {
        const res = await api.studentLogin(email);
        save({ token: res.token, role: 'student', email: res.email });
      },
      continueAsGuest() {
        sessionStorage.setItem(GUEST_KEY, '1');
        setGuest(true);
      },
      logout() {
        localStorage.removeItem(AUTH_KEY);
        sessionStorage.removeItem(GUEST_KEY);
        setAuth(null);
        setGuest(false);
      },
    };
  }, [auth, guest]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
