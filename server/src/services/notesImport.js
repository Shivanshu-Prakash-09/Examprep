// Loads the notes in database/notes/ (manifest.json + files/) into the database.
// Runs on every start and is safe to repeat: each (subject, file) pair is imported once and remembered,
// so a note a teacher deletes later is NOT brought back. Never creates subjects (a subject that is not in
// the database is skipped). One PDF is shared by every subject that uses it (stored once in uploads/).
//
// manifest.json: [{ branch, semester, subject, file, title }]
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function importNotes({ db, uploadDir, notesDir, log = () => {} }) {
  const manifestPath = path.join(notesDir, 'manifest.json');
  if (!existsSync(manifestPath)) return 0;
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  db.exec('CREATE TABLE IF NOT EXISTS import_log (key TEXT PRIMARY KEY)');
  const findSubject = db.prepare('SELECT id FROM subjects WHERE branch = ? AND semester = ? AND name = ?');
  const done = db.prepare('SELECT 1 FROM import_log WHERE key = ?');
  const mark = db.prepare('INSERT OR IGNORE INTO import_log (key) VALUES (?)');
  const insert = db.prepare('INSERT INTO resources (id, subject_id, kind, title, exam_type, paper_year, file_name) VALUES (?,?,?,?,NULL,NULL,?)');

  let added = 0, missing = 0;
  db.exec('BEGIN');
  try {
    for (const n of manifest) {
      const subject = findSubject.get(n.branch, n.semester, n.subject);
      if (!subject) continue;
      const key = `notes:${subject.id}:${n.file}`;
      if (done.get(key)) continue;
      const src = path.join(notesDir, 'files', n.file);
      if (!existsSync(src)) { missing++; continue; }
      const stored = `notes_${n.file}`;                       // same stored file for every subject that uses it
      const dest = path.join(uploadDir, stored);
      if (!existsSync(dest)) copyFileSync(src, dest);
      insert.run(randomUUID(), subject.id, 'notes', n.title, stored);
      mark.run(key);
      added++;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  if (added) log(`[notes] Added ${added} notes.`);
  if (missing) log(`[notes] WARNING: ${missing} notes file(s) not found in ${path.join(notesDir, 'files')}.`);
  return added;
}
