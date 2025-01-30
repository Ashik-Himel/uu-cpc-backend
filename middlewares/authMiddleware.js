import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../configs/db.js';
import { jwtSecret } from '../configs/variables.js';

export const authorizeUser = async (req, res, next) => {
  try {
    const db = getDB();
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ ok: false, message: 'Unauthorized access' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded?._id) });

    if (!user) {
      res.clearCookie('token');
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.clearCookie('token');
      return res.status(401).json({ ok: false, message: 'Invalid token' });
    }
    return next(error);
  }
};

export const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ ok: false, message: 'Admin access required' });
  }
  return next();
};

export const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'super-admin') {
    return res.status(403).json({ ok: false, message: 'Super admin access required' });
  }
  return next();
};
