import express from 'express';
import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
} from '../controllers/authController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.get('/logout', authorizeUser, logout);

export default router;
