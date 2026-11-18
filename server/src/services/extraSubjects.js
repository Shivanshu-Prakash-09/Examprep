// Adds subjects from database/seed/extra_subjects.json that are not in the database yet.
// Runs on every start; each subject is added once (remembered in import_log), so a subject that a
// teacher later deletes does not come back. A subject with the same branch + semester + name is never overwritten.
import { existsSync, readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

export function addExtraSubjects({ db, file, log = () => {} }) {
  if (!existsSync(file)) return 0;
  const list = JSON.parse(readFileSync(file, 'utf8'));
  db.exec('CREATE TABLE IF NOT EXISTS import_log (key TEXT PRIMARY KEY)');
  const exists = db.prepare('SELECT 1 FROM subjects WHERE branch = ? AND semester = ? AND name = ?');
  const done = db.prepare('SELECT 1 FROM import_log WHERE key = ?');
  const mark = db.prepare('INSERT OR IGNORE INTO import_log (key) VALUES (?)');
  const insert = db.prepare('INSERT INTO subjects (id, branch, year, semester, name, credits, units, note) VALUES (?,?,?,?,?,?,?,?)');
  let added = 0;
  db.exec('BEGIN');
  try {
    for (const s of list) {
      const key = `subject:${s.branch}:${s.semester}:${s.name}`;
      if (done.get(key)) continue;
      mark.run(key);
      if (exists.get(s.branch, s.semester, s.name)) continue;
      insert.run(randomUUID(), s.branch, s.year, s.semester, s.name, s.credits, JSON.stringify(s.units), s.note || null);
      added++;
    }
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
  if (added) log(`[db] Added ${added} new subjects from extra_subjects.json.`);
  return added;
}
