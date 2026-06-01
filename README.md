# SmartBus Pro - Online Bus Ticket Booking Management System

SmartBus Pro is a complete, production-ready, scalable online bus ticket booking platform built from scratch. It features JWT auth security, role-based access control, live seat status updates, PDF ticket generation with embedded QR codes, search logging, user review submissions, and administrative fleet management tools.

---

## Technical Stack

### Frontend
- **Framework**: React 18+ (bootstrapped with Vite)
- **State Management**: Redux Toolkit (auth, search, booking slices)
- **Styling**: Tailwind CSS with custom glassmorphism and animations
- **Validation**: React Hook Form + Zod Schema Resolution
- **Charts**: Recharts (admin dashboard metrics)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Real-time**: Socket.IO-client

### Backend
- **Framework**: Node.js & Express.js (ES Module support)
- **Database ORM**: Prisma Client
- **Security**: Helmet headers, CORS policies, Express rate limiters
- **Authentication**: JWT Access & Refresh Tokens (with interceptors)
- **Password Protection**: Hashing via bcryptjs
- **Testing**: Jest + Supertest integration tests
- **Utilities**: PDFKit (PDF Tickets) and QRCode (QR Code generator)

---

## Project Structure

```
Bus-Ticket-Booking-System/
├── docker-compose.yml
├── README.md
├── client/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       ├── components/        # Reusable global UI (Buttons, QR, PDF)
│       ├── pages/             # Route pages (Search, Seat Map, History)
│       ├── features/          # Redux Toolkit Slices (auth, booking, search)
│       ├── layouts/           # Common layouts (Main, Admin, Auth)
│       └── services/          # Axios HTTP clients (api.js)
└── server/
    ├── Dockerfile
    ├── package.json
    ├── .env.example
    └── src/
        ├── app.js             # Express application setup
        ├── server.js          # HTTP + Socket.IO server startup
        ├── config/            # DB client & security configurations
        ├── controllers/       # Controller Layer (Business logic)
        ├── middlewares/       # Auth, error handling, rate limits
        ├── routes/            # Route definition endpoints
        ├── validators/        # Request schemas (using Zod)
        ├── prisma/            # DB client, schema, seed.js
        ├── sockets/           # Socket.IO connection & event handlers
        ├── utils/             # PDF builder, QR generator, Email mock templates
        └── tests/             # Jest + Supertest integration tests
```

---

## Setup & Running Instructions

### Prerequisites
- **Node.js**: v16.x or higher
- **MySQL Database** OR **Docker & Docker Compose**

### Running with Docker Compose (Recommended)
1. Ensure you have Docker running on your system.
2. In the root directory, execute:
   ```bash
   docker-compose up --build
   ```
3. Docker will automatically launch:
   - MySQL database container (port 3306)
   - Express server container (port 5000)
   - React application container (port 3000)
4. Database migrations and seeding will perform automatically during container setup. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Manual Setup (Local Development)

#### 1. Setup Backend
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Copy environment variables:
   ```bash
   copy .env.example .env
   ```
   Modify `.env` to match your local MySQL configuration (i.e. update `DATABASE_URL`).
4. Generate Prisma client & apply migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Seed database (20 buses, 50 routes, 100 schedules, admin, test records):
   ```bash
   npm run db:seed
   ```
6. Launch development server:
   ```bash
   npm run dev
   ```

#### 2. Setup Frontend
1. Open a new terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch Vite development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Integration Tests
We use Jest + Supertest to validate authentication logic, booking restrictions, role authorisations, and user data isolation. To execute:
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Execute tests:
   ```bash
   npm run test
   ```
*Note: The test suite runs against mocked database configurations and passes instantly without modifying database records.*

---

## Predefined Credentials & Seed Data

### Predefined Admin Account
Admin account registration is disabled. You must use the seeded admin credentials:
- **Email**: `admin@smartbus.com`
- **Password**: `Admin@123`

### Predefined Test Accounts (Customers)
- **Email**: `john@example.com` | **Password**: `User@123` (Contains past booking history and favorites)
- **Email**: `jane@example.com` | **Password**: `User@123` (Contains cancelled bookings)

---

## API Documentation

### 1. Authentication (`/api/auth`)
- `POST /register`: Registers a new customer user. (FullName, Email, Phone, Password, ConfirmPassword).
- `POST /login`: Validates user credentials. Returns short-lived access token and refresh token.
- `POST /logout`: Invalidate user session and log out.
- `POST /refresh`: Issues a new pair of Access & Refresh tokens when rotation expires.
- `POST /forgot-password`: Generates simulated 6-digit OTP code log in terminal logs.
- `POST /reset-password`: Validates OTP and updates password.

### 2. Customer Portal (`/api/users`)
- `GET /profile`: Fetch active user profile.
- `PUT /profile`: Update name and phone number (validates phone uniqueness).
- `PATCH /change-password`: Verifies current credentials and updates password.
- `GET /bookings`: Retrieve upcoming active bus reservations.
- `GET /history`: Retrieve completed, past, or cancelled journeys.
- `GET /favorites`: Fetch list of saved route structures.
- `POST /favorites`: Add a route to favorite directory.
- `DELETE /favorites/:routeId`: Delete route from favorite directory.
- `GET /search-history`: Fetch 5 most recent search city matches.
- `POST /reviews`: Submit a 1-5 star review for completed journeys.

### 3. Bookings (`/api/bookings`)
- `POST /create`: Book a bus ticket. Validates same-day schedule times, checks seat availability inside database transaction, decrements available seats, and emits live status update via Socket.IO.
- `POST /cancel`: Cancel upcoming ticket booking. Sets status, updates payment refunds, increments schedule seating, and broadcasts Socket.IO status.
- `GET /:id/pdf`: Downloads compiled ticket PDF (requires user ownership authorization).

### 4. Schedules (`/api/schedules`)
- `GET /`: Search schedules with sorting (Price, Dep/Arr timings) and filters (Bus Type, Time Ranges). Validates departure times.
- `GET /all`: Fetch all schedules (used by dashboard CRUD listing).
- `GET /:id`: Fetch detailed schedule seat occupancy map.

### 5. Admin Console (`/api/admin`)
*All routes require ADMIN role check.*
- `GET /dashboard`: Fetch aggregated numbers, daily area charts, monthly bar charts, top routes, and donut occupancies.
- `GET /users`: List registered users.
- `PUT /users/:id/status`: Enable or Disable user account access.
- `GET /bookings`: Search/filter all bookings.
- `POST/PUT/DELETE /buses`: Add, edit, or remove fleet buses.
- `POST/PUT/DELETE /routes`: Manage operational source/destination pathways.
- `POST/PUT/DELETE /schedules`: Establish new scheduled routes (validates future departure dates).
