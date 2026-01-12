---
trigger: always_on
---

## Project Overview

This is a modular ERP system built with **Deno** and **TypeScript**, following
Clean Architecture principles. The system manages resources like items,
inventories, spaces, trades, and contacts, with AI-powered features for natural
language item queries.

### Tech Stack

- **Runtime**: Deno (with `--allow-all` and env-file support)
- **Web Framework**: Hono (OpenAPI-enabled)
- **Database**: MySQL with Kysely ORM
- **Caching**: Redis
- **Storage**: AWS S3
- **AI Integration**: Google Gemini AI
- **Monitoring**: Sentry
- **Validation**: Zod
- **Testing**: Built-in Deno test runner with fast-check

### Key Commands

```bash
deno task start          # Start production server
deno task dev            # Start development server with watch mode
deno task test           # Run all tests
deno task db:generate    # Generate database types from schema
deno task create:module  # Scaffold a new module
```

## Architecture Pattern

The codebase follows **Clean Architecture** with **Domain-Driven Design**
principles, organized into four distinct layers:

### Layer Structure (Top → Bottom)

```
Presentation (API Layer)
    ↓
Application (Business Logic Layer)
    ↓
Infrastructure (Implementation Layer)
    ↓
Domain (Core Business Entities)
```

## Key Technologies & Libraries

### Hono + OpenAPI

- **Purpose**: Web framework with automatic OpenAPI documentation
- **Usage**: Define routes using `createRoute()` from `@hono/zod-openapi`
- **Key Features**:
  - Automatic schema validation
  - Swagger UI at `/swagger`
  - OpenAPI spec at `/doc`
  - Bearer authentication support

### Kysely (Database ORM)

- **Purpose**: Type-safe SQL query builder
- **Database**: MySQL
- **Usage**:
  - Database types generated via `kysely-codegen` in `database.d.ts`
  - Access via singleton `getDatabase()` function
  - Repository pattern for all database operations

**ALWAYS** check Kysely documentation via Context7 before writing database
queries.

### Zod (Validation)

- **Purpose**: Runtime type validation and OpenAPI schema generation
- **Usage**:
  - Define request body validators in `validators/` directory
  - Define response schemas in `schemas/` directory
  - Use `.openapi()` decorator for documentation
  - Export inferred types as TypeScript types

### Redis (Caching)

- **Purpose**: Caching layer for session management and data caching
- **Usage**: Access via singleton `getRedis()` function
- **Integration**: Used in auth repositories for token management

### AWS S3 (Storage)

- **Purpose**: File storage for uploads
- **Usage**: Presigned URLs for secure uploads/downloads
- **Service**: Located in `src/shared/infrastructure/storage/`

### Google Gemini AI

- **Purpose**: Natural language queries for item search
- **Usage**: Function calling pattern to query items
- **Implementation**: `ItemAiService` in item module
- **Model**: gemini-2.5-flash-lite

### Sentry

- **Purpose**: Error tracking and monitoring
- **Usage**: Initialized in `src/main.ts`
