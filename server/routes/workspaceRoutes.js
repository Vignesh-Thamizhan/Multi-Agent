const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  listWorkspaceFiles,
  readWorkspaceFile,
  downloadWorkspaceZip,
} = require('../controllers/workspaceController');

router.get('/:sessionId/files', protect, listWorkspaceFiles);
router.get('/:sessionId/file', protect, readWorkspaceFile);
router.get('/:sessionId/download', protect, downloadWorkspaceZip);

module.exports = router;
