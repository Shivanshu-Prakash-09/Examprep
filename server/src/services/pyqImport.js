// Loads the previous-year papers in database/pyq/ (manifest.json + files/) into the database.
// Used automatically on first start (see config/db.js) and by `npm run import:pyq` (re-runnable).
//
// manifest.json: [{ branch, semester, folder_name, papers: [{ file, exam_type, year, month }] }]
// Each paper is matched to a subject of the same branch (same semester preferred). If a subject is
// missing from the syllabus data it is created (with an empty syllabus) so no paper is left out.
import { createHash, randomUUID } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const STOP = new Set(['and', 'the', 'of', 'to', 'for', 'in', 'a']);
const ROMAN = new Set(['i', 'ii', 'iii', 'iv']);
const words = (s) =>
  s.toLowerCase().replace(/c\+\+/g, ' cpp ').replace(/[_'’\-–()&,.]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));
const roman = (s) => words(s).filter((w) => ROMAN.has(w)).join('');
const tokens = (s) => words(s).filter((w) => !ROMAN.has(w));

const score = (fileName, subjectName) => {
  const a = new Set(tokens(fileName)), b = new Set(tokens(subjectName));
  if (!a.size || !b.size) return 0;
  const inter = [...a].filter((w) => b.has(w)).length;
  let s = inter / (a.size + b.size - inter);
  if (roman(fileName) !== roman(subjectName)) s -= 0.25;   // "Physics I" vs "Physics II"
  return s;
};

const prettyName = (folderName) =>
  folderName.replace(/_/g, ' ').replace(/\bCpp\b/g, 'C++').replace(/\bAnd\b/g, 'and').replace(/\bfor\b/gi, 'for').trim();

const title = (p) => {
  const type = p.exam_type === 'mid' ? 'Mid Term' : p.exam_type === 'end' ? 'End Term' : 'Paper';
  return [type, p.month, p.year].filter(Boolean).join(' ') + (p.year ? '' : ' (year not known)');
};

const sha = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');

/**
 * @param {{db, uploadDir, pyqDir, apply?: boolean, log?: Function}} o
 * @returns rows describing what happened to every paper (for the report)
 */
export function importPyq({ db, uploadDir, pyqDir, apply = true, log = () => {} }) {
  const manifestPath = path.join(pyqDir, 'manifest.json');
  if (!existsSync(manifestPath)) return [];
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  const subjects = db.prepare('SELECT id, branch, semester, name FROM subjects').all();
  const insertSubject = db.prepare(
    "INSERT INTO subjects (id, branch, year, semester, name, credits, units, note) VALUES (?,?,?,?,?,NULL,'{}',?)"
  );
  const insertResource = db.prepare(
    'INSERT INTO resources (id, subject_id, kind, title, exam_type, paper_year, file_name) VALUES (?,?,?,?,?,?,?)'
  );
  const existingFiles = db.prepare("SELECT title, file_name FROM resources WHERE subject_id = ? AND kind = 'paper'");

  const report = [];
  if (apply) db.exec('BEGIN');
  try {
    for (const entry of manifest) {
      // ---- 1. which subject? ----
      const pool = subjects.filter((s) => s.branch === entry.branch);
      const ranked = pool
        .map((s) => ({ s, sc: score(entry.folder_name, s.name) + (s.semester === entry.semester ? 0.15 : 0) }))
        .sort((x, y) => y.sc - x.sc);
      const best = ranked[0];
      const sameYear = best && Math.ceil(best.s.semester / 2) === Math.ceil(entry.semester / 2);
      const confident = best && best.sc >= 0.5 && (best.s.semester === entry.semester || (sameYear && best.sc >= 0.8));

      let subject, how;
      if (confident) {
        subject = best.s;
        how = best.s.semester === entry.semester ? 'matched' : `matched (folder SEM${entry.semester}, subject SEM${best.s.semester})`;
      } else {
        const name = prettyName(entry.folder_name);
        subject = subjects.find((s) => s.branch === entry.branch && s.semester === entry.semester && s.name === name);
        how = subject ? 'matched (added earlier)' : 'CREATED (not in syllabus data)';
        if (!subject) {
          subject = { id: randomUUID(), branch: entry.branch, semester: entry.semester, name };
          if (apply) insertSubject.run(subject.id, subject.branch, Math.ceil(subject.semester / 2), subject.semester, subject.name,
            'Syllabus not added yet. Teachers can fill it from the admin page.');
          subjects.push(subject);
        }
      }

      // ---- 2. import each paper (skip files that are already there) ----
      const have = new Map(existingFiles.all(subject.id).map((r) => [r.file_name, r.title]));
      const hashes = new Set([...have.keys()].map((f) => path.join(uploadDir, f)).filter(existsSync).map(sha));
      const titles = new Set(have.values());
      for (const p of entry.papers) {
        const src = path.join(pyqDir, 'files', p.file);
        let result = 'imported';
        const h = sha(src);
        if (hashes.has(h)) result = 'already imported';
        else {
          hashes.add(h);
          let t = title(p), n = 2;
          while (titles.has(t)) t = `${title(p)} (${n++})`;      // same month+year twice -> (2)
          titles.add(t);
          if (apply) {
            const id = randomUUID(), fileName = `${id}.pdf`;
            copyFileSync(src, path.join(uploadDir, fileName));
            insertResource.run(id, subject.id, 'paper', t, p.exam_type || null, p.year || null, fileName);
          } else result = 'would import';
        }
        report.push({ branch: entry.branch, folder_sem: entry.semester, file: p.file, subject: subject.name,
          subject_sem: subject.semester, subject_how: how, exam_type: p.exam_type, year: p.year, result });
      }
    }
    if (apply) db.exec('COMMIT');
  } catch (err) {
    if (apply) db.exec('ROLLBACK');
    throw err;
  }
  const done = report.filter((r) => r.result === 'imported').length;
  log(`[pyq] ${apply ? 'Imported' : 'Would import'} ${done} papers (${report.length} in the data folder).`);
  return report;
}
