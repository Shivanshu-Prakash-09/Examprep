import cors from 'cors';
import express from 'express';
import { UPLOAD_DIR } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use('/files', express.static(UPLOAD_DIR));   // uploaded papers/notes (opened by the AI bot)
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
