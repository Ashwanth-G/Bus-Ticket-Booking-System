import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'smartbus_super_secret_access_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'smartbus_super_secret_refresh_key_2026';

export const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, uuid: user.uuid, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

export const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id, uuid: user.uuid, email: user.email, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};
