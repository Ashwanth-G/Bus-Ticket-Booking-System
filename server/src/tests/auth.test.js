import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../app.js';

// Mock Prisma Client
jest.unstable_mockModule('../config/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    }
  }
}));

const db = (await import('../config/db.js')).default;

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'John Doe',
          email: 'invalid-email',
          phone: '9876543210',
          password: 'Password@123',
          confirmPassword: 'Password@123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    it('should reject registration with mismatching passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
          password: 'Password@123',
          confirmPassword: 'Password@321'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors.confirmPassword).toBeDefined();
    });

    it('should reject registration if email is already in use', async () => {
      db.user.findUnique.mockResolvedValue({ id: 1, email: 'john@example.com' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'John Doe',
          email: 'john@example.com',
          phone: '9876543210',
          password: 'Password@123',
          confirmPassword: 'Password@123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('Email is already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate login fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notanemail'
        });

      expect(res.statusCode).toBe(400);
    });

    it('should reject inactive users', async () => {
      db.user.findUnique.mockResolvedValue({
        id: 2,
        email: 'disabled@example.com',
        isActive: false,
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'disabled@example.com',
          password: 'Password@123'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('disabled');
    });
  });
});
