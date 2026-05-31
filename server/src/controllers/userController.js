import bcrypt from 'bcryptjs';
import prisma from '../config/db.js';

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        uuid: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ message: 'Full name and phone number are required.' });
    }

    // Check phone uniqueness excluding current user
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone,
        NOT: { id: req.user.id }
      }
    });

    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number is already in use.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { fullName, phone },
      select: {
        id: true,
        uuid: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_PROFILE_UPDATE',
        userId: req.user.id,
        details: `Updated profile details.`
      }
    });

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: 'All password fields are required.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: 'New passwords do not match.' });
    }

    // Validate new password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters, and contain uppercase, lowercase, numbers, and special characters.'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'USER_PASSWORD_CHANGE',
        userId: req.user.id,
        details: `Changed password.`
      }
    });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET upcoming bookings: schedule departure date/time is in the future
export const getMyBookings = async (req, res) => {
  try {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    
    // Find all bookings for this user where departure date is today or later
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id,
        bookingStatus: 'CONFIRMED',
        schedule: {
          departureDate: {
            gte: todayUTC
          }
        }
      },
      include: {
        schedule: {
          include: {
            bus: true,
            route: true
          }
        },
        passengers: true,
        payment: true
      },
      orderBy: {
        schedule: {
          departureDate: 'asc'
        }
      }
    });

    // Filter out today's bookings that are in the past time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dateStr}`;
    const currentHrs = now.getHours();
    const currentMins = now.getMinutes();

    const upcomingBookings = bookings.filter(booking => {
      const depDate = booking.schedule.departureDate;
      const depYear = depDate.getUTCFullYear();
      const depMonth = String(depDate.getUTCMonth() + 1).padStart(2, '0');
      const depDay = String(depDate.getUTCDate()).padStart(2, '0');
      const depDateStr = `${depYear}-${depMonth}-${depDay}`;

      if (depDateStr === todayStr) {
        const [depH, depM] = booking.schedule.departureTime.split(':').map(Number);
        if (depH < currentHrs || (depH === currentHrs && depM <= currentMins)) {
          return false; // already departed today
        }
      }
      return true;
    });

    return res.status(200).json(upcomingBookings);
  } catch (error) {
    console.error('Get my bookings error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// GET past/completed bookings
export const getMyHistory = async (req, res) => {
  try {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Bookings that are:
    // 1. CANCELLED (regardless of travel date)
    // 2. CONFIRMED but travel date is today or has passed
    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id,
        OR: [
          { bookingStatus: 'CANCELLED' },
          {
            bookingStatus: 'CONFIRMED',
            schedule: {
              departureDate: {
                lte: todayUTC
              }
            }
          }
        ]
      },
      include: {
        schedule: {
          include: {
            bus: true,
            route: true
          }
        },
        passengers: true,
        payment: true
      },
      orderBy: {
        bookedAt: 'desc'
      }
    });

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dateStr}`;
    const currentHrs = now.getHours();
    const currentMins = now.getMinutes();

    const historyBookings = bookings.filter(booking => {
      if (booking.bookingStatus === 'CANCELLED') return true;
      
      const depDate = booking.schedule.departureDate;
      const depYear = depDate.getUTCFullYear();
      const depMonth = String(depDate.getUTCMonth() + 1).padStart(2, '0');
      const depDay = String(depDate.getUTCDate()).padStart(2, '0');
      const depDateStr = `${depYear}-${depMonth}-${depDay}`;

      if (depDateStr === todayStr) {
        const [depH, depM] = booking.schedule.departureTime.split(':').map(Number);
        // If departed, it goes to history
        return depH < currentHrs || (depH === currentHrs && depM <= currentMins);
      }
      return true; // past days are definitely history
    });

    return res.status(200).json(historyBookings);
  } catch (error) {
    console.error('Get my history error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Favorites
export const getFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favoriteRoute.findMany({
      where: { userId: req.user.id },
      include: { route: true }
    });
    return res.status(200).json(favorites.map(f => f.route));
  } catch (error) {
    console.error('Get favorites error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { routeId } = req.body;
    if (!routeId) return res.status(400).json({ message: 'Route ID is required.' });

    const fav = await prisma.favoriteRoute.create({
      data: {
        userId: req.user.id,
        routeId: parseInt(routeId)
      },
      include: { route: true }
    });

    return res.status(201).json({ message: 'Route added to favorites.', route: fav.route });
  } catch (error) {
    console.error('Add favorite error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { routeId } = req.params;
    
    await prisma.favoriteRoute.delete({
      where: {
        userId_routeId: {
          userId: req.user.id,
          routeId: parseInt(routeId)
        }
      }
    });

    return res.status(200).json({ message: 'Route removed from favorites.' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Search History
export const getSearchHistory = async (req, res) => {
  try {
    const history = await prisma.searchHistory.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    return res.status(200).json(history);
  } catch (error) {
    console.error('Get search history error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const logSearch = async (req, res) => {
  try {
    const { sourceCity, destinationCity } = req.body;
    if (!sourceCity || !destinationCity) {
      return res.status(400).json({ message: 'Source and destination cities are required.' });
    }

    const log = await prisma.searchHistory.create({
      data: {
        userId: req.user.id,
        sourceCity,
        destinationCity
      }
    });

    return res.status(201).json(log);
  } catch (error) {
    console.error('Log search error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Recently Viewed
export const getRecentlyViewed = async (req, res) => {
  try {
    const viewed = await prisma.recentlyViewed.findMany({
      where: { userId: req.user.id },
      include: { bus: true },
      orderBy: { viewedAt: 'desc' },
      take: 5
    });
    return res.status(200).json(viewed.map(v => v.bus));
  } catch (error) {
    console.error('Get recently viewed error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const logRecentlyViewed = async (req, res) => {
  try {
    const { busId } = req.body;
    if (!busId) return res.status(400).json({ message: 'Bus ID is required.' });

    const log = await prisma.recentlyViewed.upsert({
      where: {
        userId_busId: {
          userId: req.user.id,
          busId: parseInt(busId)
        }
      },
      update: { viewedAt: new Date() },
      create: {
        userId: req.user.id,
        busId: parseInt(busId)
      }
    });

    return res.status(200).json(log);
  } catch (error) {
    console.error('Log recently viewed error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// Add Reviews
export const addReview = async (req, res) => {
  try {
    const { scheduleId, rating, comment } = req.body;

    if (!scheduleId || !rating || !comment) {
      return res.status(400).json({ message: 'Schedule ID, rating, and comment are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    // Verify if journey is completed
    const schedule = await prisma.schedule.findUnique({ where: { id: parseInt(scheduleId) } });
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

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

    const isPast = travelDateStr < todayStr;
    
    if (!isPast) {
      return res.status(400).json({ message: 'You can only review completed journeys.' });
    }

    const review = await prisma.review.create({
      data: {
        userId: req.user.id,
        scheduleId: parseInt(scheduleId),
        rating: parseInt(rating),
        comment
      }
    });

    return res.status(201).json({ message: 'Review added successfully.', review });
  } catch (error) {
    console.error('Add review error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
