<div align="center">

# 🚀 Freelance Platform — Backend API

**Production-ready REST API & Real-Time Backend built with NestJS**

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)
[![Jest](https://img.shields.io/badge/Jest-30-C21325?style=for-the-badge&logo=jest)](https://jestjs.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

> A full-featured freelance marketplace backend engineered at **Senior Backend Engineer** level — clean architecture, real-time communication, Redis caching, role-based access control, and comprehensive test coverage.

🌐 **Production URL:** [`https://hirehub-freelance-platform-1.onrender.com`](https://hirehub-freelance-platform-1.onrender.com)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Architecture Overview](#-architecture-overview)
- [Real-Time System](#-real-time-system)
- [Redis Cache Layer](#-redis-cache-layer)
- [Error Handling](#-error-handling)
- [Testing with Jest](#-testing-with-jest)
- [Environment Variables](#-environment-variables)
- [Run Locally with Docker Desktop](#-run-locally-with-docker-desktop)
- [Available Scripts](#-available-scripts)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **JWT Authentication** | Secure cookie-based auth with HTTP-only tokens, bcrypt password hashing |
| 👥 **Role-Based Access Control** | Admin, Freelancer, Client, and Support roles with dedicated Guards |
| 💬 **Real-Time Chat** | WebSocket-powered messaging with typing indicators, seen receipts, and online presence |
| 🔔 **Real-Time Notifications** | Instant push notifications via Socket.IO with multi-socket user support |
| ⚡ **Redis Cache** | Full caching layer (get/set/del/lpush/lrange/getJSON) with TTL support via ioredis |
| 💳 **Payment System** | Escrow-style payments — Hold, Release, Refund, Cancel with balance management |
| 📁 **Cloudinary Integration** | File/image upload using Cloudinary cloud storage |
| 📋 **Proposal & Contract Flow** | Full lifecycle: Project → Proposal → Contract → Payment |
| 🛡️ **Global Exception Filter** | Centralized error handling with structured JSON error responses |
| 🧪 **31 Test Suites** | Unit tests for all controllers, services, and guards using Jest + `@nestjs/testing` |
| 📦 **Repository Pattern** | Decoupled data access layer using interfaces and dependency injection |
| 🐳 **Docker Ready** | One-command startup with Docker Compose (App + MongoDB + Redis) |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 11 (Node.js 22) |
| Language | TypeScript 5.7 |
| Database | MongoDB 6 + Mongoose ODM |
| Cache | Redis 7 via ioredis |
| Real-Time | Socket.IO 4 + WebSocket Gateways |
| Auth | JWT (jsonwebtoken) + bcryptjs + Cookie Parser |
| Uploads | Cloudinary SDK + Multer |
| Validation | class-validator + class-transformer |
| Testing | Jest 30 + ts-jest + @nestjs/testing |
| Containerization | Docker + Docker Compose |

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/          # HTTP route handlers (REST endpoints)
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── client.controller.ts
│   │   ├── freelancer.controller.ts
│   │   ├── project.controller.ts
│   │   ├── proposal.controller.ts
│   │   ├── contract.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── message.controller.ts
│   │   └── notification.controller.ts
│   │
│   ├── services/             # Business logic layer
│   │   ├── auth.service.ts
│   │   ├── payment.service.ts
│   │   ├── notification.service.ts
│   │   └── ...
│   │
│   ├── repository/           # Data access layer (Repository Pattern)
│   │   ├── auth.repository.ts
│   │   ├── user.repository.ts
│   │   └── ...
│   │
│   ├── schemas/              # Mongoose schemas (MongoDB models)
│   │   ├── user.schema.ts
│   │   ├── project.schema.ts
│   │   ├── proposal.schema.ts
│   │   ├── contract.schema.ts
│   │   ├── payment.schema.ts
│   │   ├── message.schema.ts
│   │   └── notification.schema.ts
│   │
│   ├── gateways/             # WebSocket gateways (Real-Time)
│   │   ├── chat.gateway.ts         # Messaging, typing, seen receipts
│   │   └── notification.gateway.ts # Real-time push notifications
│   │
│   ├── guards/               # Route protection (RBAC)
│   │   ├── auth.guard.ts
│   │   ├── admin.guard.ts
│   │   ├── client.guard.ts
│   │   └── freelancer.guard.ts
│   │
│   ├── modules/              # NestJS feature modules (DI wiring)
│   │
│   ├── redis/                # Redis cache layer
│   │   ├── redis.module.ts
│   │   ├── redis.service.ts        # ioredis client init
│   │   └── redis.helper.ts         # get/set/del/lpush/getJSON helpers
│   │
│   ├── dtos/                 # Data Transfer Objects (validation schemas)
│   │
│   ├── interfaces/           # TypeScript interfaces & repository contracts
│   │
│   ├── enums/                # Typed enums (roles, statuses, types)
│   │
│   ├── filters/
│   │   └── error.filter.ts         # Global exception filter
│   │
│   ├── libs/
│   │   ├── helpers.ts              # Shared utility functions
│   │   ├── messages.ts             # Centralized response messages
│   │   ├── debug.logger.ts         # Custom NestJS logger
│   │   ├── cloudinary.ts           # Cloudinary upload helper
│   │   └── proposal.helper.ts      # Proposal business logic helpers
│   │
│   ├── socket/
│   │   └── socket.adapter.ts       # JWT-authenticated WebSocket adapter
│   │
│   ├── token/
│   │   ├── token.module.ts
│   │   └── token.service.ts        # JWT sign/verify service
│   │
│   ├── specs/                # All test files (Jest)
│   │   ├── controllers/      # 13 controller test suites
│   │   ├── services/         # 14 service test suites
│   │   └── guards/           # 4 guard test suites
│   │
│   ├── response.interceptor.ts     # Standardized API response wrapper
│   ├── validation.pipe.ts
│   ├── main.ts
│   └── app.module.ts
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## 🏗 Architecture Overview

This project follows a clean **layered architecture** separating concerns clearly:

```
HTTP Request
     │
     ▼
 Controller          ← Validates input via DTOs, routes to service
     │
     ▼
  Service            ← Business logic, orchestrates repositories
     │
     ▼
 Repository          ← Data access via Mongoose (implements interface)
     │
     ▼
  MongoDB            ← Persistent storage

        ↕ Redis      ← Cache layer used across services
        ↕ Socket.IO  ← Real-time events emitted from services
```

**Repository Pattern** — Every data entity has a typed interface (`IUserRepository`, `IProjectRepository`, etc.) injected via NestJS DI tokens. Services depend on abstractions, not implementations — making them fully testable with mocks.

---

## 📡 Real-Time System

Two WebSocket gateways power the real-time layer, both protected by a custom **JWT-authenticated Socket adapter** that verifies the token on every connection before the socket is established.

### Chat Gateway (`chat.gateway.ts`)
- Tracks online users per socket ID
- `send-message` → delivers message instantly to recipient's socket
- `typing` → forwards typing indicator to the receiver
- `message-seen` → notifies sender when message is read
- `online-users` → broadcasts updated online list on connect/disconnect

### Notification Gateway (`notification.gateway.ts`)
- Multi-socket user support (same user on multiple tabs/devices)
- `sendNotification()` → called from services to push real-time alerts
- `mark-as-read` → syncs read status in real time
- `receive-notification` → emitted to client with type + payload

---

## ⚡ Redis Cache Layer

The `RedisHelper` service wraps ioredis with a clean API used across the application for caching, rate limiting, and data structure operations:

```typescript
// String cache with optional TTL
await redisHelper.set('key', value, 300);   // expires in 5 min
await redisHelper.get('key');
await redisHelper.del('key');

// JSON helpers
await redisHelper.getJSON<User>('user:123');

// List operations (e.g. activity feeds, recent items)
await redisHelper.lpush('feed:userId', item);
await redisHelper.lrange('feed:userId', 0, 19);
await redisHelper.ltrim('feed:userId', 0, 19);

// Counters
await redisHelper.incr('views:projectId');
await redisHelper.decr('slots:projectId');
```

Redis is initialized on module startup via `OnModuleInit` and accessed globally through the injected `RedisHelper`.

---

## 🛡 Error Handling

A **Global Exception Filter** (`GlobalExceptionFilter`) catches every exception thrown anywhere in the application and returns a consistent, structured JSON error response:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Project not found",
  "path": "/api/projects/abc123",
  "timestamp": "2026-05-27T10:00:00.000Z"
}
```

- Handles both `HttpException` (NestJS built-ins) and unknown runtime errors
- Logs method, path, status, message, and full stack trace to the server console
- Paired with a `ResponseInterceptor` that wraps all successful responses:

```json
{
  "success": true,
  "message": "Project created successfully",
  "data": { ... }
}
```

All error messages are managed in a centralized `messages.ts` file — no magic strings scattered across the codebase.

---

## 🧪 Testing with Jest

The project has **31 test suites** covering the full application layer — this is not token coverage, this is real behavioral testing.

```
src/specs/
├── controllers/   auth, user, client, freelancer, project, proposal,
│                  contract, contract-option, proposal-option,
│                  freelancer-project, message, notification, payment
├── services/      auth, user, client, freelancer, project, proposal,
│                  proposal-option, proposal-helper, contract,
│                  contract-option, freelancer-project, message,
│                  notification, payment
└── guards/        auth, admin, client, freelancer
```

All tests use `@nestjs/testing` `TestingModule` with fully mocked repositories and services — zero database dependency.

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

Jest is configured with `ts-jest` for TypeScript support and path aliases (`src/*`) resolved correctly.

---

## 🔑 Environment Variables

Copy `.env.example` and fill in your values:

```env
# Server
PORT=4001

# Database
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>/<db>?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=10d

# Redis
REDIS_URL=redis://:<password>@<host>:<port>

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend (CORS)
FRONTEND_URL=http://localhost:3000
```

---

## 🐳 Run Locally with Docker Desktop

Make sure **Docker Desktop** is installed and running, then:

**1. Clone the repository**
```bash
git clone https://github.com/ZenZN99/HireHub-Freelance-Platform
cd freelance-platform-backend
```

**2. Set up environment variables**
```bash
cp .env.example .env
# Edit .env — for local Docker you can leave MONGO_URL and REDIS_URL as-is
# they are already set in docker-compose.yml for the local services
```

**3. Start everything with one command**
```bash
docker compose up --build
```

This will spin up three containers:

| Container | Service | Port |
|---|---|---|
| `freelance_platform_app` | NestJS API | `4001` |
| `mongo_db` | MongoDB 6 | `27017` |
| `redis_db` | Redis 7 | `6379` |

**4. Verify the server is running**
```bash
curl http://localhost:4001
```

**Stop the stack**
```bash
docker compose down
```

**Stop and remove volumes (full reset)**
```bash
docker compose down -v
```

---

## 📜 Available Scripts

```bash
npm run start:dev     # Development with hot-reload
npm run start:prod    # Run compiled production build
npm run build         # Compile TypeScript → dist/
npm test              # Run Jest test suites
npm run test:cov      # Jest with coverage report
npm run lint          # ESLint auto-fix
npm run format        # Prettier format
```

---

<div align="center">

Built with precision at **Senior Backend Engineer** level.  
Clean architecture · Real-time ready · Redis optimized · Fully tested.

</div>
