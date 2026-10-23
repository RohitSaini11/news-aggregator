const { ARTICLE_STORE_MAX_ENTRIES } = require('../config');

// Every article served to a user, keyed by id, so /news/:id/... can look it up.
// Map keeps insertion order, so the first key is always the least recently served.
const articles = new Map();

const saveArticles = (list) => {
    list.forEach((article) => {
        articles.delete(article.id);
        articles.set(article.id, article);
    });
    while (articles.size > ARTICLE_STORE_MAX_ENTRIES) {
        articles.delete(articles.keys().next().value);
    }
};

const findArticle = (id) => articles.get(id);

module.exports = { saveArticles, findArticle };
