import express from 'express';
import { getFeedbacks, postFeedback } from '../controllers/feedbackController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/member', authorizeUser, getFeedbacks);
router.post('/', authorizeUser, postFeedback);

export default router;
