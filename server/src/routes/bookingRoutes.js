import express from 'express';
import { createBooking, cancelBooking, downloadTicketPDF } from '../controllers/bookingController.js';
import { authenticateJWT } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authenticateJWT);

router.post('/create', createBooking);
router.post('/cancel', cancelBooking);
router.get('/:id/pdf', downloadTicketPDF);

export default router;
