const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const logger = require('../utils/logger');

let io;

const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // JWT auth middleware for Socket.io handshake using httpOnly cookie
  io.use((socket, next) => {
    const rawCookie = socket.handshake.headers.cookie || '';
    const parsed = cookie.parse(rawCookie || '');
    const token = parsed.token;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      logger.warn(`Socket auth failed: ${err.message}`);
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    // Join private user room
    socket.join(`user:${userId}`);
    logger.info(`Socket connected: ${socket.id} | User: ${userId}`);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`Socket error: ${socket.id} | ${err.message}`);
    });
  });

  logger.info('Socket.io initialized with cookie-based JWT auth middleware');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
