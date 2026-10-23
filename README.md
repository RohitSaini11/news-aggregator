# News Aggregator API

A RESTful API for a personalised news aggregator, built with Node.js and Express. Users sign up, log in to get a JWT, save their news preferences, and get articles from [NewsAPI](https://newsapi.org) that match those preferences.

## Features

- **Authentication**: sign up and log in. Passwords are hashed with bcrypt, and protected routes use JWT bearer tokens.
- **User preferences**: read and update the topics a user wants news about.
- **Personalised news**: articles fetched from NewsAPI based on the user's preferences.
- **Keyword search**: search news by any keyword.
- **Read and favourite articles**: mark articles as read or favourite and list them later.
- **Caching**: fetched articles are kept in an in-memory cache, so repeat requests don't call NewsAPI again.
- **Background refresh**: cache entries people are still using are re-fetched periodically to keep news fresh.
- **Input validation and consistent JSON errors** on every endpoint.

**Tech stack:** Node.js, Express, bcrypt, jsonwebtoken, axios, dotenv. Tests use tap and supertest.

## Getting started

### Prerequisites

- Node.js 18 or later
- A free API key from [newsapi.org](https://newsapi.org/register). This is optional, see below.

### Installation

```bash
git clone <your-fork-url>
cd news-aggregator
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
PORT=3000
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=1h
NEWS_API_KEY=your-newsapi-key
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | `dev-secret` | Secret used to sign JWTs. **Always set this outside local development.** |
| `JWT_EXPIRES_IN` | `1h` | Token lifetime (e.g. `30m`, `1h`, `7d`) |
| `NEWS_API_KEY` | *(none)* | NewsAPI key. Without it, `/news` and `/news/search` return `200` with an empty list and a message. |
| `NEWS_CACHE_TTL_MS` | `1800000` (30 min) | How long cached articles are considered fresh |
| `NEWS_REFRESH_INTERVAL_MS` | `1500000` (25 min) | How often the background job refreshes the cache |

Every variable is optional. With no `.env` at all, the API and tests still run.

### Run the server

```bash
npm start
```

The server listens on `http://localhost:3000`.

## API reference

Protected endpoints need this header:

```
Authorization: Bearer <token>
```

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/users/signup` | — | Register a new user |
| POST | `/users/login` | — | Log in and get a JWT |
| GET | `/users/preferences` | ✅ | Get the logged-in user's preferences |
| PUT | `/users/preferences` | ✅ | Replace the logged-in user's preferences |
| GET | `/news` | ✅ | News based on the user's preferences |
| GET | `/news/search/:keyword` | ✅ | Search news by keyword |
| POST | `/news/:id/read` | ✅ | Mark an article as read |
| POST | `/news/:id/favorite` | ✅ | Mark an article as a favourite |
| GET | `/news/read` | ✅ | List read articles (newest first) |
| GET | `/news/favorites` | ✅ | List favourite articles (newest first) |

### `POST /users/signup`

Request:

```json
{
  "name": "Clark Kent",
  "email": "clark@superman.com",
  "password": "Krypt()n8",
  "preferences": ["movies", "comics"]
}
```

`preferences` is optional and defaults to `[]`. Emails are stored in lowercase, and preferences are trimmed and de-duplicated.

Response `200`:

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "d516e43a-b926-4050-81e2-53af1018b092",
    "name": "Clark Kent",
    "email": "clark@superman.com",
    "preferences": ["movies", "comics"]
  }
}
```

Errors: `400` validation failed · `409` email already registered

### `POST /users/login`

Request:

```json
{ "email": "clark@superman.com", "password": "Krypt()n8" }
```

Response `200`:

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

Errors: `400` missing email or password · `401` invalid email or password. The same message is used for both cases, so the response doesn't reveal which emails are registered.

### `GET /users/preferences`

Response `200`:

```json
{ "preferences": ["movies", "comics"] }
```

Errors: `401` missing, invalid or expired token

### `PUT /users/preferences`

Request:

```json
{ "preferences": ["movies", "comics", "games"] }
```

Response `200`:

```json
{
  "message": "Preferences updated successfully",
  "preferences": ["movies", "comics", "games"]
}
```

An empty array clears the preferences.

Errors: `400` validation failed · `401` unauthorised

### `GET /news`

Fetches articles matching *any* of the user's preferences, using NewsAPI's `/everything` endpoint. Results are English, newest first, up to 20 articles.

Response `200`:

```json
{
  "news": [
    {
      "id": "ce4d1ddd0e3cf322",
      "title": "Article title",
      "description": "Short summary…",
      "url": "https://example.com/article",
      "source": "Example News",
      "author": "Jane Doe",
      "imageUrl": "https://example.com/image.jpg",
      "publishedAt": "2026-10-22T20:08:04Z"
    }
  ],
  "cached": false
}
```

- `id` is created from the article URL, so the same article always has the same id. Use it with the read and favourite endpoints.
- `cached` is `true` when the articles came from the cache.
- `stale: true` is added when NewsAPI is failing and an older cached copy is returned instead of an error.
- If the user has no preferences, or `NEWS_API_KEY` isn't set, the response is `{ "news": [], "message": "..." }`.

Errors: `401` unauthorised · `502` NewsAPI rejected the key or returned an error · `503` NewsAPI rate limit reached · `504` NewsAPI timed out

### `GET /news/search/:keyword`

Searches news for an exact keyword or phrase, e.g. `/news/search/artificial%20intelligence`. The response has the same shape as `GET /news`, and results are cached per keyword (case-insensitive).

Errors: `400` invalid keyword · `401` · `502` / `503` / `504` as above

### `POST /news/:id/read` and `POST /news/:id/favorite`

Marks an article as read or as a favourite. The article must already have been returned to someone by `GET /news` or a search. Marking the same article again has no effect.

Response `200`:

```json
{
  "message": "Article marked as read",
  "article": { "id": "ce4d1ddd0e3cf322", "title": "…", "readAt": "2026-10-23T20:08:51.925Z" }
}
```

Favourites carry `favoritedAt` instead of `readAt`.

Errors: `400` malformed id (it must be 16 hex characters) · `401` · `404` article not found

### `GET /news/read` and `GET /news/favorites`

Response `200`, newest first:

```json
{ "news": [ { "id": "ce4d1ddd0e3cf322", "title": "…", "readAt": "…" } ] }
```

Errors: `401`

## Validation rules

| Field | Rules |
|---|---|
| `name` | Required, 1–100 characters |
| `email` | Required, valid format, at most 254 characters, unique |
| `password` | Required, 8–72 characters (bcrypt only uses the first 72 bytes) |
| `preferences` | Array of at most 20 strings. Each is 1–50 characters of letters, digits, spaces, `-` or `&`. |
| `:keyword` | Same rules as a single preference |
| `:id` | 16 lowercase hex characters |

Preferences and keywords are limited to these characters because they are inserted into the NewsAPI search query. Quotes or brackets could otherwise change the meaning of that query.

## Error handling

Every error is returned as JSON.

```json
{ "error": "Invalid email or password" }
```

Validation errors list every problem at once:

```json
{
  "error": "Validation failed",
  "details": ["A valid email is required", "Password must be between 8 and 72 characters"]
}
```

| Status | When |
|---|---|
| `400` | Validation failed, or the request body is malformed JSON |
| `401` | Missing, malformed, invalid or expired token (with a `WWW-Authenticate: Bearer` header); wrong login credentials |
| `404` | Unknown route, or the article id isn't known |
| `409` | Email already registered |
| `413` | Request body larger than 100 KB |
| `500` | Unexpected server error |
| `502` | NewsAPI rejected the key, returned an error, or couldn't be reached |
| `503` | NewsAPI rate limit reached |
| `504` | NewsAPI timed out |

## Caching and background refresh

- **Cache key:** the user's preferences, lowercased and sorted, or the search keyword. Users with the same preferences share one cache entry.
- **Expiry:** an entry is fresh for 30 minutes (`NEWS_CACHE_TTL_MS`). At most 100 entries are kept; when full, the oldest is dropped.
- **Shared requests:** simultaneous requests for the same key share one NewsAPI call.
- **Old data on failure:** if a refresh fails but an older copy exists, that copy is returned with `stale: true` instead of an error.
- **NewsAPI calls:** each call has a 10-second timeout and is retried once after a timeout or network error.
- **Background job:** every 25 minutes (`NEWS_REFRESH_INTERVAL_MS`), the job re-fetches cache entries requested in the last hour and drops the rest. It runs only when `NEWS_API_KEY` is set, and never during tests.

NewsAPI's free plan allows 100 requests a day. One active query refreshed every 25 minutes uses about 58 of them, so increase the interval if you have several active users.

## Testing

```bash
npm run test
```

This runs the test suite in `test/server.test.js`, covering signup, login, preferences and news. All tests pass with or without a `NEWS_API_KEY`. When a key is set in `.env`, the `/news` test calls the real NewsAPI.

### Manual testing with curl

The same requests work in Postman.

```bash
# 1. Sign up
curl -X POST http://localhost:3000/users/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Clark Kent","email":"clark@superman.com","password":"Krypt()n8","preferences":["technology","football"]}'

# 2. Log in and copy the token from the response
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"clark@superman.com","password":"Krypt()n8"}'

TOKEN=<paste token here>

# 3. Preferences
curl http://localhost:3000/users/preferences -H "Authorization: Bearer $TOKEN"
curl -X PUT http://localhost:3000/users/preferences \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"preferences":["technology","space"]}'

# 4. News and search (run twice to see "cached": true)
curl http://localhost:3000/news -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/news/search/artificial%20intelligence -H "Authorization: Bearer $TOKEN"

# 5. Read and favourites (use an "id" from step 4)
curl -X POST http://localhost:3000/news/<id>/read -H "Authorization: Bearer $TOKEN"
curl -X POST http://localhost:3000/news/<id>/favorite -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/news/read -H "Authorization: Bearer $TOKEN"
curl http://localhost:3000/news/favorites -H "Authorization: Bearer $TOKEN"
```

## Project structure

```
.
├── app.js                       # Express app: middleware, routes, error handling, server start
├── src/
│   ├── config.js                # Settings, read from environment variables with defaults
│   ├── controllers/
│   │   ├── authController.js    # Signup and login
│   │   ├── preferencesController.js
│   │   └── newsController.js    # News, search, read and favourites
│   ├── data/
│   │   ├── users.js             # In-memory user store
│   │   └── articles.js          # In-memory store of served articles, looked up by id
│   ├── jobs/
│   │   └── newsRefresher.js     # Periodic background cache refresh
│   ├── middleware/
│   │   └── auth.js              # JWT verification for protected routes
│   ├── routes/
│   │   ├── userRoutes.js        # /users/*
│   │   └── newsRoutes.js        # /news/*
│   ├── services/
│   │   ├── newsService.js       # NewsAPI calls, error mapping, article formatting
│   │   └── newsCache.js         # In-memory cache with TTL, shared requests and stale fallback
│   └── validators/
│       ├── userValidators.js    # Signup, login and preference validation
│       └── newsValidators.js    # Keyword and article id validation
└── test/
    └── server.test.js
```

## Notes and limitations

- **Data is kept in memory.** Users, preferences, read and favourite lists, and the cache are lost when the server restarts. Tokens issued before a restart are rejected with `401`, because their user no longer exists.
- **NewsAPI free plan:** it only accepts requests from `localhost`, and allows 100 requests a day.
- **Endpoint paths:** the brief mentions `/register`, `/login` and `/preferences`. This API uses `/users/signup`, `/users/login` and `/users/preferences`, because those are the paths the provided test suite checks.
