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
| fast-check       | `fast-check`       |

### When to Call Context7

- Writing new route handlers → Look up Hono docs
- Creating OpenAPI routes → Look up Hono Zod OpenAPI docs
- Writing database queries → Look up Kysely docs
- Creating validation schemas → Look up Zod docs
- Implementing JWT auth → Look up Hono JWT middleware docs
- Working with Redis → Look up Redis client docs
- Implementing AI features → Look up Google GenAI docs
- Writing property-based tests → Look up fast-check docs

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
| Testing           | Deno Test + fast-check (property-based)        |

### Key Commands

```bash
deno task dev                    # Development with hot reload
deno task start                  # Production start
deno task create:module <name>   # Scaffold new module
deno task test                   # Run all tests
deno task test:item              # Run item module tests
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
├── infrastructure/   # External implementations (DB, cache, AI, mappers)
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
│   ├── item/                  # Item/inventory module
│   └── space/                 # Space module
├── shared/                    # Cross-cutting concerns
│   ├── domain/                # Base entities, shared types
│   ├── application/           # Shared application types
│   ├── infrastructure/        # DB, Redis, AI clients (singletons)
│   └── presentation/          # Shared schemas
└── utilities/                 # Helper functions
```

## Module Structure & Patterns

### Creating a New Module

Use the scaffolding script:

```bash
deno task create:module <module-name>
deno task create:module <module-name> <plural-form>  # Custom plural
```

This generates all required files following established patterns including
OpenAPI routes, schemas, validators, and test infrastructure.

### Generated Module Structure

```
src/modules/<name>/
├── __tests__/
│   ├── arbitraries/
│   │   └── <name>.arbitraries.ts      # fast-check arbitraries
│   ├── fixtures/
│   │   └── <name>.fixtures.ts         # Static test data
│   └── mocks/
│       └── <name>.repository.mock.ts  # Mock repository implementation
├── domain/
│   └── <name>.entity.ts
├── application/
│   ├── <name>-repository.interface.ts
│   ├── <name>.service.ts
│   └── <name>.service_test.ts         # Service unit tests
├── infrastructure/
│   ├── <name>.mapper.ts               # Entity ↔ DB row mapper
│   ├── <name>.repository.ts
│   └── <name>.ai-service.ts           # Optional: AI integration
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
        ├── <name>-id-param.validator.ts
        ├── create-<name>-body.validator.ts
        ├── update-<name>-body.validator.ts
        └── get-many-<name>s-query.validator.ts
```

### Layer Responsibilities

#### 1. Domain Layer (`domain/`)

Defines entities extending `BaseEntity`:

```typescript
// domain/<name>.entity.ts
import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface ExampleEntity extends BaseEntity {
  name: string;
  // Use string for decimal fields (cost, price, weight)
  cost: string;
  price: string;
  // Optional fields use TypeScript optional syntax
  description?: string;
}

export type { ExampleEntity };
```

`BaseEntity` provides:

- `id: number`
- `status: string`
- `created_at?: Date`
- `updated_at?: Date`
- `deleted_at?: Date`

**Important**: Use `string` type for decimal/money fields (cost, price, weight)
because MySQL Decimal maps to string in Kysely.

#### 2. Application Layer (`application/`)

**Repository Interface** - defines data access contract:

```typescript
// application/<name>-repository.interface.ts
import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
import { ExampleEntity as Example } from "../domain/example.entity.ts";

// Extend shared props with module-specific fields
type GetManyExamplesProps = GetManyPropsType & {
  spaceId: number;
  type: "full" | "partial";
};

// Return type includes data and pagination metadata
type GetManyExamplesReturn = {
  data: Example[];
  metadata: GetManyMetadataType;
};

interface IExampleRepository {
  getMany(props: GetManyExamplesProps): Promise<GetManyExamplesReturn>;
  getOne(id: number): Promise<Example>;
  create(data: Omit<Example, "id">): Promise<Example>;
  update(id: number, data: Partial<Example>): Promise<Example>;
  delete(id: number): Promise<void>;
}

export type { GetManyExamplesProps, GetManyExamplesReturn, IExampleRepository };
```

**Service** - orchestrates business logic via dependency injection:

```typescript
// application/<name>.service.ts
class ExampleService {
  constructor(private readonly exampleRepository: IExampleRepository) {}

  async getMany(props: GetManyExamplesProps) {
    return await this.exampleRepository.getMany(props);
  }

  async getOne(id: number) {
    return await this.exampleRepository.getOne(id);
  }

  async create(data: Omit<Example, "id">) {
    return await this.exampleRepository.create(data);
  }

  async update(id: number, data: Partial<Example>) {
    return await this.exampleRepository.update(id, data);
  }

  async delete(id: number) {
    return await this.exampleRepository.delete(id);
  }
}

export { ExampleService };
```

#### 3. Infrastructure Layer (`infrastructure/`)

**Mapper** - transforms between entity and database row:

```typescript
// infrastructure/<name>.mapper.ts
import type { Insertable, Updateable } from "kysely";
import type { Examples } from "@/shared/infrastructure/persistence/database.d.ts";
import type { ExampleEntity } from "../domain/example.entity.ts";

import { z } from "@hono/zod-openapi";

class ExampleMapper {
  // Internal Zod schemas for validation during transformation
  private entitySchema = z.object({
    id: z.number(),
    name: z.string(),
    cost: z.string(),
    price: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
    description: z.string().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    deleted_at: z.coerce.date().optional(),
  });

  private insertableSchema = z.object({
    name: z.string(),
    cost: z.string(),
    price: z.string(),
    status: z.enum(["active", "inactive", "archived"]),
    description: z.string().nullable(), // DB uses null, not undefined
  });

  private updateableSchema = this.insertableSchema.partial();

  /**
   * Transform entity to insertable DB row
   * Converts undefined to null for DB compatibility
   */
  toInsertable(entity: ExampleEntity): Insertable<Examples> {
    const data = {
      name: entity.name,
      cost: entity.cost,
      price: entity.price,
      status: entity.status,
      description: entity.description ?? null, // undefined → null
    };
    return this.insertableSchema.parse(data);
  }

  /**
   * Transform partial entity to updateable DB row
   */
  toUpdateable(entity: Partial<ExampleEntity>): Updateable<Examples> {
    return this.updateableSchema.parse(entity);
  }

  /**
   * Transform DB row to entity
   * Converts null to undefined for entity compatibility
   */
  toEntity(row: Record<string, unknown>): ExampleEntity {
    const data = {
      id: row.id,
      name: row.name,
      cost: row.cost,
      price: row.price,
      status: row.status,
      description: row.description ?? undefined, // null → undefined
      created_at: row.created_at ?? undefined,
      updated_at: row.updated_at ?? undefined,
      deleted_at: row.deleted_at ?? undefined,
    };
    return this.entitySchema.parse(data);
  }
}

export { ExampleMapper };
```

**Key Mapper Patterns:**

- Use Zod schemas internally for validation during transformation
- Convert `undefined` → `null` when going to DB (toInsertable, toUpdateable)
- Convert `null` → `undefined` when coming from DB (toEntity)
- Use Kysely's `Insertable<T>` and `Updateable<T>` types for type safety

**Repository Implementation** - implements interface using Kysely:

```typescript
// infrastructure/<name>.repository.ts
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { safeBigintToNumber } from "@/utilities/transform.utility.ts";
import {
  GetManyExamplesProps,
  IExampleRepository,
} from "../application/example-repository.interface.ts";
import { ExampleEntity as Example } from "../domain/example.entity.ts";
import { ExampleMapper } from "./example.mapper.ts";

class ExampleRepository implements IExampleRepository {
  constructor(
    private readonly db: PersistenceType,
    private readonly mapper: ExampleMapper,
  ) {}

  async getMany(props: GetManyExamplesProps) {
    const {
      page = 1,
      limit = 10,
      status = "active",
      sort = "created_at",
      order = "asc",
    } = props;

    // Count query for pagination metadata
    const { total } = await this.db
      .selectFrom("examples")
      .where("status", "=", status)
      .where("deleted_at", "is", null)
      .select((eb) => eb.fn.count("id").as("total"))
      .executeTakeFirstOrThrow();

    const totalItems = parseInt(total.toString());
    const totalPages = Math.ceil(totalItems / limit);

    // Data query with pagination
    const result = await this.db
      .selectFrom("examples")
      .where("status", "=", status)
      .where("deleted_at", "is", null)
      .orderBy(sort, order)
      .limit(limit)
      .offset((page - 1) * limit)
      .selectAll()
      .execute();

    return {
      data: result.map((row) => this.mapper.toEntity(row)),
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getOne(id: number) {
    const result = await this.db
      .selectFrom("examples")
      .where("id", "=", id)
      .selectAll()
      .executeTakeFirst();

    if (!result) throw new Error("Example not found");
    return this.mapper.toEntity(result);
  }

  async create(data: Omit<Example, "id">) {
    const insertable = this.mapper.toInsertable(data as Example);

    const created = await this.db
      .insertInto("examples")
      .values({ ...insertable, created_at: new Date(), updated_at: new Date() })
      .executeTakeFirst();

    if (!created.insertId) throw new Error("Example not created");
    return this.getOne(safeBigintToNumber(created.insertId));
  }

  async update(id: number, data: Partial<Example>) {
    const updateable = this.mapper.toUpdateable(data);

    await this.db
      .updateTable("examples")
      .set({ ...updateable, updated_at: new Date() })
      .where("id", "=", id)
      .executeTakeFirst();

    return this.getOne(id);
  }

  async delete(id: number) {
    // Soft delete: set status to archived and deleted_at timestamp
    await this.db
      .updateTable("examples")
      .where("id", "=", id)
      .set({
        status: "archived",
        updated_at: new Date(),
        deleted_at: new Date(),
      })
      .executeTakeFirst();
  }
}

export { ExampleRepository };
```

**Key Repository Patterns:**

- Takes both `db` and `mapper` as constructor dependencies
- Soft delete: Set `status: "archived"` and `deleted_at: new Date()`
- Always update `updated_at` on modifications
- Use `safeBigintToNumber()` for insert IDs (MySQL returns bigint)
- Use `executeTakeFirstOrThrow()` for count queries
- Filter by `deleted_at is null` to exclude soft-deleted records

#### 4. Presentation Layer (`presentation/`)

**Routes** - OpenAPI route definitions in `routes/` folder:

```typescript
// presentation/routes/create-example.route.ts
import { createRoute } from "@hono/zod-openapi";
import { createExampleBodySchema } from "../validators/create-example-body.validator.ts";
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
import type { JwtVariables } from "hono/jwt";

import { OpenAPIHono } from "@hono/zod-openapi";
import { jwt } from "hono/jwt";
import { ExampleService } from "../application/example.service.ts";
import { getManyExamplesRoute } from "./routes/get-many-examples.route.ts";
import { getOneExampleRoute } from "./routes/get-one-example.route.ts";
import { createExampleRoute } from "./routes/create-example.route.ts";
import { updateExampleRoute } from "./routes/update-example.route.ts";
import { deleteExampleRoute } from "./routes/delete-example.route.ts";

function defineExampleController(service: ExampleService) {
  const app = new OpenAPIHono<{ Variables: JwtVariables }>();

  const jwtSecret = Deno.env.get("JWT_SECRET");
  if (!jwtSecret) throw new Error("JWT_SECRET_ENV_UNDEFINED");

  app.use("/*", jwt({ secret: jwtSecret }));

  app.openapi(getManyExamplesRoute, async (c) => {
    const query = c.req.valid("query");
    const result = await service.getMany(query);
    return c.json(result, 200);
  });

  app.openapi(getOneExampleRoute, async (c) => {
    const { id } = c.req.valid("param");
    const result = await service.getOne(id);
    return c.json(result, 200);
  });

  app.openapi(createExampleRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await service.create(body);
    return c.json(result, 201);
  });

  app.openapi(updateExampleRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const result = await service.update(id, body);
    return c.json(result, 200);
  });

  app.openapi(deleteExampleRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.body(null, 204);
  });

  return app;
}

export { defineExampleController };
```

**Module** - dependency injection composition:

```typescript
// presentation/<name>.module.ts - SYNC pattern (no Redis)
import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { ExampleRepository } from "../infrastructure/example.repository.ts";
import { ExampleService } from "../application/example.service.ts";
import { defineExampleController } from "./example.controller.ts";
import { ExampleMapper } from "../infrastructure/example.mapper.ts";

const db = getDatabase();

const exampleMapper = new ExampleMapper();
const exampleRepo = new ExampleRepository(db, exampleMapper);
const exampleService = new ExampleService(exampleRepo);
const exampleController = defineExampleController(exampleService);

export { exampleController };
```

```typescript
// presentation/<name>.module.ts - ASYNC pattern (with Redis)
import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { getRedis } from "@/shared/infrastructure/caching/index.ts";
import { ExampleRepository } from "../infrastructure/example.repository.ts";
import { ExampleService } from "../application/example.service.ts";
import { defineExampleController } from "./example.controller.ts";

async function createExampleModule() {
  const db = getDatabase();
  const redis = await getRedis(); // Redis requires await

  const exampleRepo = new ExampleRepository(db, redis);
  const exampleService = new ExampleService(exampleRepo);
  const exampleController = defineExampleController(exampleService);

  return { exampleController };
}

export { createExampleModule };
```

**When to use async module pattern:**

- Module depends on Redis (requires `await getRedis()`)
- Module has other async initialization needs

**Validators** - Zod schemas with OpenAPI metadata in `validators/` folder:

```typescript
// presentation/validators/create-example-body.validator.ts
import { z } from "@hono/zod-openapi";

const createExampleBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Example" }),
    cost: z.string().openapi({ example: "10000" }),
    price: z.string().openapi({ example: "15000" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
    description: z.string().optional().openapi({ example: "Description" }),
  })
  .openapi("CreateExampleBody");

type CreateExampleBody = z.infer<typeof createExampleBodySchema>;

export { createExampleBodySchema };
export type { CreateExampleBody };
```

**Schemas** - Response schemas with OpenAPI metadata in `schemas/` folder:

```typescript
// presentation/schemas/example-response.schema.ts
import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const exampleResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Example" }),
    cost: z.string().openapi({ example: "10000" }),
    price: z.string().openapi({ example: "15000" }),
    status: z.string().openapi({ example: "active" }),
  })
  .openapi("ExampleResponse");

const getManyExamplesResponseSchema = z.object({
  data: z.array(exampleResponseSchema),
  metadata: getManyMetadataSchema,
}).openapi("GetManyExamplesResponse");

export { exampleResponseSchema, getManyExamplesResponseSchema };
```

## File Naming Conventions

### Strict Naming Patterns

| File Type            | Pattern                               | Example                         |
| -------------------- | ------------------------------------- | ------------------------------- |
| Entity               | `<name>.entity.ts`                    | `item.entity.ts`                |
| Repository Interface | `<name>-repository.interface.ts`      | `item-repository.interface.ts`  |
| Service              | `<name>.service.ts`                   | `item.service.ts`               |
| Mapper               | `<name>.mapper.ts`                    | `item.mapper.ts`                |
| Repository           | `<name>.repository.ts`                | `item.repository.ts`            |
| AI Service           | `<name>.ai-service.ts`                | `item.ai-service.ts`            |
| Controller           | `<name>.controller.ts`                | `item.controller.ts`            |
| Module               | `<name>.module.ts`                    | `item.module.ts`                |
| Route                | `<action>-<name>.route.ts`            | `create-item.route.ts`          |
| Validator            | `<action>-<name>-<type>.validator.ts` | `create-item-body.validator.ts` |
| Response Schema      | `<name>-response.schema.ts`           | `item-response.schema.ts`       |
| Error Schema         | `error-response.schema.ts`            | `error-response.schema.ts`      |
| Test File            | `<name>_test.ts`                      | `item.service_test.ts`          |
| Fixtures             | `<name>.fixtures.ts`                  | `item.fixtures.ts`              |
| Mocks                | `<name>.repository.mock.ts`           | `item.repository.mock.ts`       |
| Arbitraries          | `<name>.arbitraries.ts`               | `item.arbitraries.ts`           |

**Important:**

- Use kebab-case for multi-word file names
- Test files use underscore: `_test.ts` (not `.test.ts`)
- All files include `.ts` extension in imports

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

## Testing Patterns

### Test File Structure

```
src/modules/<name>/
├── __tests__/
│   ├── arbitraries/           # fast-check arbitraries for property-based testing
│   │   └── <name>.arbitraries.ts
│   ├── fixtures/              # Static test data
│   │   └── <name>.fixtures.ts
│   └── mocks/                 # Mock implementations
│       └── <name>.repository.mock.ts
├── application/
│   └── <name>.service_test.ts # Service unit tests
├── infrastructure/
│   └── <name>.repository_test.ts  # Repository integration tests
└── presentation/
    └── <name>.controller_test.ts  # Controller tests
```

### Unit Test Pattern (Deno.test)

```typescript
// application/<name>.service_test.ts
import { assertEquals, assertRejects } from "@std/assert";
import { ExampleService } from "./example.service.ts";
import { MockExampleRepository } from "../__tests__/mocks/example.repository.mock.ts";
import { examplesList } from "../__tests__/fixtures/example.fixtures.ts";

Deno.test("ExampleService - getMany delegates to repository", async () => {
  // Arrange
  const mockRepo = new MockExampleRepository({ examples: examplesList });
  const service = new ExampleService(mockRepo);
  const props = { page: 1, limit: 10 };

  // Act
  const result = await service.getMany(props);

  // Assert
  const calls = mockRepo.getCallsForMethod("getMany");
  assertEquals(calls.length, 1, "getMany should be called once");
  assertEquals(calls[0].args[0], props, "should receive same props");
  assertEquals(result.data.length, examplesList.length);
});

Deno.test("ExampleService - getOne propagates repository errors", async () => {
  // Arrange
  const mockRepo = new MockExampleRepository({
    shouldThrow: new Error("Example not found"),
  });
  const service = new ExampleService(mockRepo);

  // Act & Assert
  await assertRejects(
    () => service.getOne(999),
    Error,
    "Example not found",
  );
});
```

### Mock Repository Pattern

```typescript
// __tests__/mocks/<name>.repository.mock.ts
// deno-lint-ignore-file require-await
import type {
  GetManyExamplesProps,
  IExampleRepository,
} from "../../application/example-repository.interface.ts";
import type { ExampleEntity } from "../../domain/example.entity.ts";

interface MockRepositoryOptions {
  examples?: ExampleEntity[];
  shouldThrow?: Error;
}

interface MethodCall {
  method: string;
  args: unknown[];
}

class MockExampleRepository implements IExampleRepository {
  private examples: ExampleEntity[] = [];
  private shouldThrow?: Error;
  public calls: MethodCall[] = [];

  constructor(options?: MockRepositoryOptions) {
    this.examples = options?.examples ?? [];
    this.shouldThrow = options?.shouldThrow;
  }

  // Utility methods for test assertions
  reset(options?: MockRepositoryOptions): void {
    this.examples = options?.examples ?? [];
    this.shouldThrow = options?.shouldThrow;
    this.calls = [];
  }

  setError(error: Error): void {
    this.shouldThrow = error;
  }
  clearError(): void {
    this.shouldThrow = undefined;
  }
  getCalls(): MethodCall[] {
    return this.calls;
  }
  getCallsForMethod(methodName: string): MethodCall[] {
    return this.calls.filter((c) => c.method === methodName);
  }
  clearCalls(): void {
    this.calls = [];
  }

  // Interface implementation with call tracking
  async getMany(props: GetManyExamplesProps) {
    this.calls.push({ method: "getMany", args: [props] });
    if (this.shouldThrow) throw this.shouldThrow;

    const page = props.page ?? 1;
    const limit = props.limit ?? 10;
    const offset = (page - 1) * limit;

    return {
      data: this.examples.slice(offset, offset + limit),
      metadata: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: this.examples.length,
        totalPages: Math.ceil(this.examples.length / limit),
      },
    };
  }

  async getOne(id: number): Promise<ExampleEntity> {
    this.calls.push({ method: "getOne", args: [id] });
    if (this.shouldThrow) throw this.shouldThrow;
    const item = this.examples.find((i) => i.id === id);
    if (!item) throw new Error("Example not found");
    return item;
  }

  // ... other methods follow same pattern
}

export { MockExampleRepository };
export type { MethodCall, MockRepositoryOptions };
```

### Fixtures Pattern

```typescript
// __tests__/fixtures/<name>.fixtures.ts
import type { ExampleEntity } from "../../domain/example.entity.ts";
import type { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";

const validExample: ExampleEntity = {
  id: 1,
  name: "Test Example",
  cost: "10.00",
  price: "15.00",
  status: "active",
  created_at: new Date("2024-01-01T00:00:00Z"),
  updated_at: new Date("2024-01-01T00:00:00Z"),
};

const minimalExample: ExampleEntity = {
  id: 2,
  name: "Minimal Example",
  cost: "5.00",
  price: "8.00",
  status: "active",
};

const archivedExample: ExampleEntity = {
  id: 3,
  name: "Archived Example",
  cost: "20.00",
  price: "30.00",
  status: "archived",
  deleted_at: new Date("2024-01-15T00:00:00Z"),
};

const examplesList: ExampleEntity[] = [
  validExample,
  minimalExample,
  {
    id: 4,
    name: "Fourth Example",
    cost: "12.50",
    price: "18.75",
    status: "active",
  },
];

const sampleMetadata: GetManyMetadataType = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 3,
  totalPages: 1,
};

const createExampleData: Omit<ExampleEntity, "id"> = {
  name: "New Example",
  cost: "25.00",
  price: "40.00",
  status: "active",
};

const updateExampleData: Partial<ExampleEntity> = {
  name: "Updated Example Name",
  price: "45.00",
};

export {
  archivedExample,
  createExampleData,
  examplesList,
  minimalExample,
  sampleMetadata,
  updateExampleData,
  validExample,
};
```

### Property-Based Testing with fast-check

```typescript
// __tests__/arbitraries/<name>.arbitraries.ts
import fc from "fast-check";
import type { ExampleEntity } from "../../domain/example.entity.ts";
import type { GetManyExamplesProps } from "../../application/example-repository.interface.ts";

// Arbitrary for numeric string values (cost, price, weight)
const numericStringArb: fc.Arbitrary<string> = fc
  .float({
    min: 0,
    max: Math.fround(999999.99),
    noNaN: true,
    noDefaultInfinity: true,
  })
  .map((n) => n.toFixed(2));

// Arbitrary for status values
const statusArb: fc.Arbitrary<"active" | "inactive" | "archived"> = fc
  .constantFrom("active", "inactive", "archived");

// Arbitrary for optional string fields
const optionalStringArb = (maxLength = 255): fc.Arbitrary<string | undefined> =>
  fc.option(fc.string({ minLength: 1, maxLength }), { nil: undefined });

// Arbitrary for optional Date fields
const optionalDateArb: fc.Arbitrary<Date | undefined> = fc.option(
  fc.date(),
  { nil: undefined },
);

// Arbitrary for complete entity
const exampleEntityArb: fc.Arbitrary<ExampleEntity> = fc.record({
  id: fc.nat(),
  name: fc.string({ minLength: 1, maxLength: 255 }),
  cost: numericStringArb,
  price: numericStringArb,
  status: statusArb,
  description: optionalStringArb(1000),
  created_at: optionalDateArb,
  updated_at: optionalDateArb,
  deleted_at: optionalDateArb,
});

// Arbitrary for create data (without id)
const createExampleArb: fc.Arbitrary<Omit<ExampleEntity, "id">> = fc.record({
  name: fc.string({ minLength: 1, maxLength: 255 }),
  cost: numericStringArb,
  price: numericStringArb,
  status: statusArb,
  description: optionalStringArb(1000),
});

// Arbitrary for partial entity (update operations)
const partialExampleArb: fc.Arbitrary<Partial<ExampleEntity>> = fc.record(
  {
    name: optionalStringArb(255),
    cost: fc.option(numericStringArb, { nil: undefined }),
    price: fc.option(numericStringArb, { nil: undefined }),
    status: fc.option(statusArb, { nil: undefined }),
  },
  { requiredKeys: [] },
);

// Arbitrary for GetMany props
const getManyPropsArb: fc.Arbitrary<GetManyExamplesProps> = fc.record({
  page: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
  search: optionalStringArb(100),
  status: fc.option(statusArb, { nil: undefined }),
});

export {
  createExampleArb,
  exampleEntityArb,
  getManyPropsArb,
  numericStringArb,
  optionalDateArb,
  optionalStringArb,
  partialExampleArb,
  statusArb,
};
```

### Property-Based Test Example

```typescript
// application/<name>.service_test.ts
import fc from "fast-check";
import { assertEquals } from "@std/assert";
import { ExampleService } from "./example.service.ts";
import { MockExampleRepository } from "../__tests__/mocks/example.repository.mock.ts";
import { examplesList } from "../__tests__/fixtures/example.fixtures.ts";
import {
  createExampleArb,
  getManyPropsArb,
  partialExampleArb,
} from "../__tests__/arbitraries/example.arbitraries.ts";

Deno.test("Property: Service delegation preserves arguments for getMany", async () => {
  await fc.assert(
    fc.asyncProperty(getManyPropsArb, async (props) => {
      // Arrange
      const mockRepo = new MockExampleRepository({ examples: [] });
      const service = new ExampleService(mockRepo);

      // Act
      await service.getMany(props);

      // Assert
      const calls = mockRepo.getCallsForMethod("getMany");
      assertEquals(calls.length, 1, "getMany should be called exactly once");
      assertEquals(calls[0].args[0], props, "should receive identical props");
    }),
    { numRuns: 100 },
  );
});

Deno.test("Property: Service delegation preserves arguments for create", async () => {
  await fc.assert(
    fc.asyncProperty(createExampleArb, async (data) => {
      const mockRepo = new MockExampleRepository({ examples: [] });
      const service = new ExampleService(mockRepo);

      await service.create(data);

      const calls = mockRepo.getCallsForMethod("create");
      assertEquals(calls.length, 1);
      assertEquals(calls[0].args[0], data);
    }),
    { numRuns: 100 },
  );
});
```

### Test Commands

```bash
deno task test                   # Run all tests
deno task test:item              # Run item module tests
deno test --filter "ServiceName" # Run specific tests
deno test --coverage=cov_profile # Run with coverage
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

| Endpoint         | Method | Description              |
| ---------------- | ------ | ------------------------ |
| `/auth/signup`   | POST   | Register new user        |
| `/auth/signin`   | POST   | Login, returns tokens    |
| `/auth/signout`  | POST   | Invalidate refresh token |
| `/auth/refresh`  | POST   | Get new token pair       |
| `/auth/validate` | GET    | Validate access token    |

### Auth Module Pattern (Multiple Interfaces)

Auth module demonstrates using multiple interfaces:

```typescript
// application/auth-security.interface.ts
interface IAuthSecurity {
  verifyPassword: (password: string, hash: string) => Promise<boolean>;
  verifyToken: (options: VerifyTokenOptions) => Promise<unknown>;
  generateToken: (options: GenerateTokenOptions) => Promise<string>;
  generateSession: () => string;
  generatePasswordHash: (password: string) => Promise<string>;
  generateTokenHash: (token: string) => Promise<string>;
}

// application/auth.service.ts
class AuthService {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly authSecurity: IAuthSecurity, // Second interface
  ) {}
}
```

## Database Patterns

### Kysely Query Builder

```typescript
// Select with conditions
const items = await this.db
  .selectFrom("items")
  .where("status", "=", "active")
  .where("deleted_at", "is", null)
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

// Count for pagination
const { total } = await this.db
  .selectFrom("items")
  .select((eb) => eb.fn.count("id").as("total"))
  .executeTakeFirstOrThrow();

// Nested data with jsonArrayFrom (MySQL helper)
import { jsonArrayFrom } from "kysely/helpers/mysql";

const result = await this.db
  .selectFrom("items")
  .select((eb) => [
    "id",
    "name",
    jsonArrayFrom(
      eb.selectFrom("inventories")
        .select(["balance", "cost_per_unit"])
        .whereRef("inventories.item_id", "=", "items.id"),
    ).as("inventories"),
  ])
  .execute();
```

### Database Types

Types are generated in `src/shared/infrastructure/persistence/database.d.ts` via
`kysely-codegen`. Key types:

```typescript
// Decimal fields map to string
export type Decimal = ColumnType<string, number | string>;

// Auto-increment/default fields
export type Generated<T> = ColumnType<T, T | undefined, T>;

// JSON columns
export type Json = ColumnType<JsonValue, string, string>;
```

### Status Values

```typescript
type StatusType = "active" | "inactive" | "archived";
```

## Shared Infrastructure

### Singleton Pattern

All infrastructure clients use singleton pattern with lazy initialization:

```typescript
// Database (sync)
import {
  getDatabase,
  PersistenceType,
} from "@/shared/infrastructure/persistence/index.ts";
const db = getDatabase();

// Redis (async - requires await)
import { getRedis } from "@/shared/infrastructure/caching/index.ts";
const redis = await getRedis();

// AI/Gemini (sync)
import { getGemini } from "@/shared/infrastructure/ai/index.ts";
const gemini = getGemini();
```

### Shared Types

```typescript
// Pagination props
import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
type GetManyPropsType = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: "id" | "price" | "name" | "created_at";
  order?: "asc" | "desc";
  status?: "active" | "inactive" | "archived";
};

// Pagination metadata
import { GetManyMetadataType } from "@/shared/application/types/get-many-metadata.type.ts";
type GetManyMetadataType = {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
};

// Shared response schema
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";
```

## AI Integration Pattern

For AI-powered features, create an AI service in infrastructure:

```typescript
// infrastructure/<name>.ai-service.ts
import type {
  Content,
  FunctionDeclaration,
  FunctionResponse,
  GenerateContentConfig,
  GoogleGenAI,
} from "@google/genai";

import { Type } from "@google/genai";
import { ExampleService } from "../application/example.service.ts";

class ExampleAiService {
  constructor(
    private readonly gemini: GoogleGenAI,
    private readonly service: ExampleService,
  ) {}

  // Define function declarations for tool use
  private getManyFunctionDeclaration: FunctionDeclaration = {
    name: "getMany",
    description: "Get a list of examples",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: { type: Type.NUMBER, description: "Items per page" },
        search: { type: Type.STRING, description: "Search term" },
        page: { type: Type.NUMBER, description: "Page number" },
        status: { type: Type.STRING, description: "Filter by status" },
      },
    },
  };

  async generate(prompt: string) {
    const contents: Content[] = [
      { role: "user", parts: [{ text: prompt }] },
    ];

    const config: GenerateContentConfig = {
      tools: [{ functionDeclarations: [this.getManyFunctionDeclaration] }],
      temperature: 0,
      systemInstruction: `Your system instruction here...`,
    };

    let finalResponse: string | undefined;
    let count = 0;

    // Agentic loop with max iterations
    while (true) {
      if (count >= 5) throw new Error("Too many AI requests");

      const response = await this.gemini.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents,
        config,
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const functionCall of response.functionCalls) {
          if (functionCall.name === "getMany") {
            const args = functionCall.args;
            const result = await this.service.getMany(args);

            const functionResponse: FunctionResponse = {
              name: functionCall.name,
              response: { result },
            };

            // Add function call and response to conversation
            contents.push({ role: "model", parts: [{ functionCall }] });
            contents.push({ role: "user", parts: [{ functionResponse }] });
          }
        }
        count++;
      } else {
        if (!response.text) throw new Error("Failed to generate content");
        finalResponse = response.text;
        break;
      }
    }

    return finalResponse;
  }
}

export { ExampleAiService };
```

**Key AI Service Patterns:**

- Use `Type` enum from `@google/genai` for parameter types
- Implement agentic loop with max iteration limit (prevent infinite loops)
- Push both function call and response to contents array
- Use low temperature (0) for deterministic responses
- System instruction guides AI behavior and response format

## Import Conventions

### Path Aliases

Use `@/` for src-relative imports:

```typescript
import { BaseEntity } from "@/shared/domain/base.entity.ts";
import { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import { GetManyPropsType } from "@/shared/application/types/get-all.type.ts";
```

### File Extensions

Always include `.ts` extension in imports:

```typescript
import { UserEntity } from "../domain/user.entity.ts";
import { ItemMapper } from "./item.mapper.ts";
```

### OpenAPI Imports

Use `@hono/zod-openapi` for Zod in presentation layer:

```typescript
import { z } from "@hono/zod-openapi";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
```

### Type-Only Imports

Use `import type` for type-only imports:

```typescript
import type { JwtVariables } from "hono/jwt";
import type { Insertable, Updateable } from "kysely";
import type { ExampleEntity } from "../domain/example.entity.ts";
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
if (!item) throw new Error("ITEM_NOT_FOUND");
```

### Common Error Codes

- `USER_NOT_FOUND`
- `PASSWORD_INCORRECT`
- `ACCESS_TOKEN_INVALID`
- `REFRESH_TOKEN_INVALID`
- `JWT_SECRET_ENV_UNDEFINED`
- `DATABASE_URL is undefined`
- `REDIS_URL is undefined`
- `GEMINI_API_KEY is undefined`

## Code Style Guidelines

1. **Naming Conventions**

   - Entities: `PascalCase` + `Entity` suffix (`ItemEntity`)
   - Interfaces: `I` prefix for repository interfaces (`IItemRepository`)
   - Services: `PascalCase` + `Service` suffix (`ItemService`)
   - Mappers: `PascalCase` + `Mapper` suffix (`ItemMapper`)
   - Controllers: `define<Name>Controller` function
   - Routes: `<action><Name>Route` (e.g., `createItemRoute`)
   - Schemas: `<name>ResponseSchema`, `errorResponseSchema`
   - Arbitraries: `<name>Arb` suffix (`itemEntityArb`)

2. **Export Style**

   - Use named exports
   - Export types separately: `export type { EntityType };`

3. **Async/Await**

   - Always use async/await over raw promises
   - Repository methods are always async

4. **Immutability**

   - Use `readonly` for injected dependencies
   - Prefer `const` over `let`

5. **Type Imports**
   - Use `import type` for type-only imports
   - Keeps runtime bundle smaller

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

## Registering New Modules

After creating a module, register it in `src/main.ts`:

```typescript
// src/main.ts
import { OpenAPIHono } from "@hono/zod-openapi";
import { exampleController } from "./modules/example/presentation/example.module.ts";
// OR for async modules:
import { createExampleModule } from "./modules/example/presentation/example.module.ts";

async function main() {
  const app = new OpenAPIHono();

  // Sync module
  app.route("/examples", exampleController);

  // Async module (requires await)
  const { exampleController } = await createExampleModule();
  app.route("/examples", exampleController);

  // ... rest of setup
}
```

## Checklist for New Features

### Module Creation

- [ ] Create entity in `domain/`
- [ ] Define repository interface in `application/`
- [ ] Implement service in `application/`
- [ ] Implement mapper in `infrastructure/`
- [ ] Implement repository in `infrastructure/`
- [ ] Create validators in `presentation/validators/`
- [ ] Create response schemas in `presentation/schemas/`
- [ ] Define routes in `presentation/routes/`
- [ ] Define controller in `presentation/`
- [ ] Wire up module in `presentation/<name>.module.ts`
- [ ] Register route in `src/main.ts`
- [ ] Add database table if needed (update `database.d.ts` via kysely-codegen)

### Testing

- [ ] Create fixtures in `__tests__/fixtures/`
- [ ] Create mock repository in `__tests__/mocks/`
- [ ] Create arbitraries in `__tests__/arbitraries/` (for property-based tests)
- [ ] Write service unit tests in `application/<name>.service_test.ts`
- [ ] Write repository integration tests (optional)
- [ ] Write controller tests (optional)

### Quality Checks

- [ ] Run `deno fmt` to format code
- [ ] Run `deno lint` to check for issues
- [ ] Run `deno check <file>` for type checking
- [ ] Run `deno task test` to verify tests pass
- [ ] Verify OpenAPI docs at `/swagger`

## Quick Reference

### Common Patterns

| Pattern                   | Location                                     | Example                     |
| ------------------------- | -------------------------------------------- | --------------------------- |
| Entity definition         | `domain/<name>.entity.ts`                    | `interface ItemEntity`      |
| Repository interface      | `application/<name>-repository.interface.ts` | `interface IItemRepository` |
| Service class             | `application/<name>.service.ts`              | `class ItemService`         |
| Mapper class              | `infrastructure/<name>.mapper.ts`            | `class ItemMapper`          |
| Repository implementation | `infrastructure/<name>.repository.ts`        | `class ItemRepository`      |
| Controller function       | `presentation/<name>.controller.ts`          | `defineItemController()`    |
| Module composition        | `presentation/<name>.module.ts`              | Dependency injection setup  |
| Route definition          | `presentation/routes/*.route.ts`             | `createRoute({ ... })`      |
| Validator schema          | `presentation/validators/*.validator.ts`     | `z.object({}).openapi()`    |
| Response schema           | `presentation/schemas/*.schema.ts`           | `z.object({}).openapi()`    |

### HTTP Status Codes

| Code | Usage                                |
| ---- | ------------------------------------ |
| 200  | Successful GET, PUT, PATCH           |
| 201  | Successful POST (resource created)   |
| 204  | Successful DELETE (no content)       |
| 400  | Validation error                     |
| 401  | Unauthorized (missing/invalid token) |
| 404  | Resource not found                   |
| 500  | Internal server error                |
