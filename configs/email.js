import nodemailer from 'nodemailer';
import { adminEmail, nodemailerEmail, nodemailerPassword } from './variables.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: nodemailerEmail,
    pass: nodemailerPassword,
  },
});

// eslint-disable-next-line object-curly-newline
export default async function sendEmail({ to, subject, html, attachments }) {
  const mailOptions = {
    from: `UU CPC <${adminEmail}>`,
    to,
    subject,
    html,
    attachments,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
