# microblog-api

REST API for Whispr — a microblogging social platform. Built with Node.js, Express, Prisma, and PostgreSQL.

> **Frontend repo:** [https://github.com/ELE-00/microblog-app](https://github.com/ELE-00/microblog-app)

## Features

- JWT authentication (signup, login)
- User profiles with avatar and banner image uploads via Cloudinary
- Post creation with optional image attachments
- Like / unlike posts
- Comment on posts, delete own comments
- Follow / unfollow users, remove followers
- Feed scoped to self + followed users
- Real-time presence events via Socket.IO
- Rate limiting on auth endpoints
- Input validation with express-validator
- CORS origin whitelist

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (CommonJS) |
| Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Passwords | bcrypt |
| Image uploads | Multer + Cloudinary |
| Real-time | Socket.IO |
| Testing | Jest + Supertest |



## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Cloudinary account (free tier works)

### Installation

```bash
git clone https://github.com/ELE-00/microblog-api.git
cd microblog-api
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/microblog_api"
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-url.vercel.app
JWT_SECRET="your_jwt_secret_here"
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Database Setup

```bash
# Run migrations
npx prisma migrate deploy

# (Optional) Seed with sample users
npx prisma db seed
```

### Running

```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

The server starts on **port 3000**.

## API Reference

All protected routes require an `Authorization: Bearer <token>` header.

### Auth — `POST /api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup` | No | Create account. Body: `{ username, password, passwordConfirm }` |
| POST | `/api/auth/login` | No | Login. Body: `{ username, password }`. Returns `{ token, user }` |

> Auth endpoints are rate-limited to 10 requests per 15 minutes.

### Posts — `GET/POST/DELETE /api/posts`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts/` | Create a post. `multipart/form-data`: `content` (text), `postimage` (file, optional) |
| GET | `/api/posts/` | Get feed (own posts + followed users' posts) |
| GET | `/api/posts/:id` | Get single post with comments and like count |
| DELETE | `/api/posts/:id` | Delete own post |
| POST | `/api/posts/:id/like` | Like a post |
| POST | `/api/posts/:id/unlike` | Unlike a post |
| GET | `/api/posts/:id/liked` | Check if current user liked a post |
| POST | `/api/posts/:id/comments` | Add a comment. Body: `{ content }` |
| GET | `/api/posts/:id/comments` | Get comments for a post |
| DELETE | `/api/posts/comments/:id` | Delete own comment |

### Follow — `/api/follow`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/follow/:id/follow` | Follow a user |
| POST | `/api/follow/:id/unfollow` | Unfollow a user |
| POST | `/api/follow/:id/removefollower` | Remove a follower |
| GET | `/api/follow/followers/:id` | Get followers list for user |
| GET | `/api/follow/following/:id` | Get following list for user |

### Profile — `/api/profile`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profile/me` | Get logged-in user's profile |
| PATCH | `/api/profile/` | Update profile. Body: `{ name, bio, occupation, location, dateOfBirth }` |
| POST | `/api/profile/photo` | Upload profile picture. `multipart/form-data`: `photo` |
| POST | `/api/profile/banner` | Upload banner image. `multipart/form-data`: `banner` |

### Users — `/api/user`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/` | Get all users (with profiles) |
| GET | `/api/user/:id` | Get user profile and posts |

## Project Structure

```
microblog-api/
├── server.js              # Express app setup and route mounting
├── script.js              # Prisma client singleton
├── middleware/
│   └── authenticateToken.js  # JWT auth middleware
├── src/
│   ├── routes/            # Express routers
│   │   ├── authRouter.js
│   │   ├── postsRouter.js
│   │   ├── followRouter.js
│   │   ├── profileRouter.js
│   │   └── userRouter.js
│   └── controllers/       # Request handlers (higher-order function pattern)
│       ├── authController.js
│       ├── postsController.js
│       ├── followController.js
│       ├── profileController.js
│       └── userController.js
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.js            # Sample data seeder
│   └── migrations/
└── __tests__/             # Jest test suites
    ├── auth.test.js
    ├── posts.test.js
    ├── follow.test.js
    └── comments-likes.test.js
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

Tests use **Jest** and **Supertest**. Prisma and Cloudinary are mocked — no real database or network calls are made.

## Deployment

The API is deployed on [Railway](https://railway.app) / [Render](https://render.com) (or your preferred platform).

Set the following environment variables in your hosting dashboard:

- `DATABASE_URL` — production PostgreSQL connection string
- `ALLOWED_ORIGINS` — comma-separated list of allowed frontend origins (e.g. `https://your-app.vercel.app`)
- `JWT_SECRET` — strong random secret
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

After deploying, run migrations:

```bash
npx prisma migrate deploy
```
