// Teacher flow (Slide 2A): branch -> year -> semester -> subject -> notes/paper -> file -> year -> confirm.
import { useEffect, useState } from 'react';
import { api } from '../api';
import { BRANCHES, YEARS, semestersOfYear } from '../utils/constants';
import Modal from './Modal';

const EMPTY = { branch: '', year: '', semester: '', subjectId: '', kind: 'paper', examType: 'end', title: '', paperYear: '', unspecified: false, file: null };

export default function UploadForm() {
  const [form, setForm] = useState(EMPTY);
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [fileKey, setFileKey] = useState(0); // resets the <input type="file">

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    set({ subjectId: '' });
    if (form.branch && form.semester) {
      api.listSubjects({ branch: form.branch, semester: form.semester }).then(setSubjects).catch((e) => setError(e.message));
    } else {
      setSubjects([]);
    }
  }, [form.branch, form.semester]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const data = new FormData();
      data.append('subjectId', form.subjectId);
      data.append('kind', form.kind);
      data.append('title', form.title);
      if (form.kind === 'paper') {
        data.append('examType', form.examType);
        if (!form.unspecified && form.paperYear) data.append('paperYear', form.paperYear);
      }
      data.append('file', form.file);
      await api.uploadResource(data);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const closeConfirmation = () => {   // "on close, redirect back to the start of the form"
    setDone(false);
    setForm(EMPTY);
    setFileKey((k) => k + 1);
  };

  const isPaper = form.kind === 'paper';
  const ready = form.subjectId && form.title && form.file && (!isPaper || form.unspecified || form.paperYear);

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Upload paper or notes</h2>

      <label>Branch
        <select value={form.branch} onChange={(e) => set({ branch: e.target.value })} required>
          <option value="">Select branch</option>
          {BRANCHES.map((b) => <option key={b}>{b}</option>)}
        </select>
      </label>
      <label>Year
        <select value={form.year} onChange={(e) => set({ year: e.target.value, semester: '' })} required>
          <option value="">Select year</option>
          {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
        </select>
      </label>
      <label>Semester
        <select value={form.semester} onChange={(e) => set({ semester: e.target.value })} required disabled={!form.year}>
          <option value="">Select semester</option>
          {form.year && semestersOfYear(Number(form.year)).map((s) => <option key={s} value={s}>Semester {s}</option>)}
        </select>
      </label>
      <label>Subject
        <select value={form.subjectId} onChange={(e) => set({ subjectId: e.target.value })} required disabled={!subjects.length}>
          <option value="">{subjects.length ? 'Select subject' : 'Pick branch and semester first'}</option>
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>

      <label>What are you uploading?
        <select value={form.kind} onChange={(e) => set({ kind: e.target.value })}>
          <option value="paper">Previous-year paper</option>
          <option value="notes">Notes</option>
        </select>
      </label>

      {isPaper && (
        <>
          <label>Paper type
            <select value={form.examType} onChange={(e) => set({ examType: e.target.value })}>
              <option value="mid">Mid-term</option>
              <option value="end">End-term</option>
            </select>
          </label>
          <label>Paper year
            <input type="number" min="2000" max="2100" placeholder="e.g. 2023" disabled={form.unspecified}
              value={form.paperYear} onChange={(e) => set({ paperYear: e.target.value })} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.unspecified} onChange={(e) => set({ unspecified: e.target.checked })} />
            Year unspecified / not known
          </label>
        </>
      )}

      <label>Name shown to students
        <input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. End Sem 2023" required />
      </label>
      <label>File (PDF, PNG, JPG or DOCX, max 25 MB)
        <input key={fileKey} type="file" accept=".pdf,.png,.jpg,.jpeg,.docx" onChange={(e) => set({ file: e.target.files[0] })} required />
      </label>

      {error && <p className="error">{error}</p>}
      <button className="btn btn-primary" disabled={!ready || busy}>{busy ? 'Uploading...' : 'Upload'}</button>

      {done && <Modal title="Uploaded successfully" onClose={closeConfirmation}><p>Students can now see this file.</p></Modal>}
    </form>
  );
}
