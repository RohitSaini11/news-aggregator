const { isValidPreferences } = require('../utils/validators');

const getPreferences = (req, res) => {
    return res.status(200).json({ preferences: req.user.preferences });
};

const updatePreferences = (req, res) => {
    const { preferences } = req.body;

    if (!isValidPreferences(preferences)) {
        return res.status(400).json({ error: 'Preferences must be an array of strings' });
    }

    // Trim entries and drop duplicates while keeping the original order
    req.user.preferences = [...new Set(preferences.map((p) => p.trim()))];

    return res.status(200).json({
        message: 'Preferences updated successfully',
        preferences: req.user.preferences
    });
};

module.exports = { getPreferences, updatePreferences };
