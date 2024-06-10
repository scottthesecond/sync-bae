const express = require('express');
const router = express.Router();
const syncController = require('../controllers/syncController');

router.get('/trigger', syncController.triggerSync);

module.exports = router;