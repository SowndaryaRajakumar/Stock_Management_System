import jwt from 'jsonwebtoken';

/**
 * Generate signed JWT
 * Payload contains userId, id (alias), username, role
 * @param {object} payload - { userId, username, role, id }
 * @returns {string} Signed JWT
 */
export const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  // Normalize payload
  const tokenData = {
    userId: payload.userId || payload.id,
    id: payload.userId || payload.id,
    username: payload.username,
    role: payload.role ? payload.role.toUpperCase() : 'FACULTY'
  };

  return jwt.sign(tokenData, secret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token
 * @returns {object} Decoded token payload
 */
export const verifyJwtToken = (token) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined.');
  }
  return jwt.verify(token, secret);
};

export default {
  generateToken,
  verifyJwtToken
};
