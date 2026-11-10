import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => console.log(`ExamPrep API running on http://localhost:${env.port}`));
