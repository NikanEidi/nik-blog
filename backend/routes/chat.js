const express = require('express');
const router = express.Router();
const controller = require('../controllers/chatController');

// Public — any site visitor can ask the assistant a question.
router.post('/', controller.ask);

module.exports = router;
