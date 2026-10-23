const { PREFERENCE_MAX_LENGTH, PREFERENCE_REGEX, isNonEmptyString } = require('./userValidators');

const ARTICLE_ID_REGEX = /^[a-f0-9]{16}$/;

// Search keywords follow the same rules as preferences since both end up in the news query
const validateKeyword = (keyword) => {
    if (!isNonEmptyString(keyword)) {
        return ['Keyword is required'];
    }
    const trimmed = keyword.trim();
    if (trimmed.length > PREFERENCE_MAX_LENGTH) {
        return [`Keyword must be at most ${PREFERENCE_MAX_LENGTH} characters`];
    }
    if (!PREFERENCE_REGEX.test(trimmed)) {
        return ['Keyword may only contain letters, numbers, spaces, "-" and "&"'];
    }
    return [];
};

const isValidArticleId = (id) => ARTICLE_ID_REGEX.test(id);

module.exports = { validateKeyword, isValidArticleId };
