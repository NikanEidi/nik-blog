const multer = require('multer');

// Short project-preview videos are allowed alongside images (not GIF —
// GIF's compression is bad enough that the same clip is a fraction of the
// size as MP4/WebM, so video is the better fit for "show a short preview").
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm'];

// memoryStorage: the file stays in RAM as a Buffer (req.file.buffer) instead
// of being written to disk first — fine at this scale, and means s3Service
// can hand the buffer straight to S3 with no temp-file cleanup to manage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — covers images comfortably and a short compressed video clip
  fileFilter(req, file, cb) {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  },
});

module.exports = upload.single('image');
