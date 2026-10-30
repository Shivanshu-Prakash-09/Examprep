import { Router } from 'express';
import { addHistory, listHistory } from '../controllers/historyController.js';
import { requireStudent } from '../middleware/auth.js';
import { asyncHandler as h } from '../utils/asyncHandler.js';

export default Router().get('/', requireStudent, h(listHistory)).post('/', requireStudent, h(addHistory));
