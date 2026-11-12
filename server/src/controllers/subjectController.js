import { randomUUID } from 'node:crypto';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { UPLOAD_DIR, db, toSubject } from '../config/db.js';
import { matchByName, matchBySyllabus } from '../services/matchService.js';
import { BRANCHES, MAX_SEMESTER, yearOfSemester } from '../utils/constants.js';
import { HttpError } from '../utils/httpError.js';

const LIST_COLUMNS = 'id, branch, year, semester, name, credits';

// Builds "WHERE branch = ? AND semester = ?" from whichever filters were given.
const where = (filters) => {
  const keys = Object.keys(filters).filter((k) => filters[k] !== undefined && filters[k] !== '');
  return {
    sql: keys.length ? `WHERE ${keys.map((k) => `${k} = ?`).join(' AND ')}` : '',
    values: keys.map((k) => filters[k]),
  };
};

const loadAll = (filters = {}) => {
  const w = where(filters);
  return db.prepare(`SELECT * FROM subjects ${w.sql}`).all(...w.values).map(toSubject);
};

const withoutUnits = ({ units, ...rest }) => rest;

// GET /api/subjects?branch=CSE&year=2&semester=3
export const listSubjects = (req, res) => {
  const { branch, year, semester } = req.query;
  const w = where({ branch, year: year && Number(year), semester: semester && Number(semester) });
  res.json(db.prepare(`SELECT ${LIST_COLUMNS} FROM subjects ${w.sql} ORDER BY name`).all(...w.values));
};

// GET /api/subjects/search?q=old name&branch=CSE
export const searchSubjects = (req, res) => {
  res.json(matchByName(req.query.q, loadAll({ branch: req.query.branch })).map(withoutUnits));
};

// POST /api/subjects/match  { syllabus, branch?, semester? }  -> top 5
export const matchSyllabus = (req, res) => {
  const { syllabus, branch, semester } = req.body || {};
  if (!syllabus || syllabus.trim().length < 20) throw new HttpError(400, 'Paste at least a few lines of the syllabus');
  const subjects = loadAll({ branch, semester: semester && Number(semester) });
  res.json(matchBySyllabus(syllabus, subjects, 5).map(withoutUnits));
};

// GET /api/subjects/:id  (includes unit-wise syllabus)
export const getSubject = (req, res) => {
  const row = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  if (!row) throw new HttpError(404, 'Subject not found');
  res.json(toSubject(row));
};

// POST /api/subjects  (teacher)  { branch, semester, name, credits?, units, aliases? }
export const createSubject = (req, res) => {
  const { branch, semester, name, credits, units, aliases } = req.body || {};
  const sem = Number(semester);
  if (!BRANCHES.includes(branch)) throw new HttpError(400, 'Invalid branch');
  if (!(sem >= 1 && sem <= MAX_SEMESTER)) throw new HttpError(400, 'Invalid semester');
  if (!name?.trim()) throw new HttpError(400, 'Subject name is required');

  const cleanUnits = Object.fromEntries(
    Object.entries(units || {}).filter(([, t]) => t?.trim()).map(([k, t]) => [k, t.trim()])
  );
  const id = randomUUID();
  try {
    db.prepare('INSERT INTO subjects (id, branch, year, semester, name, credits, units, aliases) VALUES (?,?,?,?,?,?,?,?)').run(
      id, branch, yearOfSemester(sem), sem, name.trim(), credits ? Number(credits) : null,
      JSON.stringify(cleanUnits), JSON.stringify((aliases || []).map((a) => a.trim()).filter(Boolean))
    );
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) throw new HttpError(409, 'This subject already exists for that branch and semester');
    throw err;
  }
  res.status(201).json(db.prepare(`SELECT ${LIST_COLUMNS} FROM subjects WHERE id = ?`).get(id));
};

// ---- teacher-only edits ----
const loadSubjectRow = (id) => {
  const row = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
  if (!row) throw new HttpError(404, 'Subject not found');
  return row;
};
const saveUnits = (id, units) => {
  db.prepare('UPDATE subjects SET units = ? WHERE id = ?').run(JSON.stringify(units), id);
  return toSubject(loadSubjectRow(id));
};
const cleanUnitKey = (raw) => {
  const key = String(raw ?? '').trim();
  if (!/^[\w .-]{1,12}$/.test(key)) throw new HttpError(400, 'Unit name must be 1 to 12 letters or numbers, like "IV"');
  return key;
};

// PUT /api/subjects/:id/units/:unit  (teacher)  { text }  -> edits that unit, or adds it if it is new
export const saveUnit = (req, res) => {
  const row = loadSubjectRow(req.params.id);
  const key = cleanUnitKey(req.params.unit);
  const text = String(req.body?.text ?? '').trim();
  if (!text) throw new HttpError(400, 'The unit syllabus cannot be empty. Use Delete unit to remove it.');
  const units = { ...toSubject(row).units, [key]: text };
  res.json(saveUnits(row.id, units));
};

// DELETE /api/subjects/:id/units/:unit  (teacher)
export const deleteUnit = (req, res) => {
  const row = loadSubjectRow(req.params.id);
  const units = { ...toSubject(row).units };
  if (!(req.params.unit in units)) throw new HttpError(404, 'Unit not found');
  delete units[req.params.unit];
  res.json(saveUnits(row.id, units));
};

// DELETE /api/subjects/:id  (teacher) -> removes the subject, its papers/notes (and their files), likes and history
export const deleteSubject = (req, res) => {
  const row = loadSubjectRow(req.params.id);
  const files = db.prepare('SELECT file_name FROM resources WHERE subject_id = ?').all(row.id);
  db.prepare('DELETE FROM subjects WHERE id = ?').run(row.id);   // ON DELETE CASCADE clears resources, likes, history
  for (const { file_name } of files) {
    if (db.prepare('SELECT 1 FROM resources WHERE file_name = ?').get(file_name)) continue;   // still used by another subject
    const file = path.join(UPLOAD_DIR, file_name);
    if (existsSync(file)) unlinkSync(file);
  }
  res.status(204).end();
};
