const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const controller = require('../controllers/notesController');

// Public — anyone can read published notes.
router.get('/', controller.list);
router.get('/:slug', controller.getBySlug);

// Admin-only — writing/changing notes requires a valid JWT.
router.post('/', requireAuth, controller.create);
router.put('/:id', requireAuth, controller.update);
router.delete('/:id', requireAuth, controller.remove);

module.exports = router;
