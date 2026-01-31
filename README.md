# 📝 Blogging Platform API

A production-ready RESTful API for a blogging platform built with Node.js, Express, and MongoDB.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://blogging-platform-api-swart.vercel.app)
[![API Docs](https://img.shields.io/badge/docs-swagger-blue)](https://blogging-platform-api-swart.vercel.app/api/v1/docs)

---

## 🚀 Features

- **Authentication** - JWT-based with access & refresh tokens
- **Post Management** - CRUD operations with pagination & search
- **Comments** - Nested comments with replies
- **File Upload** - Cloudinary integration for images
- **Security** - Helmet, CORS, rate limiting, input validation

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| Upload | Cloudinary + Multer |
| Docs | Swagger UI |
| Testing | Jest + Supertest |
| Deploy | Vercel |

---

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/refresh` | Refresh tokens |
| POST | `/api/v1/auth/logout` | Logout user |
| GET | `/api/v1/auth/me` | Get current user |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/posts` | Get all posts |
| GET | `/api/v1/posts/:id` | Get single post |
| POST | `/api/v1/posts` | Create post |
| PUT | `/api/v1/posts/:id` | Update post |
| DELETE | `/api/v1/posts/:id` | Delete post |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/posts/:postId/comments` | Get comments |
| POST | `/api/v1/posts/:postId/comments` | Add comment |

📖 **Full documentation:** [Swagger UI](https://blogging-platform-api-swart.vercel.app/api/v1/docs)

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Cloudinary account

### Installation

```bash
# Clone repository
git clone https://github.com/saifullahmsd/blogging-platform-api.git
cd blogging-platform-api

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Environment Variables

```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/blogging-platform

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Test Coverage:** 87 tests (integration + unit)

---

## 📁 Project Structure

```
src/
├── api/           # Express app configuration
├── config/        # Database, logger, swagger config
├── controllers/   # Route handlers
├── middlewares/   # Auth, validation, upload
├── models/        # Mongoose schemas
├── routes/        # API routes
├── services/      # Business logic
├── utils/         # Helpers & utilities
└── validators/    # Joi validation schemas
```

---

## 🔐 Security

- **Helmet** - HTTP security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - 100 requests per 15 minutes
- **JWT** - Secure token-based auth
- **bcrypt** - Password hashing
- **Joi** - Input validation

---

## 📄 License

MIT © [Saif Ullah](https://github.com/saifullahmsd)
