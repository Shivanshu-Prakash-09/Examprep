export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE'];
export const YEARS = [1, 2, 3, 4];
export const UNIT_KEYS = ['I', 'II', 'III', 'IV', 'V'];

// Year 1 = sem 1-2, Year 2 = sem 3-4, Year 3 = sem 5-6, Year 4 = sem 7.
export const semestersOfYear = (year) => [year * 2 - 1, year * 2].filter((s) => s <= 7);

export const BOT_URL = import.meta.env.VITE_BOT_URL || 'https://campusbrainchatbot.streamlit.app/';

// Link that opens the AI bot with a paper preloaded.
export const botLinkForPaper = (paperOrUrl, subject) => {
  const apiBase = import.meta.env.VITE_API_BASE || "https://examprep-29u3.onrender.com";
  
  const isString = typeof paperOrUrl === 'string';
  let rawFileUrl = isString ? paperOrUrl : (paperOrUrl?.file_url || paperOrUrl?.fileUrl || paperOrUrl?.url || '');

  let fileUrl = rawFileUrl;
  if (fileUrl.startsWith('http://localhost') || fileUrl.startsWith('http://127.0.0.1')) {
    fileUrl = fileUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, apiBase);
  } else if (fileUrl.startsWith('/')) {
    fileUrl = `${apiBase}${fileUrl}`;
  }

  const paperId = isString ? 'paper-' + Math.random().toString(36).substring(7) : (paperOrUrl?.id || paperOrUrl?._id || 'unknown');
  const year = isString ? 'Unknown' : (paperOrUrl?.paper_year || paperOrUrl?.year || 'Unknown');

  const params = new URLSearchParams({
    paperId: paperId,
    pdfUrl: fileUrl,
    subject: subject?.name || paperOrUrl?.subject_name || 'Unknown',
    year: year,
    branch: subject?.branch || paperOrUrl?.branch || '',
    semester: subject?.semester || paperOrUrl?.semester || '',
  });

  return `${BOT_URL.replace(/\/$/, '')}/?${params.toString()}`;
};