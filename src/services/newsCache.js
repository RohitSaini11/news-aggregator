const { NEWS_CACHE_TTL_MS, NEWS_CACHE_MAX_ENTRIES } = require('../config');

// key -> { query, articles, fetchedAt, lastAccessedAt }; Map order = least recently fetched first
const entries = new Map();
// key -> pending fetch promise, so concurrent requests share a single external call
const inFlight = new Map();

const isFresh = (entry) => Date.now() - entry.fetchedAt < NEWS_CACHE_TTL_MS;

const store = (key, query, articles) => {
    const previous = entries.get(key);
    entries.delete(key);
    entries.set(key, {
        query,
        articles,
        fetchedAt: Date.now(),
        // Background refreshes must not count as user activity
        lastAccessedAt: previous ? previous.lastAccessedAt : Date.now()
    });
    while (entries.size > NEWS_CACHE_MAX_ENTRIES) {
        entries.delete(entries.keys().next().value);
    }
};

const refresh = (key, query, fetcher) => {
    if (inFlight.has(key)) {
        return inFlight.get(key);
    }
    const promise = (async () => {
        try {
            const articles = await fetcher(query);
            store(key, query, articles);
            return articles;
        } finally {
            inFlight.delete(key);
        }
    })();
    inFlight.set(key, promise);
    return promise;
};

// Returns cached articles when fresh, otherwise fetches; falls back to stale data if the fetch fails
const getOrFetch = async (key, query, fetcher) => {
    const entry = entries.get(key);
    if (entry) {
        entry.lastAccessedAt = Date.now();
        if (isFresh(entry)) {
            return { articles: entry.articles, cached: true, stale: false };
        }
    }

    try {
        const articles = await refresh(key, query, fetcher);
        const updated = entries.get(key);
        if (updated) {
            updated.lastAccessedAt = Date.now();
        }
        return { articles, cached: false, stale: false };
    } catch (err) {
        if (entry) {
            return { articles: entry.articles, cached: true, stale: true };
        }
        throw err;
    }
};

const listEntries = async () => {
    return [...entries].map(([key, { query, lastAccessedAt }]) => ({ key, query, lastAccessedAt }));
};

const remove = async (key) => {
    entries.delete(key);
};

module.exports = { getOrFetch, refresh, listEntries, remove };
