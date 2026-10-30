// Loads environment variables. Every value has a working default for local testing,
// so the project runs without creating a .env file.
import 'dotenv/config';

const port = Number(process.env.PORT) || 4000;

export const env = {
  port,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  teacherUsername: process.env.TEACHER_USERNAME || 'faculty',
  teacherPassword: process.env.TEACHER_PASSWORD || 'faculty123',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-in-production',
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, ''),
};

if (!process.env.JWT_SECRET) {
  console.warn('[config] Using default JWT_SECRET and teacher login (faculty / faculty123). Fine for testing; change before deploying.');
}
