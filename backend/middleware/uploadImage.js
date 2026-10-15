const multer = require('multer');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];

// memoryStorage: the file stays in RAM as a Buffer (req.file.buffer) instead
// of being written to disk first — fine at this scale, and means s3Service
// can hand the buffer straight to S3 with no temp-file cleanup to manage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported image type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = upload.single('image');
