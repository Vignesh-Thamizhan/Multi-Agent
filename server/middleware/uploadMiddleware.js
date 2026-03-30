const multer = require('multer');
const path = require('path');

// Allowed MIME types
const ALLOWED_MIMES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  // Documents
  'application/pdf': ['.pdf'],
  // Code / Text (all served as various text types)
  'text/plain': ['.txt', '.md', '.yaml', '.yml', '.csv', '.sh'],
  'text/javascript': ['.js', '.jsx', '.ts', '.tsx'],
  'text/x-python': ['.py'],
  'text/x-java': ['.java'],
  'text/x-go': ['.go'],
  'text/x-rust': ['.rs'],
  'text/x-ruby': ['.rb'],
  'text/x-php': ['.php'],
  'text/x-sql': ['.sql'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/xml': ['.xml'],
};

// Flatten to get all allowed extensions
const ALLOWED_EXTENSIONS = new Set(
  Object.values(ALLOWED_MIMES).flat()
);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check extension
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return cb(new Error(`File type ${ext} is not supported`), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

// Wrapper middleware that handles multer errors
const uploadMiddleware = (req, res, next) => {
  const singleUpload = upload.single('file');

  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File size exceeds 10MB limit' });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

module.exports = { uploadMiddleware, ALLOWED_EXTENSIONS };
