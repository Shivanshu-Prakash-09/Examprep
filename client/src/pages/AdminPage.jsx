// Teacher/faculty admin side: upload papers & notes, add missing subjects.
import { useState } from 'react';
import AddSubjectForm from '../components/AddSubjectForm';
import UploadForm from '../components/UploadForm';

export default function AdminPage() {
  const [tab, setTab] = useState('upload');
  return (
    <div className="narrow-wrap">
      <div className="tabs">
        <button className={tab === 'upload' ? 'active' : ''} onClick={() => setTab('upload')}>Upload paper / notes</button>
        <button className={tab === 'subject' ? 'active' : ''} onClick={() => setTab('subject')}>Add subject</button>
      </div>
      {tab === 'upload' ? <UploadForm /> : <AddSubjectForm />}
    </div>
  );
}
