const getTransporter = require('../config/email');

const BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const EMAIL_FROM = process.env.EMAIL_FROM || 'College Platform <noreply@college.edu>';
const SKIP_EMAIL = process.env.DEV_SKIP_EMAIL_VERIFY === 'true';

/**
 * Send email verification link.
 * In dev mode (DEV_SKIP_EMAIL_VERIFY=true) this is a no-op.
 */
const sendVerificationEmail = async (user, rawToken) => {
  if (SKIP_EMAIL) {
    console.log(`[DEV] Skipping verification email for ${user.email}`);
    return;
  }

  const verifyUrl = `${BASE_URL}/verify-email?token=${rawToken}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: user.email,
    subject: 'Verify your College Platform account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: auto; background: #18181b; color: #fafafa; border-radius: 12px; padding: 40px; border: 1px solid #27272a;">
        <h2 style="color: #8b5cf6; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #a1a1aa; margin-bottom: 24px;">Hi ${user.fullName}, click the button below to verify your account.</p>
        <a href="${verifyUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify Email</a>
        <p style="color: #71717a; font-size: 12px; margin-top: 24px;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
      </div>
    `,
  });
};

/**
 * Send password reset email (reserved for later).
 */
const sendPasswordResetEmail = async (user, rawToken) => {
  if (SKIP_EMAIL) return;

  const resetUrl = `${BASE_URL}/reset-password?token=${rawToken}`;
  const transporter = getTransporter();

  await transporter.sendMail({
    from: EMAIL_FROM,
    to: user.email,
    subject: 'Reset your College Platform password',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 560px; margin: auto; background: #18181b; color: #fafafa; border-radius: 12px; padding: 40px; border: 1px solid #27272a;">
        <h2 style="color: #8b5cf6; margin-bottom: 8px;">Reset your password</h2>
        <p style="color: #a1a1aa; margin-bottom: 24px;">Hi ${user.fullName}, click below to reset your password.</p>
        <a href="${resetUrl}" style="display: inline-block; background: #7c3aed; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
        <p style="color: #71717a; font-size: 12px; margin-top: 24px;">This link expires in 1 hour.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
