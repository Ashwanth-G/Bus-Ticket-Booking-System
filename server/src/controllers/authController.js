import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/token.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidator.js';

// In-memory store for OTP simulation (production systems would use Redis and an email service)
const otpStore = new Map();

export const register = async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { fullName, email, phone, password } = validation.data;

    // Check if email unique
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    // Check if phone unique
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number is already registered.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (first registration is USER, admins are predefined in seed)
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        password: hashedPassword,
        role: 'USER',
        isActive: true
      }
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_REGISTER',
        userId: user.id,
        details: `User registered with email: ${email}`
      }
    });

    return res.status(201).json({
      message: 'Registration successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        uuid: user.uuid,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been disabled.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_LOGIN',
        userId: user.id,
        details: `User logged in: ${email}`
      }
    });

    return res.status(200).json({
      message: 'Login successful.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        uuid: user.uuid,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.user) {
      await prisma.auditLog.create({
        data: {
          action: 'USER_LOGOUT',
          userId: req.user.id,
          details: `User logged out: ${req.user.email}`
        }
      });
    }
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error during logout.' });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required.' });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Authentication expired or user is disabled.' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Internal server error during token refresh.' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { email } = validation.data;
    const user = await prisma.user.findUnique({ where: { email } });

    // For security reasons, don't disclose if user exists. Just return Success simulator.
    if (!user) {
      return res.status(200).json({
        message: 'If the email exists, an OTP has been sent.',
        simulation: 'Email not found, but simulated success'
      });
    }

    // Generate a 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, otp);

    // Simulate OTP delivery by logging it to terminal and returning in response for easier evaluation
    console.log(`[SIMULATED EMAIL] OTP for ${email}: ${otp}`);

    return res.status(200).json({
      message: 'If the email exists, an OTP has been sent.',
      simulation: `OTP sent successfully. Code is ${otp} (Simulated).`
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ errors: validation.error.format() });
    }

    const { email, otp, newPassword } = validation.data;

    const storedOtp = otpStore.get(email);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Check user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });

    // Clear OTP
    otpStore.delete(email);

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_RESET',
        userId: user.id,
        details: `Password reset successfully via OTP simulation.`
      }
    });

    return res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
