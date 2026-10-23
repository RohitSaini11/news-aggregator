const { fetchArticles, buildPreferencesQuery } = require('../services/newsService');
const newsCache = require('../services/newsCache');
const { saveArticles, findArticle } = require('../data/articles');
const { validateKeyword, isValidArticleId } = require('../validators/newsValidators');
const { sendValidationError } = require('../validators/userValidators');
const { NEWS_API_KEY } = require('../config');

const API_KEY_MISSING_MESSAGE = 'News API key not configured';

const sendArticles = (res, { articles, cached, stale }) => {
    // Remember served articles so they can be marked as read/favorite by id
    saveArticles(articles);
    const body = { news: articles, cached };
    if (stale) {
        body.stale = true;
    }
    return res.status(200).json(body);
};

const getNews = async (req, res, next) => {
    try {
        const { preferences } = req.user;

        if (preferences.length === 0) {
            return res.status(200).json({ news: [], message: 'Set preferences to get personalised news' });
        }
        if (!NEWS_API_KEY) {
            return res.status(200).json({ news: [], message: API_KEY_MISSING_MESSAGE });
        }

        // Sorted, lowercased terms so users with the same preferences share a cache entry
        const terms = [...new Set(preferences.map((p) => p.toLowerCase()))].sort();
        const result = await newsCache.getOrFetch(`prefs:${terms.join('|')}`, buildPreferencesQuery(terms), fetchArticles);
        return sendArticles(res, result);
    } catch (err) {
        next(err);
    }
};

const searchNews = async (req, res, next) => {
    try {
        const errors = validateKeyword(req.params.keyword);
        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }
        if (!NEWS_API_KEY) {
            return res.status(200).json({ news: [], message: API_KEY_MISSING_MESSAGE });
        }

        const keyword = req.params.keyword.trim().toLowerCase();
        const result = await newsCache.getOrFetch(`search:${keyword}`, buildPreferencesQuery([keyword]), fetchArticles);
        return sendArticles(res, result);
    } catch (err) {
        next(err);
    }
};

const markArticle = (listName, timestampField, message) => (req, res) => {
    const { id } = req.params;
    if (!isValidArticleId(id)) {
        return sendValidationError(res, ['Article id must be 16 hexadecimal characters']);
    }

    const list = req.user[listName];
    let entry = list.find((article) => article.id === id);
    if (!entry) {
        const article = findArticle(id);
        if (!article) {
            return res.status(404).json({ error: 'Article not found. Fetch it via GET /news or /news/search first' });
        }
        entry = { ...article, [timestampField]: new Date().toISOString() };
        list.push(entry);
    }

    return res.status(200).json({ message, article: entry });
};

// Lists are appended chronologically, so reverse for newest first
const listArticles = (listName) => (req, res) => {
    return res.status(200).json({ news: [...req.user[listName]].reverse() });
};

module.exports = {
    getNews,
    searchNews,
    markRead: markArticle('readArticles', 'readAt', 'Article marked as read'),
    markFavorite: markArticle('favoriteArticles', 'favoritedAt', 'Article marked as favorite'),
    getReadArticles: listArticles('readArticles'),
    getFavoriteArticles: listArticles('favoriteArticles')
};
