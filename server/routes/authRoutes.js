const express = require('express');
const router = express.Router();
const { register, login, googleAuth, getProfile, updateModelPreferences } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleAuth);
router.get('/profile', protect, getProfile);
router.put('/models', protect, updateModelPreferences);

module.exports = router;

