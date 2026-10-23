const {
    validatePreferences,
    normalizePreferences,
    sendValidationError
} = require('../validators/userValidators');

const getPreferences = (req, res) => {
    return res.status(200).json({ preferences: req.user.preferences });
};

const updatePreferences = (req, res) => {
    const { preferences } = req.body;

    const errors = validatePreferences(preferences);
    if (errors.length > 0) {
        return sendValidationError(res, errors);
    }

    req.user.preferences = normalizePreferences(preferences);

    return res.status(200).json({
        message: 'Preferences updated successfully',
        preferences: req.user.preferences
    });
};

module.exports = { getPreferences, updatePreferences };
