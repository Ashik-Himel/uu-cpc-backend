import express from 'express';
import {
  fetchUser,
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
router.get('/fetch-user', authorizeUser, fetchUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);
router.get('/logout', logout);

export default router;
