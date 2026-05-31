import express from 'express';
import { searchSchedules, getScheduleById } from '../controllers/scheduleController.js';
import prisma from '../config/db.js';

const router = express.Router();

// Public list of all schedules (used by admin portal lists)
router.get('/all', async (req, res) => {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        bus: true,
        route: true
      },
      orderBy: { departureDate: 'asc' }
    });
    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Fetch all schedules error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/', searchSchedules);
router.get('/:id', getScheduleById);

export default router;
