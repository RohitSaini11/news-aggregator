const express = require('express');
const {
    getNews,
    searchNews,
    markRead,
    markFavorite,
    getReadArticles,
    getFavoriteArticles
} = require('../controllers/newsController');
const authenticate = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

// Fixed paths are declared before the /:id routes so they are not treated as ids
router.get('/', getNews);
router.get('/read', getReadArticles);
router.get('/favorites', getFavoriteArticles);
router.get('/search/:keyword', searchNews);
router.post('/:id/read', markRead);
router.post('/:id/favorite', markFavorite);

module.exports = router;
