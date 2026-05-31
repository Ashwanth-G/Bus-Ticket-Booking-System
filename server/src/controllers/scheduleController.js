import prisma from '../config/db.js';

export const searchSchedules = async (req, res) => {
  try {
    const { sourceCity, destinationCity, travelDate, sortBy, busType, departureTimeRange } = req.query;

    if (!sourceCity || !destinationCity || !travelDate) {
      return res.status(400).json({ message: 'Source City, Destination City, and Travel Date are required.' });
    }

    // Parse Travel Date
    const searchDate = new Date(travelDate);
    if (isNaN(searchDate.getTime())) {
      return res.status(400).json({ message: 'Invalid travel date format. Use YYYY-MM-DD.' });
    }

    // Validation: cannot book buses in the past
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${dateStr}`;

    if (travelDate < todayStr) {
      return res.status(200).json([]); // Return empty list for past dates
    }

    // Find matching route
    const route = await prisma.route.findFirst({
      where: {
        sourceCity: { equals: sourceCity },
        destinationCity: { equals: destinationCity }
      }
    });

    if (!route) {
      return res.status(200).json([]); // No routes exist between these cities
    }

    // Prepare search query
    const startOfDay = new Date(searchDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const whereClause = {
      routeId: route.id,
      departureDate: {
        gte: startOfDay,
        lte: endOfDay
      }
    };

    // Filter by Bus Type if specified
    if (busType) {
      whereClause.bus = {
        busType: { equals: busType }
      };
    }

    // Query schedules
    let schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        bus: true,
        route: true,
        reviews: {
          include: {
            user: { select: { fullName: true } }
          }
        }
      }
    });

    // Time-based filtering (Same Day validation)
    const isToday = travelDate === todayStr;
    if (isToday) {
      const currentHrs = now.getHours();
      const currentMins = now.getMinutes();
      
      schedules = schedules.filter(s => {
        const [depH, depM] = s.departureTime.split(':').map(Number);
        return depH > currentHrs || (depH === currentHrs && depM > currentMins);
      });
    }

    // Filter by Departure Time Range (e.g. "morning", "afternoon", "evening", "night")
    if (departureTimeRange) {
      schedules = schedules.filter(s => {
        const [hours] = s.departureTime.split(':').map(Number);
        if (departureTimeRange === 'morning') return hours >= 6 && hours < 12;
        if (departureTimeRange === 'afternoon') return hours >= 12 && hours < 17;
        if (departureTimeRange === 'evening') return hours >= 17 && hours < 21;
        if (departureTimeRange === 'night') return hours >= 21 || hours < 6;
        return true;
      });
    }

    // Sort schedules
    if (sortBy === 'priceLowHigh') {
      schedules.sort((a, b) => a.fare - b.fare);
    } else if (sortBy === 'priceHighLow') {
      schedules.sort((a, b) => b.fare - a.fare);
    } else if (sortBy === 'departureTime') {
      schedules.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } else if (sortBy === 'arrivalTime') {
      schedules.sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));
    }

    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Search schedules error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        bus: true,
        route: true,
        bookings: {
          where: { bookingStatus: 'CONFIRMED' },
          include: {
            passengers: true
          }
        },
        reviews: {
          include: {
            user: { select: { fullName: true } }
          }
        }
      }
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found.' });
    }

    // Get list of booked seats
    // A seat can be represented by passenger details, or we can store layout of seat numbers.
    // Let's assume seat numbers are derived from passenger indices or explicitly mapped.
    // To make it professional, let's map seats 1-40.
    // Let's figure out which seats are booked by calculating booked seats.
    // Let's assume each booking lists passengers, and passengers select a seat number.
    // Wait, let's check the fields of Passenger table: id, bookingId, passengerName, passengerPhone.
    // To identify specific booked seat numbers, let's assign seat numbers sequentially based on bookings,
    // or let's add a seatNumber field to Passenger or mock it dynamically using passenger ID or indexes,
    // OR we can add a `seatNumber` field to the Passenger table!
    // Wait, the schema we created:
    // model Passenger {
    //   id             Int      @id @default(autoincrement())
    //   bookingId      Int
    //   passengerName  String
    //   passengerPhone String
    //   booking        Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
    // }
    // Let's modify our passenger data model internally or add a seatNumber property if needed,
    // or we can associate each passenger with a seat number in the booking details.
    // Let's say we can include seatNumber as a field on the Passenger table, or dynamically assign it.
    // Wait! Let's check: in a real bus system, passengers MUST choose a seat.
    // Let's add a `seatNumber` column to the Passenger table in our database.
    // Let's check: did we already write schema.prisma? Yes!
    // Let's update schema.prisma to include `seatNumber String` (or Int) inside Passenger model!
    // Yes! Let's do that. That way, we can store and retrieve specific seats (e.g. "1A", "1B", "15", "40")!
    // Let's check how we can edit `schema.prisma`. It is much better to have an explicit `seatNumber Int` on Passenger.
    // Let's update `schema.prisma` first or write scheduleController to assume there is a `seatNumber` field, and then apply it.
    // Let's check. Yes, adding `seatNumber Int` to the Passenger table makes perfect sense. Let's make it a migration step or directly update the prisma schema.
    
    return res.status(200).json(schedule);
  } catch (error) {
    console.error('Get schedule by ID error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
