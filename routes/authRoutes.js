import express from 'express';
import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.get('/logout', logout);

export default router;
