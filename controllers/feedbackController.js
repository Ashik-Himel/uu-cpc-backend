import { getDB } from '../configs/db.js';

export const getFeedbacks = async (req, res, next) => {
  try {
    const db = getDB();
    const feedbacks = await db.collection('feedbacks').find({ userId: req.user._id }).toArray();
    return res.status(200).json({ ok: true, feedbacks });
  } catch (error) {
    return next(error);
  }
};

export const postFeedback = async (req, res, next) => {
  try {
    const db = getDB();
    const { type, subject, feedback } = req.body;
    const feedbackId = (await db.collection('feedbacks').countDocuments()) + 1;

    const newFeedback = {
      feedbackId,
      userId: req.user._id,
      type,
      subject,
      feedback,
      replies: [],
      createdAt: new Date(),
    };

    await db.collection('feedbacks').insertOne(newFeedback);
    return res.status(201).json({ ok: true, message: 'Feedback submitted successfully' });
  } catch (error) {
    return next(error);
  }
};
