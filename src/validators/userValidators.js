const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignores everything after the first 72 bytes
const MAX_PREFERENCES = 20;
const PREFERENCE_MAX_LENGTH = 50;
// Letters, digits, spaces, "-" and "&" only, so preferences can't alter the news search query
const PREFERENCE_REGEX = /^[\p{L}\p{N} &-]+$/u;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

const validatePreferences = (preferences) => {
    if (!Array.isArray(preferences)) {
        return ['Preferences must be an array of strings'];
    }

    const errors = [];
    if (preferences.length > MAX_PREFERENCES) {
        errors.push(`At most ${MAX_PREFERENCES} preferences are allowed`);
    }
    preferences.forEach((preference, index) => {
        if (!isNonEmptyString(preference)) {
            errors.push(`Preference at index ${index} must be a non-empty string`);
        } else if (preference.trim().length > PREFERENCE_MAX_LENGTH) {
            errors.push(`Preference at index ${index} must be at most ${PREFERENCE_MAX_LENGTH} characters`);
        } else if (!PREFERENCE_REGEX.test(preference.trim())) {
            errors.push(`Preference at index ${index} may only contain letters, numbers, spaces, "-" and "&"`);
        }
    });
    return errors;
};

const validateSignup = ({ name, email, password, preferences }) => {
    const errors = [];

    if (!isNonEmptyString(name)) {
        errors.push('Name is required');
    } else if (name.trim().length > NAME_MAX_LENGTH) {
        errors.push(`Name must be at most ${NAME_MAX_LENGTH} characters`);
    }

    if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email.trim())) {
        errors.push('A valid email is required');
    } else if (email.trim().length > EMAIL_MAX_LENGTH) {
        errors.push(`Email must be at most ${EMAIL_MAX_LENGTH} characters`);
    }

    if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH
        || Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) {
        errors.push(`Password must be between ${PASSWORD_MIN_LENGTH} and ${PASSWORD_MAX_BYTES} characters`);
    }

    if (preferences !== undefined) {
        errors.push(...validatePreferences(preferences));
    }

    return errors;
};

const validateLogin = ({ email, password }) => {
    const errors = [];
    if (!isNonEmptyString(email)) {
        errors.push('Email is required');
    }
    if (typeof password !== 'string' || password === '') {
        errors.push('Password is required');
    }
    return errors;
};

// Trim entries and drop duplicates while keeping the original order
const normalizePreferences = (preferences) => [...new Set(preferences.map((p) => p.trim()))];

const sendValidationError = (res, details) => {
    return res.status(400).json({ error: 'Validation failed', details });
};

module.exports = {
    PREFERENCE_MAX_LENGTH,
    PREFERENCE_REGEX,
    isNonEmptyString,
    validateSignup,
    validateLogin,
    validatePreferences,
    normalizePreferences,
    sendValidationError
};
