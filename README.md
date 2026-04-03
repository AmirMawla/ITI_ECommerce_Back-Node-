# ShopIQ — E-Commerce API (Node.js)

REST API for the ShopIQ e-commerce platform: customers, sellers, admins, products, orders, payments (Kashier), cart, reviews, favorites, banners, and file uploads (ImageKit). Built with **Express 5**, **MongoDB** (Mongoose), and **JWT** authentication.

## Requirements

- **Node.js** 18+ (recommended)
- **MongoDB** (local or Atlas)
- Optional: **RabbitMQ** (email queue), **ImageKit** account (images), **Kashier** test keys (payments)

## Quick start

1. **Clone / open** this folder and install dependencies:

   ```bash
   npm install
   ```

2. **Environment**

   ```bash
   copy .env.example .env
   ```

   On Linux/macOS: `cp .env.example .env`

   Edit `.env` and set at least:

   - `MONGODB_URI` — base URI without trailing slash (e.g. `mongodb://127.0.0.1:27017`)
   - `DB_NAME` — database name (app uses `MONGODB_URI/DB_NAME`)
   - `JWT_SECRET` — strong random string
   - `FRONTEND_URL` — Angular app URL (default `http://localhost:4200`)

   Add Kashier, SMTP, RabbitMQ, ImageKit, and Google OAuth values when you use those features.

3. **Run the API**

   ```bash
   npm run dev
   ```

   Default port: `PORT` from `.env`, or **3000** if unset.

4. **Seed data (optional)**

   ```bash
   npm run seed:admin
   npm run seed:all
   ```

   See `seeds/` and `.env.example` for optional `SEED_*` variables.

## NPM scripts

| Script | Description |
|--------|-------------|
| `npm start` | Run server (`node index.js`) |
| `npm run dev` | Dev server with nodemon |
| `npm run worker` | Email worker (`Workers/index.js`) |
| `npm run worker:dev` | Email worker with nodemon |
| `npm run dev:all` | API + worker together (concurrently) |
| `npm run seed:admin` | Seed admin user |
| `npm run seed:all` | Full seed |
| `npm run seed:reset` | Seed with reset flag |

## Project layout (high level)

| Path | Role |
|------|------|
| `index.js` | Express app entry, MongoDB connect, routes |
| `routes/` | HTTP route definitions |
| `controllers/` | Request handlers |
| `services/` | Business logic (orders, payments, email, etc.) |
| `models/` | Mongoose models |
| `middlewares/` | Auth, validation, rate limit, errors |
| `schemas/` | Joi validation schemas |
| `Config/` | RabbitMQ and shared config |
| `Workers/` | Background email worker |
| `seeds/` | Database seed scripts |

## API surface (prefixes)

Routes are mounted as follows (see `index.js`):

- `/auth` — login, register, Google OAuth, tokens
- `/users` — user profile and related
- `/admin` — admin operations (users, categories, products, banners, approvals, etc.)
- `/favourites` — wishlist
- `/reviews` — product reviews
- `/cart` — shopping cart
- `/orders` — checkout, Kashier webhook, order status
- `/payments` — payment-related endpoints
- `/banners` — marketing banners
- `/seller` — seller store and products
- `/products` — public product catalog
- `/categories` — categories

Use `Authorization: Bearer <JWT>` for protected routes.

## Payments (Kashier)

Configure `KASHIER_*`, `WEBHOOK_URL` (must be reachable by Kashier, often via **HTTPS** tunnel such as ngrok), and `FRONTEND_URL` for redirects. Webhook route: `POST /orders/webhook/kashier`.

## Email queue

Email sending uses **RabbitMQ** when the worker is running. Set `RABBITMQ_URL` and run `npm run worker` or `npm run dev:all`.

## Security notes

- Never commit `.env` — only `.env.example` with placeholders.
- Rotate JWT, API keys, and SMTP credentials for production.
- Use HTTPS and a proper `WEBHOOK_URL` in production.

## License

Private / project use unless otherwise specified.
