# AGENTS.md

This document provides comprehensive guidance for AI agents working with this
codebase.

## Critical: Documentation Lookup via Context7

**MANDATORY**: Before generating any code or answering code-related questions,
you MUST use Context7 MCP to fetch up-to-date documentation. Do NOT rely on
prior knowledge for libraries and frameworks.

### Required Workflow

1. **Always call `mcp_Context7_resolve_library_id`** first to get the correct
   library ID
2. **Then call `mcp_Context7_get_library_docs`** with the resolved ID to fetch
   current documentation
3. Only after retrieving documentation should you generate code or provide
   answers

### Libraries to Look Up

| Library          | Search Term        |
| ---------------- | ------------------ |
| Hono             | `hono`             |
| Hono Zod OpenAPI | `hono zod openapi` |
| Kysely           | `kysely`           |
| Zod              | `zod`              |
| Deno             | `deno`             |
| Redis            | `redis node`       |
| Google Gemini    | `google genai`     |
| bcrypt           | `bcrypt`           |

### Example Usage

```
// Before writing Hono route handlers:
1. resolve_library_id("hono")
2. get_library_docs(resolved_id, topic="routing")

// Before writing OpenAPI routes:
1. resolve_library_id("hono zod openapi")
2. get_library_docs(resolved_id, topic="createRoute")

// Before writing Kysely queries:
1. resolve_library_id("kysely")
2. get_library_docs(resolved_id, topic="select queries")

// Before writing Zod schemas:
1. resolve_library_id("zod")
2. get_library_docs(resolved_id, topic="schema validation")
```

### When to Call Context7

- Writing new route handlers → Look up Hono docs
- Creating OpenAPI routes → Look up Hono Zod OpenAPI docs
- Writing database queries → Look up Kysely docs
- Creating validation schemas → Look up Zod docs
- Implementing JWT auth → Look up Hono JWT middleware docs
- Working with Redis → Look up Redis client docs
- Implementing AI features → Look up Google GenAI docs
- Any code generation or modification task

**Never assume API signatures or patterns from memory. Always verify with
Context7 first.**

## Critical: Code Quality Checks

**MANDATORY**: After generating or modifying any code, you MUST perform the
following checks:

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

A Deno-based REST API backend using Clean Architecture principles. Built with
Hono web framework, Kysely query builder, MySQL database, and Redis for
caching/session management. Includes Google Gemini AI integration for
intelligent features. Uses OpenAPI/Swagger for API documentation.

### Tech Stack

| Layer             | Technology                                     |
| ----------------- | ---------------------------------------------- |
| Runtime           | Deno 2.x                                       |
| Web Framework     | Hono                                           |
| API Documentation | OpenAPI 3.1 via @hono/zod-openapi + Swagger UI |
| Database          | MySQL via Kysely                               |
| Caching           | Redis                                          |
| Validation        | Zod                                            |
| Authentication    | JWT (access + refresh tokens)                  |
| Password Hashing  | bcrypt                                         |
| AI                | Google Gemini                                  |

### Key Commands

```bash
deno task dev              # Development with hot reload
deno task start            # Production start
deno task create:module <name>  # Scaffold new module
```

### API Documentation

- **Swagger UI**: `/swagger` - Interactive API documentation
- **OpenAPI JSON**: `/doc` - Raw OpenAPI 3.1 specification

## Architecture

### Clean Architecture Layers

```
src/modules/<module>/
├── domain/           # Entities, business rules (innermost)
├── application/      # Use cases, interfaces, services
├── infrastructure/   # External implementations (DB, cache, AI)
└── presentation/     # Controllers, routes, validators, schemas (outermost)
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

This generates all required files following established patterns including
OpenAPI routes, schemas, and validators.

### Generated Module Structure

```
src/modules/<name>/
├── domain/
│   └── <name>.entity.ts
├── application/
│   ├── <name>-repository.interface.ts
│   └── <name>.service.ts
├── infrastructure/
│   └── <name>.repository.ts
└── presentation/
    ├── <name>.controller.ts
    ├── <name>.module.ts
    ├── routes/
    │   ├── get-many-<name>s.route.ts
    │   ├── get-one-<name>.route.ts
    │   ├── create-<name>.route.ts
    │   ├── update-<name>.route.ts
    │   └── delete-<name>.route.ts
    ├── schemas/
    │   ├── <name>-response.schema.ts
    │   └── error-response.schema.ts
    └── validators/
        ├── <name>IdParam.ts
        ├── create<Name>Body.ts
        ├── update<Name>Body.ts
        └── getMany<Name>sQuery.ts
```

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

**Routes** - OpenAPI route definitions in `routes/` folder:

```typescript
// presentation/routes/create-example.route.ts
import { createRoute } from "@hono/zod-openapi";
import { createExampleBodySchema } from "../validators/createExampleBody.ts";
import { exampleResponseSchema } from "../schemas/example-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createExampleRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Examples"],
  summary: "Create a new example",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createExampleBodySchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: exampleResponseSchema } },
      description: "Example created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { createExampleRoute };
```

**Controller** - HTTP handlers using OpenAPIHono:

```typescript
// presentation/<name>.controller.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { createExampleRoute } from "./routes/create-example.route.ts";

function defineExampleController(service: ExampleService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(createExampleRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create(body);
    return c.json(result, 201);
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

**Validators** - Zod schemas with OpenAPI metadata in `validators/` folder:

```typescript
// presentation/validators/createExampleBody.ts
import { z } from "@hono/zod-openapi";

const createExampleBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Example" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("CreateExampleBody");

export { createExampleBodySchema };
```

**Schemas** - Response schemas with OpenAPI metadata in `schemas/` folder:

```typescript
// presentation/schemas/example-response.schema.ts
import { z } from "@hono/zod-openapi";

const exampleResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Example" }),
    status: z.string().openapi({ example: "active" }),
  })
  .openapi("ExampleResponse");

export { exampleResponseSchema };
```

## OpenAPI Patterns

### Route Definition

Use `createRoute` from `@hono/zod-openapi`:

```typescript
const route = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["TagName"],
  summary: "Description",
  security: [{ Bearer: [] }], // For protected routes
  request: {
    params: paramSchema,
    query: querySchema,
    body: { content: { "application/json": { schema: bodySchema } } },
  },
  responses: {
    200: {
      content: { "application/json": { schema: responseSchema } },
      description: "Success description",
    },
  },
});
```

### Schema with OpenAPI Metadata

Always add `.openapi()` to schemas:

```typescript
const schema = z
  .object({
    field: z.string().openapi({ example: "value" }),
  })
  .openapi("SchemaName");
```

### Path Parameters

Use `param` option for path parameters:

```typescript
const idParamSchema = z
  .object({
    id: z.coerce.number().openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
  })
  .openapi("IdParam");
```

### Controller Handler

Use `app.openapi()` and `c.req.valid()`:

```typescript
app.openapi(route, async (c) => {
  const body = c.req.valid("json");
  const params = c.req.valid("param");
  const query = c.req.valid("query");
  // ...
});
```

## Validation Patterns

### Common Validator Patterns

| Type         | File Pattern                  | Location      |
| ------------ | ----------------------------- | ------------- |
| Request body | `create<Entity>Body.ts`       | `validators/` |
| Update body  | `update<Entity>Body.ts`       | `validators/` |
| Query params | `getMany<Entity>sQuery.ts`    | `validators/` |
| URL params   | `<entity>IdParam.ts`          | `validators/` |
| Response     | `<entity>-response.schema.ts` | `schemas/`    |
| Error        | `error-response.schema.ts`    | `schemas/`    |

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

| Endpoint        | Method | Description              |
| --------------- | ------ | ------------------------ |
| `/auth/signup`  | POST   | Register new user        |
| `/auth/signin`  | POST   | Login, returns tokens    |
| `/auth/signout` | POST   | Invalidate refresh token |
| `/auth/refresh` | POST   | Get new token pair       |

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

Types are generated in `src/shared/infrastructure/persistence/database.d.ts` via
`kysely-codegen`.

### Status Values

```typescript
type StatusType = "active" | "inactive" | "archived";
```

## Shared Infrastructure

### Database Access

```typescript
import {
  getDatabase,
  PersistenceType,
} from "@/shared/infrastructure/persistence/index.ts";
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

### OpenAPI Imports

Use `@hono/zod-openapi` for Zod in presentation layer:

```typescript
import { z } from "@hono/zod-openapi";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
```

## Environment Variables

| Variable         | Description                 |
| ---------------- | --------------------------- |
| `PORT`           | Server port (default: 8000) |
| `DATABASE_URL`   | MySQL connection string     |
| `JWT_SECRET`     | JWT signing secret          |
| `REDIS_URL`      | Redis connection URL        |
| `GEMINI_API_KEY` | Google Gemini API key       |

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
   - Routes: `<action><Name>Route` (e.g., `createItemRoute`)
   - Schemas: `<name>ResponseSchema`, `errorResponseSchema`

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
- [ ] Create response schemas in `presentation/schemas/`
- [ ] Define routes in `presentation/routes/`
- [ ] Define controller in `presentation/`
- [ ] Wire up module in `presentation/<name>.module.ts`
- [ ] Register route in `src/main.ts`
- [ ] Add database table if needed
