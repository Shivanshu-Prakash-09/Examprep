export const BRANCHES = ['CSE', 'IT', 'ECE', 'EEE'];
export const MAX_SEMESTER = 7;
export const EXAM_TYPES = ['mid', 'end'];
export const RESOURCE_KINDS = ['paper', 'notes'];

// Year 1 = sem 1-2, Year 2 = sem 3-4, Year 3 = sem 5-6, Year 4 = sem 7.
export const yearOfSemester = (semester) => Math.ceil(semester / 2);
