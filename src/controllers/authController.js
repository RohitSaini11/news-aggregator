const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const users = require('../data/users');
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require('../config');
const {
    validateSignup,
    validateLogin,
    normalizePreferences,
    sendValidationError
} = require('../validators/userValidators');

const signup = async (req, res, next) => {
    try {
        const errors = validateSignup(req.body);
        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        const { name, email, password, preferences = [] } = req.body;

        const normalizedEmail = email.trim().toLowerCase();
        if (users.some((user) => user.email === normalizedEmail)) {
            return res.status(409).json({ error: 'Email is already registered' });
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const user = {
            id: crypto.randomUUID(),
            name: name.trim(),
            email: normalizedEmail,
            passwordHash,
            preferences: normalizePreferences(preferences)
        };
        users.push(user);

        return res.status(200).json({
            message: 'User registered successfully',
            user: { id: user.id, name: user.name, email: user.email, preferences: user.preferences }
        });
    } catch (err) {
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const errors = validateLogin(req.body);
        if (errors.length > 0) {
            return sendValidationError(res, errors);
        }

        const { email, password } = req.body;

        const user = users.find((u) => u.email === email.trim().toLowerCase());
        const passwordMatches = user && await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        return res.status(200).json({ token });
    } catch (err) {
        next(err);
    }
};

module.exports = { signup, login };
