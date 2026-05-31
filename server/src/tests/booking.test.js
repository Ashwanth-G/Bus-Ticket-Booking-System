import { jest } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock Prisma - must be defined before importing app.js
jest.unstable_mockModule('../config/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      aggregate: jest.fn(),
    },
    schedule: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    bus: {
      count: jest.fn(),
    },
    route: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    payment: {
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(db)),
  }
}));

const db = (await import('../config/db.js')).default;
const app = (await import('../app.js')).default;

const JWT_SECRET = process.env.JWT_SECRET || 'smartbus_super_secret_access_key_2026';

describe('Booking & Isolation API', () => {
  let userToken;
  let anotherUserToken;
  let adminToken;

  beforeAll(() => {
    userToken = jwt.sign({ id: 1, email: 'john@example.com', role: 'USER' }, JWT_SECRET);
    anotherUserToken = jwt.sign({ id: 2, email: 'jane@example.com', role: 'USER' }, JWT_SECRET);
    adminToken = jwt.sign({ id: 3, email: 'admin@smartbus.com', role: 'ADMIN' }, JWT_SECRET);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Isolation - Booking Cancellation', () => {
    it('should prevent User B from cancelling User A booking', async () => {
      // Mock db.user lookup in authMiddleware
      db.user.findUnique.mockResolvedValue({ id: 2, email: 'jane@example.com', role: 'USER', isActive: true });
      
      // Mock findUnique booking showing owner is user ID 1
      db.booking.findUnique.mockResolvedValue({
        id: 10,
        bookingReference: 'SBP-2026-00010',
        userId: 1, // Owned by John Doe
        bookingStatus: 'CONFIRMED',
        passengers: [{ id: 1, passengerName: 'John', seatNumber: 5 }],
        schedule: { departureDate: new Date('2026-12-01'), departureTime: '10:00' }
      });

      const res = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${anotherUserToken}`) // Jane Smith
        .send({ bookingId: 10 });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should allow Admin to perform actions if needed, or allow owner to cancel', async () => {
      db.user.findUnique.mockResolvedValue({ id: 1, email: 'john@example.com', role: 'USER', isActive: true });
      db.booking.findUnique.mockResolvedValue({
        id: 10,
        bookingReference: 'SBP-2026-00010',
        userId: 1, // Owned by John Doe
        bookingStatus: 'CONFIRMED',
        passengers: [{ id: 1, passengerName: 'John', seatNumber: 5 }],
        schedule: { departureDate: new Date('2026-12-01'), departureTime: '10:00' }
      });

      const res = await request(app)
        .post('/api/bookings/cancel')
        .set('Authorization', `Bearer ${userToken}`) // John Doe
        .send({ bookingId: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain('cancelled');
    });
  });

  describe('Admin Authorization', () => {
    it('should reject standard users from accessing admin routes', async () => {
      db.user.findUnique.mockResolvedValue({ id: 1, email: 'john@example.com', role: 'USER', isActive: true });

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Access denied');
    });

    it('should allow admin users to access admin routes', async () => {
      db.user.findUnique.mockResolvedValue({ id: 3, email: 'admin@smartbus.com', role: 'ADMIN', isActive: true });
      db.booking.count.mockResolvedValue(10);
      db.bus.count = jest.fn().mockResolvedValue(5);
      db.route.count = jest.fn().mockResolvedValue(8);
      db.booking.aggregate.mockResolvedValue({ _sum: { totalFare: 5000 } });
      db.booking.findMany.mockResolvedValue([]);
      db.route.findMany.mockResolvedValue([]);
      db.schedule.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.stats).toBeDefined();
    });
  });
});
