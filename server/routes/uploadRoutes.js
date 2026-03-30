const express = require('express');
const router = express.Router();
const { upload } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { uploadLimiter } = require('../middleware/rateLimitMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

router.post('/', protect, uploadLimiter, uploadMiddleware, upload);

module.exports = router;
