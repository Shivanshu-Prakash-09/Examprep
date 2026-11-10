// Route map. Slide numbers refer to the original wireframes (docs/WIREFRAMES.md).
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RequireRole from './components/RequireRole';
import AdminPage from './pages/AdminPage';
import BrowsePage from './pages/BrowsePage';
import HistoryPage from './pages/HistoryPage';
import LoginPage from './pages/LoginPage';
import StudentLoginPage from './pages/StudentLoginPage';
import SubjectListPage from './pages/SubjectListPage';
import SubjectPage from './pages/SubjectPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LoginPage />} />                       {/* Slide -1 */}
        <Route path="/student" element={<StudentLoginPage />} />         {/* Slide 2B */}

        <Route element={<RequireRole roles={['student', 'guest', 'teacher']} />}>
          <Route path="/browse" element={<BrowsePage />} />              {/* Slide 3B */}
          <Route path="/subjects" element={<SubjectListPage />} />       {/* Slide 4B / 4B-2 */}
          <Route path="/subjects/:id" element={<SubjectPage />} />       {/* Slide 5B */}
        </Route>

        <Route element={<RequireRole roles={['student']} />}>
          <Route path="/history" element={<HistoryPage />} />
        </Route>

        <Route element={<RequireRole roles={['teacher']} />}>
          <Route path="/admin" element={<AdminPage />} />                {/* Slide 2A */}
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
