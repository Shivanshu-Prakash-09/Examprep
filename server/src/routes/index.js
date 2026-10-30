import { Router } from 'express';
import authRoutes from './authRoutes.js';
import historyRoutes from './historyRoutes.js';
import resourceRoutes from './resourceRoutes.js';
import subjectRoutes from './subjectRoutes.js';

const router = Router();
router.get('/health', (_req, res) => res.json({ ok: true }));
router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/resources', resourceRoutes);
router.use('/history', historyRoutes);
export default router;
