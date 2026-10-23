const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const users = require('../data/users');
const { JWT_SECRET, JWT_EXPIRES_IN, SALT_ROUNDS } = require('../config');
const { isNonEmptyString, isValidPreferences } = require('../utils/validators');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

const signup = async (req, res, next) => {
    try {
        const { name, email, password, preferences = [] } = req.body;

        if (!isNonEmptyString(name)) {
            return res.status(400).json({ error: 'Name is required' });
        }
        if (!isNonEmptyString(email) || !EMAIL_REGEX.test(email)) {
            return res.status(400).json({ error: 'A valid email is required' });
        }
        if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
        }
        if (!isValidPreferences(preferences)) {
            return res.status(400).json({ error: 'Preferences must be an array of strings' });
        }

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
            preferences
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
        const { email, password } = req.body;

        if (!isNonEmptyString(email) || typeof password !== 'string' || password === '') {
            return res.status(400).json({ error: 'Email and password are required' });
        }

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
