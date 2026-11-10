export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE'];
export const YEARS = [1, 2, 3, 4];
export const UNIT_KEYS = ['I', 'II', 'III', 'IV', 'V'];

// Year 1 = sem 1-2, Year 2 = sem 3-4, Year 3 = sem 5-6, Year 4 = sem 7.
export const semestersOfYear = (year) => [year * 2 - 1, year * 2].filter((s) => s <= 7);

export const BOT_URL = import.meta.env.VITE_BOT_URL || 'https://campusbrainchatbot.streamlit.app/';
export const BOT_PARAM = import.meta.env.VITE_BOT_PARAM || 'pdf_url';

// Link that opens the AI bot with a paper preloaded.
export const botLinkForPaper = (fileUrl) => `${BOT_URL}?${BOT_PARAM}=${encodeURIComponent(fileUrl)}`;
