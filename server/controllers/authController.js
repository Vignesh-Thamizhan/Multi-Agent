const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      res.status(400);
      throw new Error('Please provide username, email, and password');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      res.status(400);
      throw new Error(
        existingUser.email === email
          ? 'Email already registered'
          : 'Username already taken'
      );
    }

    const user = await User.create({ username, email, password });

    const token = generateToken(user._id);

    logger.info(`User registered: ${user.username} (${user._id})`);

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      modelPreferences: user.modelPreferences,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.username} (${user._id})`);

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      modelPreferences: user.modelPreferences,
      token,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      modelPreferences: user.modelPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/auth/models
 * @desc    Update model preferences
 */
const updateModelPreferences = async (req, res, next) => {
  try {
    const { planner, coder, reviewer } = req.body;
    const update = {};

    if (planner) update['modelPreferences.planner'] = planner;
    if (coder) update['modelPreferences.coder'] = coder;
    if (reviewer) update['modelPreferences.reviewer'] = reviewer;

    const user = await User.findByIdAndUpdate(req.user._id, update, {
      new: true,
    });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      modelPreferences: user.modelPreferences,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateModelPreferences };
