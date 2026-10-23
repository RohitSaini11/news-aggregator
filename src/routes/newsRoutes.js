const express = require('express');
const { getNews } = require('../controllers/newsController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticate, getNews);

module.exports = router;
