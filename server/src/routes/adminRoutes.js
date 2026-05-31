import express from 'express';
import { 
  getDashboardAnalytics, 
  getUsers, 
  toggleUserStatus, 
  getAllBookings,
  addBus,
  editBus,
  deleteBus,
  addRoute,
  editRoute,
  deleteRoute,
  addSchedule,
  editSchedule,
  deleteSchedule
} from '../controllers/adminController.js';
import { authenticateJWT, requireRole } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);
router.use(requireRole('ADMIN'));

// Analytics Dashboard
router.get('/dashboard', getDashboardAnalytics);

// User management
router.get('/users', getUsers);
router.put('/users/:id/status', toggleUserStatus);

// Booking search & view
router.get('/bookings', getAllBookings);

// Bus management
router.post('/buses', addBus);
router.put('/buses/:id', editBus);
router.delete('/buses/:id', deleteBus);

// Route management
router.post('/routes', addRoute);
router.put('/routes/:id', editRoute);
router.delete('/routes/:id', deleteRoute);

// Schedule management
router.post('/schedules', addSchedule);
router.put('/schedules/:id', editSchedule);
router.delete('/schedules/:id', deleteSchedule);

export default router;
