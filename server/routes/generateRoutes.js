const express = require('express');
const router = express.Router();
const {
  generate,
  getSessions,
  getSession,
  deleteSession,
} = require('../controllers/generateController');
const { protect } = require('../middleware/authMiddleware');
const { generateLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/', protect, generateLimiter, generate);
router.get('/sessions', protect, getSessions);
router.get('/sessions/:id', protect, getSession);
router.delete('/sessions/:id', protect, deleteSession);

module.exports = router;
