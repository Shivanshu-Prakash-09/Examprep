export const botLinkForPaper = (paperOrUrl, subject) => {
  const BOT_URL = "https://campusbrainchatbot.streamlit.app/";
  const apiBase = import.meta.env.VITE_API_BASE || "https://examprep-29u3.onrender.com";
  
  // Check if a string URL was passed directly or an object was passed
  const isString = typeof paperOrUrl === 'string';
  let rawFileUrl = isString ? paperOrUrl : (paperOrUrl?.file_url || paperOrUrl?.fileUrl || paperOrUrl?.url || '');

  // Clean and ensure the URL points to your live Render backend instead of localhost
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