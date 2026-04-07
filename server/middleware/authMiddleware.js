const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const extractTokenFromCookies = (req) => {
  if (!req.cookies) return null;
  return req.cookies.token || null;
};

const protect = async (req, res, next) => {
  const token = extractTokenFromCookies(req);

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized, user not found' });
    }

    next();
  } catch (error) {
    logger.warn(`Auth middleware: Invalid token — ${error.message}`);
    return res.status(401).json({ error: 'Not authorized, invalid token' });
  }
};

module.exports = { protect };
