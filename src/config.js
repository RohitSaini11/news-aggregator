module.exports = {
    PORT: process.env.PORT || 3000,
    JWT_SECRET: process.env.JWT_SECRET || 'dev-secret',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
    SALT_ROUNDS: 10,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
    NEWS_API_BASE_URL: 'https://newsapi.org/v2',
    NEWS_API_TIMEOUT_MS: 5000
};
