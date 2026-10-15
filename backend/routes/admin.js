const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const uploadImage = require('../middleware/uploadImage');
const controller = require('../controllers/adminController');

// multer reports a bad upload (wrong file type, too large) by calling
// next(err) instead of throwing — this wrapper catches that and turns it
// into a normal 400 JSON response, instead of Express's default HTML
// error page. Every other route here returns JSON, so uploads should too.
function handleUpload(req, res, next) {
  uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
    next();
  });
}

router.get('/me', requireAuth, controller.me);
router.get('/projects', requireAuth, controller.listAllProjects);
router.get('/projects/:id', requireAuth, controller.getProjectById);
router.get('/notes', requireAuth, controller.listAllNotes);
router.get('/notes/:id', requireAuth, controller.getNoteById);
router.patch('/projects/:id/status', requireAuth, controller.updateProjectStatus);
router.patch('/notes/:id/status', requireAuth, controller.updateNoteStatus);
router.patch('/projects/:id/pin', requireAuth, controller.setProjectPinned);
router.patch('/notes/:id/pin', requireAuth, controller.setNotePinned);
router.post('/upload', requireAuth, handleUpload, controller.uploadImage);

module.exports = router;
