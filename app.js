require('dotenv').config();

const express = require('express');
const userRoutes = require('./src/routes/userRoutes');
const newsRoutes = require('./src/routes/newsRoutes');
const { PORT } = require('./src/config');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRoutes);
app.use('/news', newsRoutes);

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Fallback error handler so unexpected failures return JSON instead of hanging
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON in request body' });
    }
    if (err.status) {
        return res.status(err.status).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
});

// Only start listening when run directly (not when required by tests)
if (require.main === module) {
    app.listen(PORT, (err) => {
        if (err) {
            return console.log('Something bad happened', err);
        }
        console.log(`Server is listening on ${PORT}`);
    });
}

module.exports = app;
