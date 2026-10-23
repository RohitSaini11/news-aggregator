const { fetchNewsByPreferences } = require('../services/newsService');
const { NEWS_API_KEY } = require('../config');

const getNews = async (req, res, next) => {
    try {
        const { preferences } = req.user;

        if (preferences.length === 0) {
            return res.status(200).json({ news: [], message: 'Set preferences to get personalised news' });
        }
        if (!NEWS_API_KEY) {
            return res.status(200).json({ news: [], message: 'News API key not configured' });
        }

        const news = await fetchNewsByPreferences(preferences);
        return res.status(200).json({ news });
    } catch (err) {
        next(err);
    }
};

module.exports = { getNews };
