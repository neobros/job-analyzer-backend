import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';

export function normalizeEmail(email) {
  return validator.normalizeEmail(email || '', { gmail_remove_dots: false })?.toLowerCase();
}

export function assertStrongPassword(password) {
  const isStrong = validator.isStrongPassword(password || '', {
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1
  });

  if (!isStrong) {
    const error = new Error('Password must include 8+ characters with uppercase, lowercase, number, and symbol.');
    error.status = 400;
    throw error;
  }
}

export function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function hashValue(value) {
  return bcrypt.hash(value, 12);
}

export async function compareValue(value, hash) {
  return bcrypt.compare(value, hash);
}

export function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export function registrationFingerprint(req, email) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const agent = req.headers['user-agent'] || 'unknown';
  return `${email}:${ip}:${agent}`.slice(0, 240);
}
