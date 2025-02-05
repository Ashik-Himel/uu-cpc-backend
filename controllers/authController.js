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
      verified: false,
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
      phone: req.user?.phone,
      role: req.user?.role,
      avatar: req.user?.avatar,
      verified: req.user?.verified,
    };
    return res.status(200).json({ ok: true, user });
  } catch (error) {
    return next(error);
  }
};

export const verifyProfileRequest = async (req, res, next) => {
  try {
    const token = jwt.sign({ _id: req.user?._id, email: req.user?.email }, jwtSecret, {
      expiresIn: '1h',
    });
    const verifyLink = `${clientDomain}/verification-status?token=${token}`;

    await sendEmail({
      to: req?.user?.email,
      subject: 'Profile Verification Request - UU CPC',
      html: `
        <h3>You have requested to verify your UU CPC account</h3>
        <p>Click the link below to verify your account</p>
        <a href="${verifyLink}">Verify Profile</a>
        <p>This link is valid for one hour.</p>
        <br />
        <p>Best Regards,</p>
        <p>UU CPC</p>
      `,
    });

    return res
      .status(200)
      .json({ ok: true, message: 'Verification email sent to your email address' });
  } catch (error) {
    return next(error);
  }
};

export const verifyProfile = async (req, res, next) => {
  try {
    const db = getDB();
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ ok: false, message: 'Your link is invalid' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded?._id) });

    if (user?.verified) {
      return res.status(400).json({ ok: false, message: 'Profile already verified' });
    }

    await db
      .collection('users')
      .updateOne({ _id: new ObjectId(decoded?._id) }, { $set: { verified: true } });

    return res.status(200).json({ ok: true, message: 'Profile verified successfully' });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ ok: false, message: 'Link expired or invalid' });
    }
    return next(error);
  }
};

export const updateProfileIfo = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, email, phone, studentId, batch, section } = req.body;

    if (req.user?.email !== email) {
      return res.status(401).json({ ok: false, message: 'Unauthorized access' });
    }

    const updatedUser = {
      $set: {
        name,
        phone,
        studentId,
        batch,
        section,
      },
    };
    await db.collection('users').updateOne({ _id: new ObjectId(req.user?._id) }, updatedUser);

    return res.status(200).json({ ok: true, message: 'Profile updated successfully' });
  } catch (error) {
    return next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const db = getDB();
    const { password, newPassword, reTypedPassword } = req.body;

    const isMatch = await bcrypt.compare(password, req.user?.password);
    if (!isMatch) {
      return res.status(401).json({ ok: false, message: 'Current password is invalid' });
    }
    if (newPassword !== reTypedPassword) {
      return res.status(400).json({ ok: false, message: 'New passwords do not match' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db
      .collection('users')
      .updateOne({ _id: new ObjectId(req.user?._id) }, { $set: { password: hashedPassword } });

    return res.status(200).json({ ok: true, message: 'Password updated successfully' });
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

    const token = jwt.sign({ _id: user?._id, email: user?.email }, jwtSecret, {
      expiresIn: '1h',
    });
    const resetLink = `${clientDomain}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Password - UU CPC',
      html: `
        <h3>You requested to reset your UU CPC account's password</h3>
        <p>Click the link below to reset the password</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link is valid for one hour.</p>
        <br />
        <p>Best Regards,</p>
        <p>UU CPC</p>
      `,
    });

    return res.status(200).json({ ok: true, message: 'Password reset link sent to your email' });
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
      return res.status(400).json({ ok: false, message: 'Your link is invalid' });
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
      return res.status(400).json({ ok: false, message: 'Link expired or invalid' });
    }
    return next(error);
  }
};
