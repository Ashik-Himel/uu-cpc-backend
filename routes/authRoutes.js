/* eslint-disable object-curly-newline */
import express from 'express';
import {
  forgotPassword,
  getUser,
  login,
  register,
  resetPassword,
} from '../controllers/authController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authorizeUser, getUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

export default router;
