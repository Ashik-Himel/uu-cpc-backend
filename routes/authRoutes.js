/* eslint-disable object-curly-newline */
import express from 'express';
import multer from 'multer';
import {
  forgotPassword,
  getUser,
  login,
  register,
  resetPassword,
  updateAvatar,
  updatePassword,
  updateProfileIfo,
  verifyProfile,
  verifyProfileRequest,
} from '../controllers/authController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/user', authorizeUser, getUser);
router.get('/verify-profile', authorizeUser, verifyProfileRequest);
router.put('/verify-profile', verifyProfile);
router.put('/update-profile', authorizeUser, updateProfileIfo);
router.put('/update-password', authorizeUser, updatePassword);
router.put('/update-avatar', authorizeUser, upload.single('avatar'), updateAvatar);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password', resetPassword);

export default router;
