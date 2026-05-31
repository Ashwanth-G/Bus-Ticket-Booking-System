import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');

  // 1. Clean Database
  console.log('Cleaning database...');
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.passenger.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.review.deleteMany();
  await prisma.favoriteRoute.deleteMany();
  await prisma.searchHistory.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.route.deleteMany();
  await prisma.bus.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Predefined Admin and Test Users
  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin@123', salt);
  const userPassword = await bcrypt.hash('User@123', salt);

  const admin = await prisma.user.create({
    data: {
      fullName: 'SmartBus Administrator',
      email: 'admin@smartbus.com',
      phone: '9999999999',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user1 = await prisma.user.create({
    data: {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      password: userPassword,
      role: 'USER',
      isActive: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '8765432109',
      password: userPassword,
      role: 'USER',
      isActive: true,
    },
  });

  const disabledUser = await prisma.user.create({
    data: {
      fullName: 'Disabled Customer',
      email: 'disabled@example.com',
      phone: '7654321098',
      password: userPassword,
      role: 'USER',
      isActive: false,
    },
  });

  console.log(`Seeded users: Admin + ${[user1.email, user2.email, disabledUser.email].join(', ')}`);

  // 3. Create 20 Buses
  console.log('Seeding 20 buses...');
  const operators = ['Volvo Transports', 'GreenLine Express', 'Skyline Travels', 'National Travels', 'Royal Cruiser'];
  const busTypes = ['AC Sleeper', 'Non AC', 'Volvo', 'Semi Sleeper'];
  const amenitiesList = [
    'WiFi, Charging Point, Water Bottle, Blanket',
    'Charging Point, Reading Light',
    'WiFi, AC, Charging Point, Pillow, Blanket, Water Bottle',
    'AC, Reading Light, Water Bottle'
  ];

  const buses = [];
  for (let i = 1; i <= 20; i++) {
    const busType = busTypes[i % busTypes.length];
    let totalSeats = 40;
    if (busType === 'AC Sleeper') totalSeats = 30; // Sleeper buses typically have fewer berths
    
    const bus = await prisma.bus.create({
      data: {
        busNumber: `KA-0${i}-B-${1000 + i}`,
        busName: `${operators[i % operators.length]} - Elite`,
        operatorName: operators[i % operators.length],
        busType: busType,
        totalSeats: totalSeats,
        amenities: amenitiesList[i % amenitiesList.length],
      },
    });
    buses.push(bus);
  }
  console.log(`Seeded ${buses.length} buses.`);

  // 4. Create 50 Routes
  console.log('Seeding 50 routes...');
  const cities = ['Bangalore', 'Mumbai', 'Pune', 'Delhi', 'Jaipur', 'Chennai', 'Hyderabad', 'Goa', 'Ahmedabad', 'Kolkata'];
  
  // We'll generate routes between different cities.
  const routes = [];
  let routeCount = 0;
  for (let i = 0; i < cities.length; i++) {
    for (let j = 0; j < cities.length; j++) {
      if (i !== j && routeCount < 50) {
        // Calculate dynamic distance and duration
        const distance = Math.floor(Math.random() * 500) + 150; // 150 to 650 km
        const durationHours = Math.floor(distance / 60) + 1;
        const durationMinutes = (distance % 60) < 30 ? '00m' : '30m';
        const duration = `${String(durationHours).padStart(2, '0')}h ${durationMinutes}`;
        
        try {
          const route = await prisma.route.create({
            data: {
              sourceCity: cities[i],
              destinationCity: cities[j],
              distance: parseFloat(distance.toFixed(1)),
              duration: duration,
            },
          });
          routes.push(route);
          routeCount++;
        } catch (err) {
          // Skip unique constraint failures if any
        }
      }
    }
  }
  console.log(`Seeded ${routes.length} routes.`);

  // 5. Create 100 Schedules
  console.log('Seeding 100 schedules...');
  const schedules = [];
  const times = ['06:00', '08:30', '13:00', '17:15', '21:30', '23:00'];
  const baseFares = [450, 650, 800, 1200, 1500];

  // We want to generate schedules covering:
  // - Past dates (to show booking history)
  // - Today (to test same-day booking validations)
  // - Future dates (to show search results and book)
  
  const dates = [];
  // Today's Date (Midnight UTC)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Past dates: -3 days, -1 day
  for (let d = -3; d <= 7; d++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() + d);
    dates.push(date);
  }

  let scheduleCount = 0;
  // We'll distribute schedules across our routes and buses
  for (let d = 0; d < dates.length; d++) {
    const travelDate = dates[d];
    
    for (let r = 0; r < 10; r++) { // 10 routes per day
      if (scheduleCount >= 100) break;

      const route = routes[r % routes.length];
      const bus = buses[scheduleCount % buses.length];
      const depTime = times[scheduleCount % times.length];
      
      // Calculate arrival time roughly (add 6 hours to departure)
      const [h, m] = depTime.split(':').map(Number);
      const arrH = (h + 6) % 24;
      const arrTime = `${String(arrH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      const fare = baseFares[scheduleCount % baseFares.length] + (bus.busType.includes('AC') ? 300 : 0);

      const schedule = await prisma.schedule.create({
        data: {
          busId: bus.id,
          routeId: route.id,
          departureDate: travelDate,
          departureTime: depTime,
          arrivalTime: arrTime,
          availableSeats: bus.totalSeats,
          fare: parseFloat(fare.toFixed(2)),
        },
      });
      schedules.push(schedule);
      scheduleCount++;
    }
  }
  console.log(`Seeded ${schedules.length} schedules.`);

  // 6. Create Seed Bookings, Payments, and Passengers (some confirmed, some cancelled, some past)
  console.log('Seeding bookings, payments, and passengers...');
  
  // Find a past schedule
  const pastSchedules = schedules.filter(s => s.departureDate < today);
  // Find a future schedule
  const futureSchedules = schedules.filter(s => s.departureDate > today);

  if (pastSchedules.length > 0 && futureSchedules.length > 1) {
    // Booking 1: Past Booking for User 1 (Completed)
    const schedPast = pastSchedules[0];
    const busPast = buses.find(b => b.id === schedPast.busId);
    const booking1 = await prisma.booking.create({
      data: {
        bookingReference: 'SBP-2026-00001',
        userId: user1.id,
        scheduleId: schedPast.id,
        bookingStatus: 'CONFIRMED',
        totalFare: schedPast.fare,
        bookedAt: new Date(schedPast.departureDate.getTime() - 24 * 60 * 60 * 1000), // booked 1 day prior
        passengers: {
          create: [
            { passengerName: 'John Doe', passengerPhone: user1.phone, seatNumber: 5 }
          ]
        },
        payment: {
          create: {
            amount: schedPast.fare,
            paymentMethod: 'UPI',
            paymentStatus: 'PAID',
            transactionId: 'TXN-9876543210',
          }
        }
      }
    });

    // Booking 2: Upcoming Booking for User 1 (Confirmed)
    const schedFut1 = futureSchedules[0];
    const booking2 = await prisma.booking.create({
      data: {
        bookingReference: 'SBP-2026-00002',
        userId: user1.id,
        scheduleId: schedFut1.id,
        bookingStatus: 'CONFIRMED',
        totalFare: schedFut1.fare * 2, // 2 seats
        bookedAt: new Date(),
        passengers: {
          create: [
            { passengerName: 'John Doe', passengerPhone: user1.phone, seatNumber: 12 },
            { passengerName: 'Alice Doe', passengerPhone: '9000000001', seatNumber: 13 }
          ]
        },
        payment: {
          create: {
            amount: schedFut1.fare * 2,
            paymentMethod: 'Card',
            paymentStatus: 'PAID',
            transactionId: 'TXN-9876543211',
          }
        }
      }
    });
    // Update seats
    await prisma.schedule.update({
      where: { id: schedFut1.id },
      data: { availableSeats: schedFut1.availableSeats - 2 }
    });

    // Booking 3: Cancelled Upcoming Booking for User 2
    const schedFut2 = futureSchedules[1];
    await prisma.booking.create({
      data: {
        bookingReference: 'SBP-2026-00003',
        userId: user2.id,
        scheduleId: schedFut2.id,
        bookingStatus: 'CANCELLED',
        totalFare: schedFut2.fare,
        bookedAt: new Date(),
        passengers: {
          create: [
            { passengerName: 'Jane Smith', passengerPhone: user2.phone, seatNumber: 8 }
          ]
        },
        payment: {
          create: {
            amount: schedFut2.fare,
            paymentMethod: 'NetBanking',
            paymentStatus: 'PAID',
            transactionId: 'TXN-9876543212',
          }
        }
      }
    });

    // Seeding search history, reviews, and favorites
    await prisma.searchHistory.createMany({
      data: [
        { userId: user1.id, sourceCity: 'Bangalore', destinationCity: 'Goa' },
        { userId: user1.id, sourceCity: 'Mumbai', destinationCity: 'Pune' },
        { userId: user2.id, sourceCity: 'Delhi', destinationCity: 'Jaipur' },
      ],
    });

    await prisma.favoriteRoute.create({
      data: {
        userId: user1.id,
        routeId: schedFut1.routeId,
      },
    });

    await prisma.review.create({
      data: {
        userId: user1.id,
        scheduleId: schedPast.id,
        rating: 5,
        comment: 'Very comfortable ride, reached on time! Clean seats and polite driver.',
      },
    });

    await prisma.recentlyViewed.create({
      data: {
        userId: user1.id,
        busId: schedFut1.busId,
      },
    });
  }

  // 7. Write Audit logs
  console.log('Seeding audit logs...');
  await prisma.auditLog.createMany({
    data: [
      { action: 'ADMIN_INIT', userId: admin.id, details: 'System database initialized and seeded by default admin.' },
      { action: 'USER_REGISTER', userId: user1.id, details: 'User registered.' },
      { action: 'USER_REGISTER', userId: user2.id, details: 'User registered.' },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
