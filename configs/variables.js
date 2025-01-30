import dotenv from 'dotenv';

dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });

export const port = process.env.PORT || 5000;
export const clientDomain = process.env.CLIENT_DOMAIN;
export const serverDomain = process.env.SERVER_DOMAIN;
export const mongoUri = process.env.MONGO_URI;
export const jwtSecret = process.env.JWT_SECRET;
export const redisURL = process.env.REDIS_URL;
export const adminEmail = process.env.ADMIN_EMAIL;
export const nodemailerEmail = process.env.NODEMAILER_EMAIL;
export const nodemailerPassword = process.env.NODEMAILER_PASSWORD;
