import { Router } from 'express';
import { studentLogin, teacherLogin } from '../controllers/authController.js';

export default Router().post('/teacher/login', teacherLogin).post('/student/login', studentLogin);
