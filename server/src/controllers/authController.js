import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { HttpError } from '../utils/httpError.js';

// Constant-time comparison (avoids leaking info through timing).
const safeEqual = (a = '', b = '') =>
  crypto.timingSafeEqual(crypto.createHash('sha256').update(a).digest(), crypto.createHash('sha256').update(b).digest());

// POST /api/auth/teacher/login  { username, password }
export const teacherLogin = (req, res) => {
  const { username, password } = req.body || {};
  if (!(safeEqual(username, env.teacherUsername) && safeEqual(password, env.teacherPassword))) {
    throw new HttpError(401, 'Wrong username or password');
  }
  res.json({ token: signToken({ role: 'teacher' }) });
};

// POST /api/auth/student/login  { email }
// LOCAL MODE: the email is NOT verified (no Google here). It only identifies the student
// so that likes and history are saved per person. See README -> "Real Gmail login".
export const studentLogin = (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@gmail\.com$/.test(email)) throw new HttpError(400, 'Enter a valid Gmail address (name@gmail.com)');
  res.json({ token: signToken({ role: 'student', email }), email });
};
