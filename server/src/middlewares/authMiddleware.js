import { verifyAccessToken } from '../utils/token.js';
import prisma from '../config/db.js';

export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required.' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyAccessToken(token);

  if (!payload) {
    return res.status(401).json({ message: 'Invalid or expired access token.' });
  }

  try {
    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return res.status(401).json({ message: 'User does not exist.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been disabled.' });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      role: user.role,
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    const hasRole = Array.isArray(roles) 
      ? roles.includes(req.user.role) 
      : req.user.role === roles;

    if (!hasRole) {
      return res.status(403).json({ message: 'Access denied. Insufficient privileges.' });
    }

    next();
  };
};
