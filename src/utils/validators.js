const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const isValidPreferences = (value) => Array.isArray(value) && value.every(isNonEmptyString);

module.exports = { isNonEmptyString, isValidPreferences };
