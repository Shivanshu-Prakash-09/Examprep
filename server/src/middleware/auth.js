// Authentication middleware. One signed token (JWT) format for everyone:
//   teacher -> { role: 'teacher' }
//   student -> { role: 'student', email }
//   guest   -> sends no token at all
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const readToken = (req) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), env.jwtSecret);
  } catch {
    return null;
  }
};

export const signToken = (payload) => jwt.sign(payload, env.jwtSecret, { expiresIn: '12h' });

export const requireTeacher = (req, _res, next) => {
  const t = readToken(req);
  if (t?.role !== 'teacher') return next(new HttpError(401, 'Teacher login required'));
  next();
};

export const requireStudent = (req, _res, next) => {
  const t = readToken(req);
  if (t?.role !== 'student') return next(new HttpError(401, 'Please login with your Gmail to do this'));
  req.user = { email: t.email };
  next();
};

// Sets req.user for logged-in students; guests continue with req.user = null.
export const optionalStudent = (req, _res, next) => {
  const t = readToken(req);
  req.user = t?.role === 'student' ? { email: t.email } : null;
  next();
};
