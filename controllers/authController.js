/* eslint-disable object-curly-newline */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../configs/db.js';
import sendEmail from '../configs/email.js';
import redisClient from '../configs/redisClient.js';
import { clientDomain, jwtSecret } from '../configs/variables.js';

export const register = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, studentId, batch, section, email, password } = req.body;

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(409).json({ ok: false, message: 'User already exists' });
    }

    const newUser = {
      name,
      studentId,
      batch,
      section,
      email,
      password: await bcrypt.hash(password, 10),
      role: 'member',
    };

    const result = await db.collection('users').insertOne(newUser);
    const token = jwt.sign({ _id: result.insertedId, email }, jwtSecret, {
      expiresIn: '7d',
    });

    return res.status(201).json({
      ok: true,
      message: 'User registered successfully',
      userRole: 'member',
      token,
    });
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const db = getDB();
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    }

    const { _id, role } = user;
    const token = jwt.sign({ _id, email }, jwtSecret, {
      expiresIn: '7d',
    });

    return res.status(200).json({
      ok: true,
      message: 'Logged in successfully',
      userRole: role,
      token,
    });
  } catch (error) {
    return next(error);
  }
};

export const getUser = (req, res, next) => {
  try {
    const user = {
      _id: req.user?._id,
      name: req.user?.name,
      studentId: req.user?.studentId,
      batch: req.user?.batch,
      section: req.user?.section,
      email: req.user?.email,
      role: req.user?.role,
      avatar: req.user?.avatar,
    };
    return res.status(200).json({ ok: true, user });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ email: req.body?.email });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    res.status(200).json({ ok: true, message: 'Password reset link sent to your email' });

    const token = jwt.sign({ _id: user?._id, email: user?.email }, jwtSecret, {
      expiresIn: '1h',
    });
    const resetLink = `${clientDomain}/reset-password?token=${token}`;

    return await sendEmail({
      to: user.email,
      subject: 'Reset Password - UU CPC',
      html: `
        <h3>You requested to reset your UU CPC account's password</h3>
        <p>Click the link below to reset the password</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link is valid for one hour.</p>
      `,
    });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const { token } = req.query;
    const { newPassword, reTypedPassword } = req.body;

    if (!token) {
      return res.status(400).json({ ok: false, message: 'Token missing' });
    }
    if (newPassword !== reTypedPassword) {
      return res.status(400).json({ ok: false, message: 'Passwords do not match' });
    }

    const isTokenUsed = await redisClient.get(`used_token:${token}`);
    if (isTokenUsed) {
      return res.status(400).json({ ok: false, message: 'Token has already been used' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded?._id) });

    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db
      .collection('users')
      .updateOne({ _id: new ObjectId(decoded?._id) }, { $set: { password: hash } });

    await redisClient.set(`used_token:${token}`, 'true', 'EX', 3600);

    return res.status(200).json({ ok: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ ok: false, message: 'Token expired or invalid' });
    }
    return next(error);
  }
};
