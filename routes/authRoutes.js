/* eslint-disable object-curly-newline */
import express from 'express';
import {
  forgotPassword,
  getUser,
  login,
  register,
  resetPassword,
  updatePassword,
  updateProfileIfo,
  verifyProfile,
  verifyProfileRequest,
} from '../controllers/authController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authorizeUser, getUser);
router.get('/verify-profile', authorizeUser, verifyProfileRequest);
router.put('/verify-profile', verifyProfile);
router.put('/update-profile', authorizeUser, updateProfileIfo);
router.put('/update-password', authorizeUser, updatePassword);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

export default router;
