const newsCache = require('../services/newsCache');
const { fetchArticles } = require('../services/newsService');
const {
    NEWS_API_KEY,
    NEWS_REFRESH_INTERVAL_MS,
    NEWS_REFRESH_ACTIVE_WINDOW_MS
} = require('../config');

let running = false;

// Re-fetch recently used cache entries and drop the ones nobody has asked for lately
const refreshActiveEntries = async () => {
    if (running) {
        return;
    }
    running = true;
    try {
        const cutoff = Date.now() - NEWS_REFRESH_ACTIVE_WINDOW_MS;
        let refreshed = 0;
        let removed = 0;

        // Sequential on purpose, to stay gentle on the NewsAPI rate limit
        for (const { key, query, lastAccessedAt } of await newsCache.listEntries()) {
            if (lastAccessedAt < cutoff) {
                await newsCache.remove(key);
                removed++;
                continue;
            }
            try {
                await newsCache.refresh(key, query, fetchArticles);
                refreshed++;
            } catch (err) {
                console.error(`News refresh failed for ${key}: ${err.message}`);
            }
        }

        console.log(`News cache refresh: ${refreshed} refreshed, ${removed} removed`);
    } finally {
        running = false;
    }
};

const startNewsRefresher = () => {
    if (!NEWS_API_KEY) {
        console.log('News refresher disabled: NEWS_API_KEY not set');
        return null;
    }
    const timer = setInterval(refreshActiveEntries, NEWS_REFRESH_INTERVAL_MS);
    // Don't keep the process alive just for this timer
    timer.unref();
    return timer;
};

module.exports = { startNewsRefresher, refreshActiveEntries };
