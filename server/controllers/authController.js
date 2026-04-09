const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const logger = require('../utils/logger');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const buildAuthCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

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

    res
      .cookie('token', token, buildAuthCookieOptions())
      .status(201)
      .json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        modelPreferences: user.modelPreferences,
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

    res
      .cookie('token', token, buildAuthCookieOptions())
      .json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        modelPreferences: user.modelPreferences,
      });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate or register user via Google OAuth
 */
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400);
      throw new Error('Google credential is required');
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      res.status(400);
      throw new Error('Google account must have an email address');
    }

    // Try to find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email }],
    });

    if (user) {
      // Link Google account if user exists by email but hasn't linked yet
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) user.avatar = picture;
        await user.save();
        logger.info(`Linked Google account for user: ${user.username} (${user._id})`);
      }
    } else {
      // Create a new user from Google profile
      // Generate a unique username from the Google name
      let baseUsername = (name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 20);

      if (baseUsername.length < 3) baseUsername = 'user';

      let username = baseUsername;
      let counter = 1;
      while (await User.findOne({ username })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await User.create({
        username,
        email,
        googleId,
        avatar: picture || null,
      });

      logger.info(`User registered via Google: ${user.username} (${user._id})`);
    }

    const token = generateToken(user._id);

    res
      .cookie('token', token, buildAuthCookieOptions())
      .json({
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        modelPreferences: user.modelPreferences,
      });
  } catch (error) {
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
      res.status(401);
      error.message = 'Google authentication failed. Please try again.';
    }
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
      avatar: user.avatar,
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
      avatar: user.avatar,
      modelPreferences: user.modelPreferences,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, googleAuth, getProfile, updateModelPreferences };

