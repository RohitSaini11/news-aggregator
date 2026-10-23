const MINUTE_MS = 60 * 1000;

module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    SALT_ROUNDS: 10,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    NEWS_API_BASE_URL: 'https://newsapi.org/v2',
    NEWS_API_TIMEOUT_MS: 10000,
    NEWS_CACHE_TTL_MS: Number(process.env.NEWS_CACHE_TTL_MS) || 30 * MINUTE_MS,
    NEWS_CACHE_MAX_ENTRIES: 100,
    NEWS_REFRESH_INTERVAL_MS: Number(process.env.NEWS_REFRESH_INTERVAL_MS) || 25 * MINUTE_MS,
    // Only cache entries requested within this window are refreshed in the background
    NEWS_REFRESH_ACTIVE_WINDOW_MS: 60 * MINUTE_MS,
    ARTICLE_STORE_MAX_ENTRIES: 1000
};
