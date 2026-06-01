import prisma from '../config/db.js';
import { getSocketIO } from '../sockets/socket.js';

export const createBooking = async (req, res) => {
  try {
    const { scheduleId, passengers, paymentMethod } = req.body;

    if (!scheduleId || !passengers || !Array.isArray(passengers) || passengers.length === 0 || !paymentMethod) {
      return res.status(400).json({ message: 'Schedule ID, passenger list, and payment method are required.' });
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(scheduleId) },
      include: {
        bus: true,
        route: true
      }
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    // 1. Validation: Travel date cannot be in the past
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dateStr}`;

    const depDate = schedule.departureDate;
    const depYear = depDate.getUTCFullYear();
    const depMonth = String(depDate.getUTCMonth() + 1).padStart(2, '0');
    const depDay = String(depDate.getUTCDate()).padStart(2, '0');
    const travelDateStr = `${depYear}-${depMonth}-${depDay}`;

    if (travelDateStr < todayStr) {
      return res.status(400).json({ message: 'Cannot book a journey in the past.' });
    }

    if (travelDateStr === todayStr) {
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();
      const [depH, depM] = schedule.departureTime.split(':').map(Number);

      if (depH < currentHrs || (depH === currentHrs && depM <= currentMins)) {
        return res.status(400).json({ message: 'This bus has already departed.' });
      }
    }

    // 2. Transaction for Seat Booking & Seat Availability check
    const seatSelection = passengers.map(p => parseInt(p.seatNumber));
    if (seatSelection.some(seat => seat < 1 || seat > schedule.bus.totalSeats)) {
      return res.status(400).json({ message: `Seats must be between 1 and ${schedule.bus.totalSeats}.` });
    }

    // Run transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find all booked seats for this schedule
      const existingBookings = await tx.booking.findMany({
        where: {
          scheduleId: schedule.id,
          bookingStatus: 'CONFIRMED'
        },
        include: {
          passengers: true
        }
      });

      const bookedSeats = new Set();
      existingBookings.forEach(b => {
        b.passengers.forEach(p => bookedSeats.add(p.seatNumber));
      });

      // Check for overlap
      for (const seat of seatSelection) {
        if (bookedSeats.has(seat)) {
          throw new Error(`Seat number ${seat} is already booked.`);
        }
      }

      // Generate reference: SBP-2026-XXXXX
      const count = await tx.booking.count();
      const refNum = String(count + 1).padStart(5, '0');
      const bookingReference = `SBP-${now.getFullYear()}-${refNum}`;

      const totalFare = schedule.fare * passengers.length;

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          bookingReference,
          userId: req.user.id,
          scheduleId: schedule.id,
          bookingStatus: 'CONFIRMED',
          totalFare,
          passengers: {
            create: passengers.map(p => ({
              passengerName: p.passengerName,
              passengerPhone: p.passengerPhone,
              seatNumber: parseInt(p.seatNumber)
            }))
          },
          payment: {
            create: {
              amount: totalFare,
              paymentMethod,
              paymentStatus: 'PAID',
              transactionId: `TXN-${now.getTime()}-${Math.floor(1000 + Math.random() * 9000)}`
            }
          }
        },
        include: {
          passengers: true,
          payment: true
        }
      });

      // Update Schedule available seats
      await tx.schedule.update({
        where: { id: schedule.id },
        data: {
          availableSeats: {
            decrement: passengers.length
          }
        }
      });

      return booking;
    });

    // 3. Emit live seat updates via Socket.IO
    const io = getSocketIO();
    if (io) {
      // Fetch all booked seats for the schedule to send updated state
      const allBookings = await prisma.booking.findMany({
        where: { scheduleId: schedule.id, bookingStatus: 'CONFIRMED' },
        include: { passengers: true }
      });
      const allBookedSeats = [];
      allBookings.forEach(b => b.passengers.forEach(p => allBookedSeats.push(p.seatNumber)));
      
      io.emit('seatStatusUpdated', {
        scheduleId: schedule.id,
        bookedSeats: allBookedSeats
      });
    }

    // 4. Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_CREATE',
        userId: req.user.id,
        details: `Booking created. Reference: ${result.bookingReference}, Schedule: ${scheduleId}, Seats: ${seatSelection.join(', ')}`
      }
    });

    return res.status(201).json({
      message: 'Booking completed successfully.',
      booking: result
    });
  } catch (error) {
    console.error('Create booking error:', error.message);
    if (error.message.includes('already booked')) {
      return res.status(400).json({ message: error.message });
    }
    return res.status(500).json({ message: 'Internal server error during booking.' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(bookingId) },
      include: {
        passengers: true,
        schedule: {
          include: { bus: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Security check: User Isolation
    if (booking.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied. You cannot cancel this booking.' });
    }

    if (booking.bookingStatus === 'CANCELLED') {
      return res.status(400).json({ message: 'Booking is already cancelled.' });
    }

    // Validation: Cannot cancel past journeys
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dateStr}`;

    const depDate = booking.schedule.departureDate;
    const depYear = depDate.getUTCFullYear();
    const depMonth = String(depDate.getUTCMonth() + 1).padStart(2, '0');
    const depDay = String(depDate.getUTCDate()).padStart(2, '0');
    const travelDateStr = `${depYear}-${depMonth}-${depDay}`;

    if (travelDateStr < todayStr) {
      return res.status(400).json({ message: 'Cannot cancel a past journey.' });
    }

    if (travelDateStr === todayStr) {
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();
      const [depH, depM] = booking.schedule.departureTime.split(':').map(Number);

      if (depH < currentHrs || (depH === currentHrs && depM <= currentMins)) {
        return res.status(400).json({ message: 'Cannot cancel a journey that has already departed.' });
      }
    }

    // Cancel booking inside transaction
    await prisma.$transaction(async (tx) => {
      // Set status to CANCELLED
      await tx.booking.update({
        where: { id: booking.id },
        data: { bookingStatus: 'CANCELLED' }
      });

      // Update payment status to REFUNDED
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: { paymentStatus: 'REFUNDED' }
      });

      // Increment Schedule available seats
      await tx.schedule.update({
        where: { id: booking.scheduleId },
        data: {
          availableSeats: {
            increment: booking.passengers.length
          }
        }
      });
    });

    // Socket.IO Emit live seat status update
    const io = getSocketIO();
    if (io) {
      const allBookings = await prisma.booking.findMany({
        where: { scheduleId: booking.scheduleId, bookingStatus: 'CONFIRMED' },
        include: { passengers: true }
      });
      const allBookedSeats = [];
      allBookings.forEach(b => b.passengers.forEach(p => allBookedSeats.push(p.seatNumber)));
      
      io.emit('seatStatusUpdated', {
        scheduleId: booking.scheduleId,
        bookedSeats: allBookedSeats
      });
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: 'BOOKING_CANCEL',
        userId: req.user.id,
        details: `Booking cancelled. Reference: ${booking.bookingReference}`
      }
    });

    return res.status(200).json({ message: 'Booking cancelled and refund processed successfully.' });
  } catch (error) {
    console.error('Cancel booking error:', error);
    return res.status(500).json({ message: 'Internal server error during cancellation.' });
  }
};

export const downloadTicketPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        passengers: true,
        schedule: {
          include: {
            bus: true,
            route: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Security check: User Isolation
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. You cannot access this ticket.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ticket-${booking.bookingReference}.pdf`);

    const { generateTicketPDF } = await import('../utils/pdf.js');
    await generateTicketPDF(booking, res);
  } catch (error) {
    console.error('Download PDF error:', error);
    return res.status(500).json({ message: 'Internal server error generating PDF.' });
  }
};
