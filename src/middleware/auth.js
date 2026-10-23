const jwt = require('jsonwebtoken');
const users = require('../data/users');
const { JWT_SECRET } = require('../config');

const unauthorized = (res, message) => {
    res.set('WWW-Authenticate', 'Bearer');
    return res.status(401).json({ error: message });
};

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return unauthorized(res, 'Authorization token missing or malformed');
    }

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
        const message = err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
        return unauthorized(res, message);
    }

    // Tokens can outlive the in-memory store (e.g. after a restart)
    const user = users.find((u) => u.id === payload.id);
    if (!user) {
        return unauthorized(res, 'User not found for this token');
    }

    req.user = user;
    next();
};

module.exports = authenticate;
