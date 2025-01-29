/* eslint-disable object-curly-newline */
/* eslint-disable consistent-return */
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getDB } from '../configs/db.js';
import sendEmail from '../configs/email.js';
import { clientDomain, jwtSecret } from '../configs/variables.js';

export const register = async (req, res, next) => {
  try {
    const db = getDB();
    const { name, studentId, batch, section, email, password } = req.body;

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
    const token = jwt.sign(
      { _id: result.insertedId, name, studentId, batch, section, email, role: 'member' },
      jwtSecret,
      { expiresIn: '7d' },
    );

    return res
      .cookie('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' ? 'true' : 'false',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: clientDomain,
        path: '/',
      })
      .status(201)
      .json({
        ok: true,
        message: 'User registered successfully',
        user: { _id: result.insertedId, name, studentId, batch, section, email, role: 'member' },
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

    const { _id, name, studentId, batch, section, role } = user;
    const token = jwt.sign({ _id, name, studentId, batch, section, email, role }, jwtSecret, {
      expiresIn: '7d',
    });
    console.log(`client domain: ${clientDomain}`);
    return res
      .cookie('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production' ? 'true' : 'false',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: clientDomain,
        path: '/',
      })
      .json({
        ok: true,
        message: 'Logged in successfully',
        user: { _id, name, studentId, batch, section, email, role },
      });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'User not found' });
    }
    res.status(200).json({ ok: true, message: 'Password reset link sent to your email' });

    const token = jwt.sign({ _id: user._id, email: user?.email }, jwtSecret, {
      expiresIn: '1h',
    });
    const resetLink = `${clientDomain}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset Password - UU CPC',
      html: `
        <h3>You requested a password reset</h3>
        <p>Click the link below to reset your password</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link is valid for one hour.</p>
      `,
    });
  } catch (error) {
    next(error);
  }
};

export async function resetPassword(req, res, next) {
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

    const decoded = jwt.verify(token, jwtSecret);
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded?._id) });
    if (!user) {
      return res.status(404).json({ ok: false, message: 'Invalid token or user not found' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await db
      .collection('users')
      .updateOne({ _id: new ObjectId(decoded?._id) }, { $set: { password: hash } });

    return res.status(200).json({ ok: true, message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(400).json({ ok: false, message: 'Token expired or invalid' });
    }
    return next(error);
  }
}

export function logout(req, res, next) {
  try {
    res.clearCookie('token').status(200).json({ ok: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}
