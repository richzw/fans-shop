# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A membership points-based e-commerce system (会员积分商城) with two roles: admin (manage products/users/orders) and regular users (browse, cart, purchase with points). Written in Chinese UI with English code.

## Development Commands

### Backend (server/)
```bash
cd server && npm install          # install dependencies
npm run dev                       # start with nodemon (port 3000)
npm start                         # start with plain node
node utils/initAdmin.js           # create default admin (admin/admin123)
cp .env.example .env              # set up env config
```

### Frontend (client/)
```bash
cd client && npm install          # install dependencies
npm run dev                       # Vite dev server (port 35173, not default 5173)
npm run build                     # production build
npm run preview                   # preview production build
```

### Docker
```bash
cp .env.docker .env && docker-compose up -d --build
./scripts/docker-init.sh          # init admin after services are up
```

### No test framework is configured. Verify changes manually.

## Architecture

### Monorepo: `client/` + `server/` with separate package.json files

**Frontend** — Vue 3 (Composition API) + Vite + Element Plus (zh-CN locale) + Pinia + Vue Router 4 + Axios
- `client/src/api/index.js` — Central Axios instance with JWT interceptor; all API modules (authApi, userApi, productApi, cartApi, orderApi) exported from here
- `client/src/stores/` — Pinia stores using Composition API style (`useUserStore`, `useCartStore`); auth state persisted to localStorage
- `client/src/router/index.js` — Route guards check `localStorage` token/user for auth; `meta.requiresAdmin` for admin routes
- `client/src/views/admin/` — Admin pages nested under `/admin` route with `Admin.vue` as layout wrapper
- Vite proxy: `/api` and `/uploads` requests proxy to `http://localhost:3000`

**Backend** — Express + Mongoose (MongoDB) + JWT + Multer + Nodemailer
- `server/app.js` — Entry point; mounts routes at `/api/{auth,users,products,cart,orders}`
- `server/middleware/auth.js` — `protect` (JWT verification) and `admin` (role check) middleware
- `server/models/` — Mongoose schemas: User (with bcrypt pre-save hook), Product, Cart (one per user), Order
- `server/config/db.js` — MongoDB connection via `MONGODB_URI` env var
- `server/config/email.js` — Nodemailer transport; `sendOrderNotification()` emails admin on new orders
- `server/uploads/` — Local file storage for product images (served as static files)

### Key Data Flow
- **Auth**: Login returns JWT + user object → stored in localStorage → Axios interceptor attaches `Bearer` token → `protect` middleware verifies
- **Points economy**: Users have `points` balance. Ordering deducts points and reduces product `stock`. Both checked server-side before order creation.
- **Cart**: One Cart document per user (userId is unique). Cart items reference Product by ObjectId.
- **Orders**: Snapshot product name/points into order items (denormalized). Status flow: `pending` → `shipped` → `completed`.

## Environment Variables (server/.env)

`PORT`, `MONGODB_URI`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL`

## Conventions

- CommonJS (`require`/`module.exports`) in server; ES modules (`import`/`export`) in client
- Vue components use PascalCase filenames; stores/api use camelCase
- Route handlers are defined inline in `server/routes/*.js` (no separate controllers directory)
- UI text is in Chinese; code identifiers and comments are a mix of Chinese and English
