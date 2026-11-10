// One function per backend endpoint. Pages import from here, never call fetch directly.
import { http } from './http';

const qs = (params) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  const s = new URLSearchParams(clean).toString();
  return s ? `?${s}` : '';
};

export const api = {
  teacherLogin: (username, password) => http('/auth/teacher/login', { method: 'POST', body: { username, password } }),
  studentLogin: (email) => http('/auth/student/login', { method: 'POST', body: { email } }),

  listSubjects: (filters) => http(`/subjects${qs(filters)}`),
  searchSubjects: (q, branch) => http(`/subjects/search${qs({ q, branch })}`),
  matchSyllabus: (syllabus, branch, semester) => http('/subjects/match', { method: 'POST', body: { syllabus, branch, semester } }),
  getSubject: (id) => http(`/subjects/${id}`),
  createSubject: (data) => http('/subjects', { method: 'POST', body: data }),
  deleteSubject: (id) => http(`/subjects/${id}`, { method: 'DELETE' }),
  saveUnit: (id, unit, text) => http(`/subjects/${id}/units/${encodeURIComponent(unit)}`, { method: 'PUT', body: { text } }),
  deleteUnit: (id, unit) => http(`/subjects/${id}/units/${encodeURIComponent(unit)}`, { method: 'DELETE' }),

  listResources: (subjectId, filters) => http(`/subjects/${subjectId}/resources${qs(filters)}`),
  uploadResource: (formData) => http('/resources', { method: 'POST', form: formData }),
  updateResource: (id, data) => http(`/resources/${id}`, { method: 'PATCH', body: data }),
  deleteResource: (id) => http(`/resources/${id}`, { method: 'DELETE' }),
  toggleLike: (id) => http(`/resources/${id}/like`, { method: 'POST' }),

  addHistory: (data) => http('/history', { method: 'POST', body: data }),
  listHistory: () => http('/history'),
};
