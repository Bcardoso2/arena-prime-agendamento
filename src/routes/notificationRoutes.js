// src/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { proteger } = require('../middleware/authMiddleware');

router.post('/subscribe', proteger, notificationController.subscribe);

module.exports = router;