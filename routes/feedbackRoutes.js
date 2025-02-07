import express from 'express';
import { postFeedback } from '../controllers/feedbackController.js';
import { authorizeUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/', authorizeUser, postFeedback);

export default router;
