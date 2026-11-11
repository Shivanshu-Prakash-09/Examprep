// Database: a single SQLite file using Node's built-in `node:sqlite` (no install, no account).
// On first start the tables are created and the syllabus is loaded from database/seed/subjects.json.
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { importPyq } from '../services/pyqImport.js';

const here = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.resolve(here, '../../data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const SEED_FILE = path.resolve(here, '../../../database/seed/subjects.json');
export const PYQ_DIR = path.resolve(here, '../../../database/pyq');   // split previous-year papers + manifest.json

mkdirSync(UPLOAD_DIR, { recursive: true });
export const db = new DatabaseSync(path.join(DATA_DIR, 'campusbrain.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS subjects (
    id         TEXT PRIMARY KEY,
    branch     TEXT NOT NULL CHECK (branch IN ('CSE','IT','ECE','EEE')),
    year       INTEGER NOT NULL CHECK (year BETWEEN 1 AND 4),
    semester   INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 7),
    name       TEXT NOT NULL,
    credits    INTEGER,
    units      TEXT NOT NULL DEFAULT '{}',   -- JSON: {"I": "...", "II": "..."}
    note       TEXT,
    aliases    TEXT NOT NULL DEFAULT '[]',   -- JSON array of old/alternative names
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (branch, semester, name)
  );

  CREATE TABLE IF NOT EXISTS resources (
    id          TEXT PRIMARY KEY,
    subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK (kind IN ('paper','notes')),
    title       TEXT NOT NULL,
    exam_type   TEXT CHECK (exam_type IN ('mid','end')),
    paper_year  INTEGER,                      -- NULL = "unspecified"
    file_name   TEXT NOT NULL,                -- file inside data/uploads
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS resources_subject_idx ON resources (subject_id, kind);

  CREATE TABLE IF NOT EXISTS likes (
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    user_email  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (resource_id, user_email)     -- one like per student per paper
  );

  CREATE TABLE IF NOT EXISTS history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email  TEXT NOT NULL,
    subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    resource_id TEXT,
    action      TEXT NOT NULL,                -- view_subject | open_paper | ask_ai
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS history_user_idx ON history (user_email, created_at);
`);

// ---- first-run seed ----
const { n } = db.prepare('SELECT COUNT(*) AS n FROM subjects').get();
if (n === 0 && existsSync(SEED_FILE)) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO subjects (id, branch, year, semester, name, credits, units, note) VALUES (?,?,?,?,?,?,?,?)'
  );
  const subjects = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  db.exec('BEGIN');
  for (const s of subjects) {
    insert.run(randomUUID(), s.branch, s.year, s.semester, s.name, s.credits, JSON.stringify(s.units), s.note || null);
  }
  db.exec('COMMIT');
  console.log(`[db] First run: loaded ${subjects.length} subjects from the syllabus data.`);
}

// ---- first-run previous-year papers (database/pyq) ----
if (db.prepare('SELECT COUNT(*) AS n FROM resources').get().n === 0) {
  importPyq({ db, uploadDir: UPLOAD_DIR, pyqDir: PYQ_DIR, log: console.log });
} else {
  // existing database: add the merged "Full Previous Years" PDFs if they are not there yet (safe to repeat)
  importPyq({ db, uploadDir: UPLOAD_DIR, pyqDir: PYQ_DIR, mergedOnly: true, log: console.log });
}

// Converts a raw subjects row into an API object (parses the JSON columns).
export const toSubject = (row) =>
  row && { ...row, units: JSON.parse(row.units || '{}'), aliases: JSON.parse(row.aliases || '[]') };
