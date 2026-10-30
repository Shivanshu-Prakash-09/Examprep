// Learning history: stored only for students who log in with Gmail.
import { db } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';

// POST /api/history  { subjectId, resourceId?, action: "view_subject" | "open_paper" | "ask_ai" }
export const addHistory = (req, res) => {
  const { subjectId, resourceId, action } = req.body || {};
  if (!subjectId || !action) throw new HttpError(400, 'subjectId and action are required');
  if (!db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(subjectId)) throw new HttpError(404, 'Subject not found');
  db.prepare('INSERT INTO history (user_email, subject_id, resource_id, action) VALUES (?,?,?,?)')
    .run(req.user.email, subjectId, resourceId || null, action);
  res.status(201).end();
};

// GET /api/history -> the 20 most recently studied subjects
export const listHistory = (req, res) => {
  res.json(db.prepare(`
    SELECT s.id, s.name, s.branch, s.year, s.semester, s.credits, MAX(h.created_at) AS last_seen
    FROM history h JOIN subjects s ON s.id = h.subject_id
    WHERE h.user_email = ? GROUP BY s.id ORDER BY last_seen DESC LIMIT 20
  `).all(req.user.email));
};
