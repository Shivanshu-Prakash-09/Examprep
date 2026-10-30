// Re-run the previous-year-paper import (safe: papers already in the database are skipped).
//   npm run import:pyq              -> imports for real and writes server/import-report.csv
//   npm run import:pyq -- --dry-run -> only shows what would happen
// To add more papers: put the PDFs in database/pyq/files/ and list them in database/pyq/manifest.json.
import { writeFileSync } from 'node:fs';
import { PYQ_DIR, UPLOAD_DIR, db } from '../src/config/db.js';
import { importPyq } from '../src/services/pyqImport.js';

const apply = !process.argv.includes('--dry-run');
const report = importPyq({ db, uploadDir: UPLOAD_DIR, pyqDir: PYQ_DIR, apply, log: console.log });
const cols = ['branch', 'folder_sem', 'file', 'subject', 'subject_sem', 'subject_how', 'exam_type', 'year', 'result'];
writeFileSync('import-report.csv', [cols, ...report.map((r) => cols.map((c) => r[c] ?? ''))]
  .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'));
const tally = {}; report.forEach((r) => { tally[r.result] = (tally[r.result] || 0) + 1; });
console.table(tally);
console.log('Report: server/import-report.csv');
