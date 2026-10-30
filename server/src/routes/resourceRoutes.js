import { Router } from 'express';
import multer from 'multer';
import { createResource, deleteResource, downloadResource, toggleLike } from '../controllers/resourceController.js';
import { requireStudent, requireTeacher } from '../middleware/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { HttpError } from '../utils/httpError.js';

const ALLOWED = ['application/pdf', 'image/png', 'image/jpeg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'Only PDF, PNG, JPG or DOCX files are allowed')),
});

const router = Router();
router.post('/', requireTeacher, upload.single('file'), h(createResource));
router.get('/:id/download', h(downloadResource));
router.delete('/:id', requireTeacher, h(deleteResource));
router.post('/:id/like', requireStudent, h(toggleLike));
export default router;
