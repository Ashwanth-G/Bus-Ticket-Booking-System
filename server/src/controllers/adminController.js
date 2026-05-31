import prisma from '../config/db.js';

// 1. Dashboard Analytics Data
export const getDashboardAnalytics = async (req, res) => {
  try {
    // Aggregated stats
    const totalUsers = await prisma.user.count({ where: { role: 'USER' } });
    const totalBuses = await prisma.bus.count();
    const totalRoutes = await prisma.route.count();
    const totalBookings = await prisma.booking.count();

    const revenueResult = await prisma.booking.aggregate({
      where: { bookingStatus: 'CONFIRMED' },
      _sum: { totalFare: true }
    });
    const revenue = revenueResult._sum.totalFare || 0;

    // Monthly Revenue (Last 6 Months)
    const bookings = await prisma.booking.findMany({
      where: { bookingStatus: 'CONFIRMED' },
      select: { bookedAt: true, totalFare: true }
    });

    const monthlyRevenue = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 6 months with 0
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
      monthlyRevenue[label] = 0;
    }

    bookings.forEach(b => {
      const date = new Date(b.bookedAt);
      const label = `${months[date.getMonth()]} ${date.getFullYear()}`;
      if (monthlyRevenue[label] !== undefined) {
        monthlyRevenue[label] += b.totalFare;
      }
    });

    const monthlyRevenueChart = Object.keys(monthlyRevenue).map(key => ({
      month: key,
      revenue: parseFloat(monthlyRevenue[key].toFixed(2))
    }));

    // Daily Bookings (Last 7 Days)
    const dailyBookings = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const label = d.toISOString().split('T')[0];
      dailyBookings[label] = 0;
    }

    const recentBookings = await prisma.booking.findMany({
      where: {
        bookedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
        }
      },
      select: { bookedAt: true }
    });

    recentBookings.forEach(b => {
      const label = new Date(b.bookedAt).toISOString().split('T')[0];
      if (dailyBookings[label] !== undefined) {
        dailyBookings[label] += 1;
      }
    });

    const dailyBookingsChart = Object.keys(dailyBookings).map(key => ({
      date: key,
      bookings: dailyBookings[key]
    }));

    // Top Routes
    const routes = await prisma.route.findMany({
      include: {
        schedules: {
          include: {
            bookings: {
              where: { bookingStatus: 'CONFIRMED' }
            }
          }
        }
      }
    });

    const topRoutesChart = routes.map(r => {
      const bookingCount = r.schedules.reduce((acc, s) => acc + s.bookings.length, 0);
      return {
        routeName: `${r.sourceCity} ➔ ${r.destinationCity}`,
        bookings: bookingCount
      };
    }).sort((a, b) => b.bookings - a.bookings).slice(0, 5);

    // Bus Occupancy Rate (Schedules Occupancy)
    const activeSchedules = await prisma.schedule.findMany({
      include: {
        bus: true,
        bookings: {
          where: { bookingStatus: 'CONFIRMED' },
          include: { passengers: true }
        }
      },
      take: 10
    });

    const busOccupancyChart = activeSchedules.map(s => {
      const totalBooked = s.bookings.reduce((acc, b) => acc + b.passengers.length, 0);
      const occupancyRate = s.bus.totalSeats > 0 ? (totalBooked / s.bus.totalSeats) * 100 : 0;
      return {
        busName: `${s.bus.busNumber} (${s.bus.busName.split(' - ')[0]})`,
        occupancy: parseFloat(occupancyRate.toFixed(1))
      };
    });

    return res.status(200).json({
      stats: {
        totalUsers,
        totalBuses,
        totalRoutes,
        totalBookings,
        revenue: parseFloat(revenue.toFixed(2))
      },
      charts: {
        monthlyRevenue: monthlyRevenueChart,
        dailyBookings: dailyBookingsChart,
        topRoutes: topRoutesChart,
        busOccupancy: busOccupancyChart
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// 2. User Management
export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ message: 'isActive status is required.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isActive },
      select: { id: true, fullName: true, email: true, isActive: true }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_USER_TOGGLE',
        userId: req.user.id,
        details: `Toggled user status of ${updatedUser.email} (id: ${id}) to ${isActive}.`
      }
    });

    return res.status(200).json({
      message: `User account has been ${isActive ? 'enabled' : 'disabled'} successfully.`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// 3. Bookings List
export const getAllBookings = async (req, res) => {
  try {
    const { search, date } = req.query;

    const whereClause = {};

    if (search) {
      whereClause.OR = [
        { bookingReference: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    if (date) {
      const searchDate = new Date(date);
      if (!isNaN(searchDate.getTime())) {
        const startOfDay = new Date(searchDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(searchDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        whereClause.schedule = {
          departureDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: { fullName: true, email: true, phone: true }
        },
        schedule: {
          include: { bus: true, route: true }
        },
        passengers: true,
        payment: true
      },
      orderBy: { bookedAt: 'desc' }
    });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Get all bookings error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// 4. Bus CRUD
export const addBus = async (req, res) => {
  try {
    const { busNumber, busName, operatorName, busType, totalSeats, amenities } = req.body;
    if (!busNumber || !busName || !operatorName || !busType || !totalSeats || !amenities) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Unique bus number check
    const existingBus = await prisma.bus.findUnique({ where: { busNumber } });
    if (existingBus) return res.status(400).json({ message: 'Bus number already exists.' });

    const bus = await prisma.bus.create({
      data: {
        busNumber,
        busName,
        operatorName,
        busType,
        totalSeats: parseInt(totalSeats),
        amenities
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_BUS_CREATE',
        userId: req.user.id,
        details: `Created bus: ${busNumber}`
      }
    });

    return res.status(201).json({ message: 'Bus added successfully.', bus });
  } catch (error) {
    console.error('Add bus error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const editBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { busNumber, busName, operatorName, busType, totalSeats, amenities } = req.body;

    const bus = await prisma.bus.update({
      where: { id: parseInt(id) },
      data: {
        busNumber,
        busName,
        operatorName,
        busType,
        totalSeats: totalSeats ? parseInt(totalSeats) : undefined,
        amenities
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_BUS_UPDATE',
        userId: req.user.id,
        details: `Updated bus: ${bus.busNumber}`
      }
    });

    return res.status(200).json({ message: 'Bus updated successfully.', bus });
  } catch (error) {
    console.error('Edit bus error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    const bus = await prisma.bus.delete({ where: { id: parseInt(id) } });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_BUS_DELETE',
        userId: req.user.id,
        details: `Deleted bus: ${bus.busNumber}`
      }
    });

    return res.status(200).json({ message: 'Bus deleted successfully.' });
  } catch (error) {
    console.error('Delete bus error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// 5. Route CRUD
export const addRoute = async (req, res) => {
  try {
    const { sourceCity, destinationCity, distance, duration } = req.body;
    if (!sourceCity || !destinationCity || !distance || !duration) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const route = await prisma.route.create({
      data: {
        sourceCity,
        destinationCity,
        distance: parseFloat(distance),
        duration
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_ROUTE_CREATE',
        userId: req.user.id,
        details: `Created route: ${sourceCity} to ${destinationCity}`
      }
    });

    return res.status(201).json({ message: 'Route added successfully.', route });
  } catch (error) {
    console.error('Add route error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Route between these cities already exists.' });
    }
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const editRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const { sourceCity, destinationCity, distance, duration } = req.body;

    const route = await prisma.route.update({
      where: { id: parseInt(id) },
      data: {
        sourceCity,
        destinationCity,
        distance: distance ? parseFloat(distance) : undefined,
        duration
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_ROUTE_UPDATE',
        userId: req.user.id,
        details: `Updated route: ${route.sourceCity} to ${route.destinationCity}`
      }
    });

    return res.status(200).json({ message: 'Route updated successfully.', route });
  } catch (error) {
    console.error('Edit route error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const route = await prisma.route.delete({ where: { id: parseInt(id) } });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_ROUTE_DELETE',
        userId: req.user.id,
        details: `Deleted route: ${route.sourceCity} to ${route.destinationCity}`
      }
    });

    return res.status(200).json({ message: 'Route deleted successfully.' });
  } catch (error) {
    console.error('Delete route error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// 6. Schedule CRUD
export const addSchedule = async (req, res) => {
  try {
    const { busId, routeId, departureDate, departureTime, arrivalTime, fare } = req.body;
    if (!busId || !routeId || !departureDate || !departureTime || !arrivalTime || !fare) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dateStr}`;

    if (departureDate < todayStr) {
      return res.status(400).json({ message: 'Cannot create schedules in the past.' });
    }

    const searchDate = new Date(departureDate);

    const bus = await prisma.bus.findUnique({ where: { id: parseInt(busId) } });
    if (!bus) return res.status(404).json({ message: 'Bus not found.' });

    const schedule = await prisma.schedule.create({
      data: {
        busId: parseInt(busId),
        routeId: parseInt(routeId),
        departureDate: searchDate,
        departureTime,
        arrivalTime,
        availableSeats: bus.totalSeats,
        fare: parseFloat(fare)
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_SCHEDULE_CREATE',
        userId: req.user.id,
        details: `Created schedule: Bus ID ${busId}, Route ID ${routeId}, Date: ${departureDate}`
      }
    });

    return res.status(201).json({ message: 'Schedule created successfully.', schedule });
  } catch (error) {
    console.error('Add schedule error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const editSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { busId, routeId, departureDate, departureTime, arrivalTime, fare } = req.body;

    const updateData = {};
    if (busId) updateData.busId = parseInt(busId);
    if (routeId) updateData.routeId = parseInt(routeId);
    if (departureDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const dateStr = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${dateStr}`;
      if (departureDate < todayStr) {
        return res.status(400).json({ message: 'Cannot reschedule to a past date.' });
      }
      const searchDate = new Date(departureDate);
      updateData.departureDate = searchDate;
    }
    if (departureTime) updateData.departureTime = departureTime;
    if (arrivalTime) updateData.arrivalTime = arrivalTime;
    if (fare) updateData.fare = parseFloat(fare);

    const schedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_SCHEDULE_UPDATE',
        userId: req.user.id,
        details: `Updated schedule ID: ${schedule.id}`
      }
    });

    return res.status(200).json({ message: 'Schedule updated successfully.', schedule });
  } catch (error) {
    console.error('Edit schedule error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.schedule.delete({ where: { id: parseInt(id) } });

    await prisma.auditLog.create({
      data: {
        action: 'ADMIN_SCHEDULE_DELETE',
        userId: req.user.id,
        details: `Deleted schedule ID: ${id}`
      }
    });

    return res.status(200).json({ message: 'Schedule deleted successfully.' });
  } catch (error) {
    console.error('Delete schedule error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
