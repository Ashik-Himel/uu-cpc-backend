import express from 'express';
import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  verifyLogin,
} from '../controllers/authController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/verify-login', verifyLogin);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/logout', authorizeUser, logout);

export default router;
