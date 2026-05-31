import http from 'http';
import dotenv from 'dotenv';
import app from './app.js';
import { initSocket } from './sockets/socket.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Start Server
server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`SmartBus Pro Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database connected via Prisma Client`);
  console.log(`Realtime Socket.IO initialized`);
  console.log(`=================================================`);
});
