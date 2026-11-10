// "Resources" = previous-year papers (kind "paper") and notes (kind "notes").
import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR, db } from '../config/db.js';
import { env } from '../config/env.js';
import { EXAM_TYPES, RESOURCE_KINDS } from '../utils/constants.js';
import { HttpError } from '../utils/httpError.js';

// Public address used in file links. Uses PUBLIC_BASE_URL when it is set, otherwise the address
// the request came in on (so links never point at localhost on a deployed server).
const baseUrl = (req) =>
  process.env.PUBLIC_BASE_URL ? env.publicBaseUrl : `${req.protocol}://${req.get('host')}`;

const present = (row, likedIds = new Set(), base = env.publicBaseUrl) => ({
  id: row.id,
  title: row.title,
  kind: row.kind,
  exam_type: row.exam_type,
  paper_year: row.paper_year,
  created_at: row.created_at,
  likes: row.likes ?? 0,
  liked_by_me: likedIds.has(row.id),
  file_url: `${base}/files/${row.file_name}`,                // opened by "Ask with AI"
  download_url: `${base}/api/resources/${row.id}/download`,
});

const ORDER = {
  likes: 'likes DESC, r.created_at DESC',
  year: 'r.paper_year IS NULL, r.paper_year DESC',
  newest: 'r.created_at DESC',
};

// GET /api/subjects/:subjectId/resources?kind=paper&examType=end&sort=likes|year|newest
export const listResources = (req, res) => {
  const { kind = 'paper', examType, sort = 'likes' } = req.query;
  const filters = ['r.subject_id = ?', 'r.kind = ?'];
  const values = [req.params.subjectId, kind];
  if (EXAM_TYPES.includes(examType)) { filters.push('r.exam_type = ?'); values.push(examType); }

  const rows = db.prepare(`
    SELECT r.*, (SELECT COUNT(*) FROM likes l WHERE l.resource_id = r.id) AS likes
    FROM resources r WHERE ${filters.join(' AND ')} ORDER BY ${ORDER[sort] || ORDER.likes}
  `).all(...values);

  let liked = new Set();
  if (req.user) {
    liked = new Set(db.prepare('SELECT resource_id FROM likes WHERE user_email = ?').all(req.user.email).map((l) => l.resource_id));
  }
  res.json(rows.map((r) => present(r, liked, baseUrl(req))));
};

// POST /api/resources  (teacher, multipart/form-data, field "file")
export const createResource = (req, res) => {
  const { subjectId, kind, title, examType, paperYear } = req.body;
  if (!req.file) throw new HttpError(400, 'Please choose a file to upload');
  if (!db.prepare('SELECT 1 FROM subjects WHERE id = ?').get(subjectId)) throw new HttpError(400, 'Subject not found');
  if (!RESOURCE_KINDS.includes(kind)) throw new HttpError(400, 'Choose notes or paper');
  if (!title?.trim()) throw new HttpError(400, 'Please give the file a name');
  if (kind === 'paper' && !EXAM_TYPES.includes(examType)) throw new HttpError(400, 'Choose mid-term or end-term');

  const ext = path.extname(req.file.originalname).toLowerCase().replace(/[^.\w]/g, '');
  const id = randomUUID();
  const fileName = `${id}${ext}`;
  writeFileSync(path.join(UPLOAD_DIR, fileName), req.file.buffer);

  db.prepare('INSERT INTO resources (id, subject_id, kind, title, exam_type, paper_year, file_name) VALUES (?,?,?,?,?,?,?)').run(
    id, subjectId, kind, title.trim(),
    kind === 'paper' ? examType : null,
    kind === 'paper' && paperYear ? Number(paperYear) : null,   // null = "unspecified"
    fileName
  );
  res.status(201).json(present(db.prepare('SELECT *, 0 AS likes FROM resources WHERE id = ?').get(id), undefined, baseUrl(req)));
};

// GET /api/resources/:id/download -> forces a download with the teacher's file name
export const downloadResource = (req, res) => {
  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!row) throw new HttpError(404, 'File not found');
  res.download(path.join(UPLOAD_DIR, row.file_name), `${row.title}${path.extname(row.file_name)}`);
};

// PATCH /api/resources/:id  (teacher)  { title, examType?, paperYear? }  -> fixes a wrong name / type / year
export const updateResource = (req, res) => {
  const row = db.prepare('SELECT * FROM resources WHERE id = ?').get(req.params.id);
  if (!row) throw new HttpError(404, 'Resource not found');
  const { title, examType, paperYear } = req.body || {};
  if (!title?.trim()) throw new HttpError(400, 'Please give the file a name');

  let exam = row.exam_type, year = row.paper_year;
  if (row.kind === 'paper') {
    if (examType !== undefined) {
      if (examType && !EXAM_TYPES.includes(examType)) throw new HttpError(400, 'Choose mid-term or end-term');
      exam = examType || null;
    }
    if (paperYear !== undefined) {
      year = paperYear === '' || paperYear === null ? null : Number(paperYear);
      if (year !== null && !(Number.isInteger(year) && year >= 2000 && year <= 2100)) throw new HttpError(400, 'Enter a valid year, like 2024');
    }
  }
  db.prepare('UPDATE resources SET title = ?, exam_type = ?, paper_year = ? WHERE id = ?').run(title.trim(), exam, year, row.id);
  res.json(present(db.prepare('SELECT r.*, (SELECT COUNT(*) FROM likes l WHERE l.resource_id = r.id) AS likes FROM resources r WHERE r.id = ?').get(row.id), undefined, baseUrl(req)));
};

// DELETE /api/resources/:id  (teacher)
export const deleteResource = (req, res) => {
  const row = db.prepare('SELECT file_name FROM resources WHERE id = ?').get(req.params.id);
  if (!row) throw new HttpError(404, 'Resource not found');
  const file = path.join(UPLOAD_DIR, row.file_name);
  if (existsSync(file)) unlinkSync(file);
  db.prepare('DELETE FROM resources WHERE id = ?').run(req.params.id);
  res.status(204).end();
};

// POST /api/resources/:id/like  (Gmail students only) -> toggles like
export const toggleLike = (req, res) => {
  const { id } = req.params;
  const email = req.user.email;
  if (!db.prepare('SELECT 1 FROM resources WHERE id = ?').get(id)) throw new HttpError(404, 'Resource not found');

  const existing = db.prepare('SELECT 1 FROM likes WHERE resource_id = ? AND user_email = ?').get(id, email);
  if (existing) db.prepare('DELETE FROM likes WHERE resource_id = ? AND user_email = ?').run(id, email);
  else db.prepare('INSERT INTO likes (resource_id, user_email) VALUES (?, ?)').run(id, email);

  const { n } = db.prepare('SELECT COUNT(*) AS n FROM likes WHERE resource_id = ?').get(id);
  res.json({ liked: !existing, likes: n });
};
