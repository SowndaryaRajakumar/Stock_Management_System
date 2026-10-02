import bcrypt from 'bcryptjs';

/**
 * Hash plain text password using bcryptjs
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export const hashPassword = async (plainPassword) => {
  if (!plainPassword) {
    throw new Error('Password must be provided for hashing');
  }
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
};

/**
 * Compare plain text password against bcrypt hash
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
export const comparePassword = async (plainPassword, hashedPassword) => {
  if (!plainPassword || !hashedPassword) {
    return false;
  }
  // Backwards compatibility fallback if legacy hash matches directly
  if (plainPassword === hashedPassword) {
    return true;
  }
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    return false;
  }
};

export default {
  hashPassword,
  comparePassword
};
