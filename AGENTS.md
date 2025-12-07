# AGENTS.md

This document provides comprehensive guidance for AI agents working with this codebase.

## Critical: Documentation Lookup via Context7

**MANDATORY**: Before generating any code or answering code-related questions, you MUST use Context7 MCP to fetch up-to-date documentation. Do NOT rely on prior knowledge for libraries and frameworks.

### Required Workflow

1. **Always call `mcp_Context7_resolve_library_id`** first to get the correct library ID
2. **Then call `mcp_Context7_get_library_docs`** with the resolved ID to fetch current documentation
3. Only after retrieving documentation should you generate code or provide answers

### Libraries to Look Up

| Library | Search Term |
|---------|-------------|
| Hono | `hono` |
| Kysely | `kysely` |
| Zod | `zod` |
| Deno | `deno` |
| Redis | `redis node` |
| Google Gemini | `google genai` |
| bcrypt | `bcrypt` |

### Example Usage

```
// Before writing Hono route handlers:
1. resolve_library_id("hono")
2. get_library_docs(resolved_id, topic="routing")

// Before writing Kysely queries:
1. resolve_library_id("kysely")
2. get_library_docs(resolved_id, topic="select queries")

// Before writing Zod schemas:
1. resolve_library_id("zod")
2. get_library_docs(resolved_id, topic="schema validation")
```

### When to Call Context7

- Writing new route handlers → Look up Hono docs
- Writing database queries → Look up Kysely docs
- Creating validation schemas → Look up Zod docs
- Implementing JWT auth → Look up Hono JWT middleware docs
- Working with Redis → Look up Redis client docs
- Implementing AI features → Look up Google GenAI docs
- Any code generation or modification task

**Never assume API signatures or patterns from memory. Always verify with Context7 first.**

## Critical: Code Quality Checks

**MANDATORY**: After generating or modifying any code, you MUST perform the following checks:

### Required Post-Code Workflow

1. **Lint & Type Check** - Run `deno lint` and `deno check` to catch issues
2. **Format** - Run `deno fmt` to ensure consistent formatting

### Commands

```bash
deno lint              # Check for linting issues
deno check <file>      # Type check specific file
deno fmt               # Format all files
deno fmt <file>        # Format specific file
```

### Workflow Example

After writing/modifying code:
```
1. getDiagnostics(["path/to/modified/file.ts"])
2. If errors found → fix them
3. Run: deno fmt path/to/modified/file.ts
4. Run: deno lint path/to/modified/file.ts
5. Verify all issues resolved
```

### Quality Gates

- **No lint errors** - All code must pass `deno lint`
- **No type errors** - All code must pass `deno check`
- **Consistent formatting** - All code must be formatted with `deno fmt`
- **No diagnostics** - `getDiagnostics` must return no errors

**Never consider code complete until all quality checks pass.**

## Project Overview

A Deno-based REST API backend using Clean Architecture principles. Built with Hono web framework, Kysely query builder, MySQL database, and Redis for caching/session management. Includes Google Gemini AI integration for intelligent features.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Deno 2.x |
| Web Framework | Hono |
| Database | MySQL via Kysely |
| Caching | Redis |
| Validation | Zod |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | bcrypt |
| AI | Google Gemini |

### Key Commands

```bash
deno task dev              # Development with hot reload
deno task start            # Production start
deno task create:module <name>  # Scaffold new module
```

## Architecture

### Clean Architecture Layers

```
src/modules/<module>/
├── domain/           # Entities, business rules (innermost)
├── application/      # Use cases, interfaces, services
├── infrastructure/   # External implementations (DB, cache, AI)
└── presentation/     # Controllers, validators, HTTP layer (outermost)
```

### Dependency Flow

```
Presentation → Application → Domain
      ↓
Infrastructure (implements Application interfaces)
```

### Directory Structure

```
src/
├── main.ts                    # Application entry point
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication module
│   └── item/                  # Item/inventory module
├── shared/                    # Cross-cutting concerns
│   ├── domain/                # Base entities, shared types
│   ├── application/           # Shared application types
│   ├── infrastructure/        # DB, Redis, AI clients
│   └── presentation/          # Middlewares
└── utilities/                 # Helper functions
```

## Module Structure & Patterns

### Creating a New Module

Use the scaffolding script:
```bash
deno task create:module <module-name>
```

This generates all required files following established patterns.

### Layer Responsibilities

#### 1. Domain Layer (`domain/`)

Defines entities extending `BaseEntity`:

```typescript
// domain/<name>.entity.ts
import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ExampleEntity extends BaseEntity {
  name: string;
  // domain-specific fields
}

export type { ExampleEntity };
```

`BaseEntity` provides:
- `id: number`
- `status: string`
- `created_at?: Date`
- `updated_at?: Date`
- `deleted_at?: Date`

#### 2. Application Layer (`application/`)

**Repository Interface** - defines data access contract:
```typescript
// application/<name>-repository.interface.ts
interface IExampleRepository {
  getMany(props: GetManyProps): Promise<Example[]>;
  getOne(id: number): Promise<Example>;
  create(data: Omit<Example, "id">): Promise<Example>;
  update(id: number, data: Partial<Example>): Promise<Example>;
  delete(id: number): Promise<void>;
}
```

**Service** - orchestrates business logic via dependency injection:
```typescript
// application/<name>.service.ts
class ExampleService {
  constructor(private readonly exampleRepository: IExampleRepository) {}
  // methods delegate to repository
}
```

#### 3. Infrastructure Layer (`infrastructure/`)

**Repository Implementation** - implements interface using Kysely:
```typescript
// infrastructure/<name>.repository.ts
class ExampleRepository implements IExampleRepository {
  constructor(private readonly db: PersistenceType) {}
  // Kysely query implementations
}
```

**Key Patterns:**
- Soft delete: Set `status: "archived"`, `deleted_at: new Date()`
- Always update `updated_at` on modifications
- Use `safeBigintToNumber()` for insert IDs

#### 4. Presentation Layer (`presentation/`)

**Controller** - HTTP handlers with validation:
```typescript
// presentation/<name>.controller.ts
function defineExampleController(service: ExampleService) {
  const app = new Hono();
  
  app.get("/", async (c) => {
    const query = c.req.query();
    const validated = schema.safeParse(query);
    if (!validated.success) {
      return c.json({ message: "invalid query", issues: validated.error.issues }, 400);
    }
    const result = await service.getMany(validated.data);
    return c.json(result);
  });
  
  return app;
}
```

**Module** - dependency injection composition:
```typescript
// presentation/<name>.module.ts
const db = getDatabase();
const repo = new ExampleRepository(db);
const service = new ExampleService(repo);
const controller = defineExampleController(service);

export { controller };
```

**Validators** - Zod schemas in `validators/` folder:
```typescript
// presentation/validators/createExampleBody.ts
import { z } from "zod";

const createExampleBodySchema = z.object({
  name: z.string(),
  status: z.enum(["active", "inactive"]),
});

export { createExampleBodySchema };
```

## Validation Patterns

### Request Validation

Always validate before processing:

```typescript
const body = await c.req.json();
const validated = schema.safeParse(body);

if (!validated.success) {
  return c.json({
    message: "invalid body",  // or "invalid query", "invalid param"
    issues: validated.error.issues,
  }, 400);
}
```

### Common Validator Patterns

| Type | File Pattern | Example |
|------|--------------|---------|
| Request body | `<action><Entity>Body.ts` | `createItemBody.ts` |
| Query params | `<action><Entity>Query.ts` | `getManyItemsQuery.ts` |
| URL params | `<entity>IdParam.ts` | `itemIdParam.ts` |

### Coercion for Query/Params

Use `z.coerce` for URL parameters:
```typescript
const schema = z.object({
  id: z.coerce.number(),
  limit: z.coerce.number().positive().optional(),
});
```

## Authentication

### JWT Token Strategy

- **Access Token**: 15 minutes, stateless verification
- **Refresh Token**: 7 days, stored as SHA-256 hash in Redis

### Protected Routes

```typescript
import { jwt } from "hono/jwt";

const jwtSecret = Deno.env.get("JWT_SECRET");
app.use("/*", jwt({ secret: jwtSecret }));
```

### Auth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/signup` | POST | Register new user |
| `/auth/signin` | POST | Login, returns tokens |
| `/auth/signout` | POST | Invalidate refresh token |
| `/auth/refresh` | POST | Get new token pair |

## Database Patterns

### Kysely Query Builder

```typescript
// Select with conditions
const items = await this.db
  .selectFrom("items")
  .where("status", "=", "active")
  .selectAll()
  .execute();

// Insert
const result = await this.db
  .insertInto("items")
  .values({ ...data, created_at: new Date() })
  .executeTakeFirst();

// Update
await this.db
  .updateTable("items")
  .set({ ...data, updated_at: new Date() })
  .where("id", "=", id)
  .executeTakeFirst();

// Soft delete
await this.db
  .updateTable("items")
  .set({ status: "archived", deleted_at: new Date() })
  .where("id", "=", id)
  .executeTakeFirst();
```

### Database Types

Types are generated in `src/shared/infrastructure/persistence/database.d.ts` via `kysely-codegen`.

### Status Values

```typescript
type StatusType = "active" | "inactive" | "archived";
```

## Shared Infrastructure

### Database Access

```typescript
import { getDatabase, PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
const db = getDatabase();
```

### Redis Access

```typescript
import { getRedis } from "@/shared/infrastructure/caching/index.ts";
const redis = await getRedis();
```

### AI (Gemini) Access

```typescript
import { getGemini } from "@/shared/infrastructure/ai/index.ts";
const gemini = getGemini();
```

## Import Conventions

### Path Aliases

Use `@/` for src-relative imports:
```typescript
import { BaseEntity } from "@/shared/domain/base.entity.ts";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
```

### File Extensions

Always include `.ts` extension in imports:
```typescript
import { UserEntity } from "../domain/user.entity.ts";
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 8000) |
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | JWT signing secret |
| `REDIS_URL` | Redis connection URL |
| `GEMINI_API_KEY` | Google Gemini API key |

## Error Handling

### Service Layer Errors

Throw descriptive errors:
```typescript
if (!user) throw new Error("USER_NOT_FOUND");
if (!isValid) throw new Error("PASSWORD_INCORRECT");
```

### Common Error Codes

- `USER_NOT_FOUND`
- `PASSWORD_INCORRECT`
- `ACCESS_TOKEN_INVALID`
- `REFRESH_TOKEN_INVALID`
- `JWT_SECRET_ENV_UNDEFINED`

## AI Integration Pattern

For AI-powered features, create an AI service in infrastructure:

```typescript
// infrastructure/<name>.ai-service.ts
class ExampleAiService {
  constructor(
    private readonly gemini: GoogleGenAI,
    private readonly service: ExampleService,
  ) {}

  async generate(prompt: string) {
    // Define function declarations for tool use
    // Implement agentic loop with function calling
  }
}
```

## Code Style Guidelines

1. **Naming Conventions**
   - Entities: `PascalCase` + `Entity` suffix
   - Interfaces: `I` prefix for repository interfaces
   - Services: `PascalCase` + `Service` suffix
   - Controllers: `define<Name>Controller` function

2. **Export Style**
   - Use named exports
   - Export types separately: `export type { EntityType };`

3. **Async/Await**
   - Always use async/await over raw promises
   - Repository methods are always async

4. **Immutability**
   - Use `readonly` for injected dependencies
   - Prefer `const` over `let`

## Docker

### Development
```bash
docker compose -f docker-compose.dev.yml up  # Redis only
deno task dev
```

### Production
```bash
docker compose up --build
```

## Checklist for New Features

- [ ] Create entity in `domain/`
- [ ] Define repository interface in `application/`
- [ ] Implement service in `application/`
- [ ] Implement repository in `infrastructure/`
- [ ] Create validators in `presentation/validators/`
- [ ] Define controller in `presentation/`
- [ ] Wire up module in `presentation/<name>.module.ts`
- [ ] Register route in `src/main.ts`
- [ ] Add database table if needed
