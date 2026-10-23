const express = require('express');
const { signup, login } = require('../controllers/authController');
const { getPreferences, updatePreferences } = require('../controllers/preferencesController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);

router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, updatePreferences);

module.exports = router;
