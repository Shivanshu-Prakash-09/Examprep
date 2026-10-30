import { Router } from 'express';
import * as subjects from '../controllers/subjectController.js';
import { listResources } from '../controllers/resourceController.js';
import { optionalStudent, requireTeacher } from '../middleware/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

const router = Router();
router.get('/', h(subjects.listSubjects));
router.get('/search', h(subjects.searchSubjects));      // must stay above "/:id"
router.post('/match', h(subjects.matchSyllabus));
router.post('/', requireTeacher, h(subjects.createSubject));
router.get('/:id', h(subjects.getSubject));
router.get('/:subjectId/resources', optionalStudent, h(listResources));
export default router;
