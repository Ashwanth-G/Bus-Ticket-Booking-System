import express from 'express';
import prisma from '../config/db.js';

const router = express.Router();

// Public list of all routes
router.get('/', async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(routes);
  } catch (error) {
    console.error('Fetch routes error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
