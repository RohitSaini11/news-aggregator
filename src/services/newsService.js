const axios = require('axios');
const crypto = require('crypto');
const { NEWS_API_KEY, NEWS_API_BASE_URL, NEWS_API_TIMEOUT_MS } = require('../config');

const PAGE_SIZE = 20;

const createError = (status, message) => {
    const err = new Error(message);
    err.status = status;
    return err;
};

// Translate axios failures into errors carrying the status we want to return
const toServiceError = (err) => {
    if (err.response) {
        const { status, data } = err.response;
        if (status === 401) {
            return createError(502, 'News provider rejected the API key');
        }
        if (status === 429) {
            return createError(503, 'News provider rate limit reached, please try again later');
        }
        return createError(502, `News provider error: ${data?.message || 'unexpected response'}`);
    }
    if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        return createError(504, 'News provider timed out');
    }
    return createError(502, 'Unable to reach news provider');
};

// NewsAPI articles have no id, so derive a stable one from the URL
const createArticleId = (url) => crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);

const normalizeArticle = (article) => ({
    id: createArticleId(article.url),
    title: article.title,
    description: article.description,
    url: article.url,
    source: article.source?.name || null,
    author: article.author,
    imageUrl: article.urlToImage,
    publishedAt: article.publishedAt
});

const buildPreferencesQuery = (preferences) => preferences.map((p) => `"${p}"`).join(' OR ');

const fetchArticles = async (query) => {
    let response;
    try {
        response = await axios.get(`${NEWS_API_BASE_URL}/everything`, {
            params: { q: query, language: 'en', sortBy: 'publishedAt', pageSize: PAGE_SIZE },
            headers: { 'X-Api-Key': NEWS_API_KEY },
            timeout: NEWS_API_TIMEOUT_MS
        });
    } catch (err) {
        throw toServiceError(err);
    }

    return (response.data.articles || [])
        .filter((article) => article.url && article.title && article.title !== '[Removed]')
        .map(normalizeArticle);
};

module.exports = { fetchArticles, buildPreferencesQuery };
