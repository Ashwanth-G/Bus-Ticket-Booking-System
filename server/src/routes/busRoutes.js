import express from 'express';
import prisma from '../config/db.js';

const router = express.Router();

// Public list of all buses
router.get('/', async (req, res) => {
  try {
    const buses = await prisma.bus.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(buses);
  } catch (error) {
    console.error('Fetch buses error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

export default router;
