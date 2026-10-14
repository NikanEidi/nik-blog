const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const controller = require('../controllers/adminController');

router.get('/me', requireAuth, controller.me);
router.get('/projects', requireAuth, controller.listAllProjects);
router.get('/notes', requireAuth, controller.listAllNotes);
router.patch('/projects/:id/status', requireAuth, controller.updateProjectStatus);
router.patch('/notes/:id/status', requireAuth, controller.updateNoteStatus);

module.exports = router;
