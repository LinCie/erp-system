# AGENTS.md

This file provides comprehensive guidance for AI assistants working on the ERP System codebase.

## Project Overview

This is a modular ERP system built with **Deno** and **TypeScript**, following Clean Architecture principles. The system manages resources like items, inventories, spaces, trades, and contacts, with AI-powered features for natural language item queries.

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

The codebase follows **Clean Architecture** with **Domain-Driven Design** principles, organized into four distinct layers:

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

### Dependency Rule

**Dependencies always point inward** - Presentation depends on Application, Application depends on Domain, Infrastructure implements Domain interfaces. This ensures the core business logic remains independent of external concerns.

### Layer Responsibilities

#### 1. Domain Layer (`src/modules/*/domain/`)
- **Purpose**: Core business entities and types
- **Contains**:
  - Entity interfaces/types (e.g., `user.entity.ts`)
  - Value objects and domain types
  - Domain-specific enums
- **Rules**:
  - No dependencies on infrastructure or external libraries
  - Pure TypeScript types/interfaces
  - No business logic implementation

#### 2. Application Layer (`src/modules/*/application/`)
- **Purpose**: Business logic and use cases
- **Contains**:
  - Service classes (e.g., `auth.service.ts`)
  - Repository interfaces (e.g., `auth-repository.interface.ts`)
  - Security/service interfaces
- **Rules**:
  - Depends only on Domain layer
  - Implements business rules
  - Defines contracts for infrastructure to implement

#### 3. Infrastructure Layer (`src/modules/*/infrastructure/`)
- **Purpose**: External system integrations
- **Contains**:
  - Repository implementations (e.g., `auth.repository.ts`)
  - Database mappers
  - External service integrations (AI, S3, etc.)
- **Rules**:
  - Implements interfaces from Application layer
  - Handles database queries, API calls, file storage
  - Converts between domain entities and external formats

#### 4. Presentation Layer (`src/modules/*/presentation/`)
- **Purpose**: HTTP API endpoints and request/response handling
- **Contains**:
  - Controllers (e.g., `auth.controller.ts`)
  - Route definitions (e.g., `signin.route.ts`)
  - Validators (Zod schemas, e.g., `signinBody.ts`)
  - Response schemas (OpenAPI schemas)
- **Rules**:
  - Thin layer - delegates to Application services
  - Handles request validation via Zod
  - Formats responses
  - Provides OpenAPI documentation

## Module Structure

Each module follows this consistent structure:

```
src/modules/{module-name}/
├── domain/                    # Core entities
│   └── {module}.entity.ts
├── application/               # Business logic
│   ├── {module}.service.ts
│   └── {module}-repository.interface.ts
├── infrastructure/           # External integrations
│   ├── {module}.repository.ts
│   └── {module}.mapper.ts
├── presentation/             # API layer
│   ├── {module}.controller.ts
│   ├── {module}.module.ts
│   ├── routes/
│   │   ├── create-{module}.route.ts
│   │   ├── get-one-{module}.route.ts
│   │   └── ...
│   ├── schemas/
│   │   └── {module}-response.schema.ts
│   └── validators/
│       ├── create-{module}-body.validator.ts
│       └── {module}-id-param.validator.ts
```

### Module Initialization Pattern

Each module exports a `create{Module}Module()` function:

```typescript
// src/modules/auth/presentation/auth.module.ts
import { getDatabase } from "@/shared/infrastructure/persistence/index.ts";
import { getRedis } from "@/shared/infrastructure/caching/index.ts";
import { AuthRepository } from "../infrastructure/auth.repository.ts";
import { AuthSecurity } from "../infrastructure/auth.security.ts";
import { AuthService } from "../application/auth.service.ts";
import { defineAuthController } from "./auth.controller.ts";

async function createAuthModule() {
  const db = getDatabase();
  const redis = await getRedis();

  const authRepo = new AuthRepository(db, redis);
  const authSecurity = new AuthSecurity(authRepo);
  const authService = new AuthService(authRepo, authSecurity);
  const authController = defineAuthController(authService);

  return { authController };
}

export { createAuthModule };
```

Modules are registered in `src/main.ts`:

```typescript
const { authController } = await createAuthModule();
app.route("/auth", authController);
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

**ALWAYS** check Kysely documentation via Context7 before writing database queries.

### Zod (Validation)
- **Purpose**: Runtime type validation and OpenAPI schema generation
- **Usage**:
  - Define request body validators in `validators/` directory
  - Define response schemas in `schemas/` directory
  - Use `.openapi()` decorator for documentation
  - Export inferred types as TypeScript types

**Example**:
```typescript
import { z } from "@hono/zod-openapi";

const createContactBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Contact" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("CreateContactBody");

type CreateContactBody = z.infer<typeof createContactBodySchema>;

export { createContactBodySchema };
export type { CreateContactBody };
```

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

## MCP Tool Usage Guidelines

### Context7 Usage - MANDATORY for Code Generation

**ALWAYS** query Context7 for library documentation before generating any code involving external libraries.

#### When to Use Context7

Use Context7 when working with:
- Hono (routes, middleware, OpenAPI)
- Kysely (database queries, joins, transactions)
- Zod (schemas, validation, refinements)
- Redis (operations, caching patterns)
- Google GenAI (AI integration, function calling)
- AWS SDK (S3 operations, presigned URLs)
- bcryptjs (password hashing)

#### Context7 Workflow

1. **First**: Call `resolve-library-id` to get the correct library ID
   ```javascript
   {
     "query": "How to create a Hono route with Zod validation",
     "libraryName": "hono"
   }
   ```

2. **Then**: Call `query-docs` with the library ID and your specific question
   ```javascript
   {
     "libraryId": "/honojs/hono",
     "query": "How to create a POST route with request body validation using Zod and OpenAPI decorators"
   }
   ```

#### Important Constraints

- **Maximum 3 calls per question** - be efficient
- Use the returned examples and patterns
- Adapt examples to this project's architecture
- Don't make up API methods - verify with documentation

### Sequential Thinking Usage - For Complex Problems

Use the sequential thinking MCP tool for complex, multi-step scenarios:

#### When to Use Sequential Thinking

Use when facing:
- Complex architectural decisions
- Multi-step refactoring tasks
- Debugging difficult issues
- Planning new features or modules
- Performance optimization problems
- Database schema design
- Integration challenges between multiple systems
- When the full scope isn't clear initially

#### Sequential Thinking Benefits

- Break down complex problems into steps
- Maintain context over multiple steps
- Revise and refine approach as understanding deepens
- Generate and verify hypotheses
- Filter out irrelevant information
- Ensure systematic problem-solving

## Do's

### Architecture & Structure
✅ **Follow the 4-layer architecture strictly** - never skip layers
✅ **Use TypeScript interfaces and type exports** for all contracts
✅ **Create Zod schemas with OpenAPI decorators** for all endpoints
✅ **Use repository pattern** for all data access operations
✅ **Implement proper dependency injection** in module initialization
✅ **Write tests** in `__tests__` directories (see inventory module for examples)
✅ **Use the `create-module` script** for scaffolding new modules: `deno task create:module`

### Code Quality
✅ **Always consult Context7** before generating code with external libraries
✅ **Use sequential thinking** for complex architectural decisions or debugging
✅ **Export all types** that might be used by other modules
✅ **Add OpenAPI examples** to all Zod schemas
✅ **Use proper error handling** with custom error types
✅ **Follow existing naming conventions** (kebab-case for files, PascalCase for classes)
✅ **Add proper JSDoc comments** to complex functions

### Database Operations
✅ **Use Kysely query builder** - no raw SQL
✅ **Define database types** in `database.d.ts` and keep them updated
✅ **Use transactions** for multi-step operations
✅ **Implement proper mapping** between domain entities and database rows

### API Design
✅ **Define routes in separate files** under `routes/` directory
✅ **Group endpoints by resource** (e.g., `/items`, `/inventories`)
✅ **Use HTTP verbs correctly** (GET, POST, PUT, DELETE)
✅ **Return proper status codes** (201 for created, 200 for success, 400 for errors)
✅ **Include error response schemas** for all endpoints that can fail

## Don'ts

### Architecture & Structure
❌ **Don't mix concerns across layers** - each layer has a single responsibility
❌ **Don't skip the repository abstraction** - never call `getDatabase()` from controllers or services directly
❌ **Don't put business logic in controllers** - delegates to services only
❌ **Don't use inline types** - create proper type definitions and export them
❌ **Don't bypass the service layer** - controllers shouldn't contain business rules
❌ **Don't use direct database queries outside repositories** - all DB access goes through repositories

### Code Quality
❌ **Don't generate code without checking Context7 documentation first** - this is mandatory
❌ **Don't skip systematic thinking for complex problems** - use sequential thinking tool
❌ **Don't forget to export types** - if a type is defined, it should be exported
❌ **Don't use `any` type** - use proper TypeScript types
❌ **Don't duplicate code** - extract common patterns to shared utilities

### API Design
❌ **Don't create endpoints without OpenAPI documentation** - use `createRoute()` and `.openapi()`
❌ **Don't skip request validation** - always define Zod schemas for request bodies and parameters
❌ **Don't return inconsistent response formats** - use proper response schemas
❌ **Don't forget error handling** - all endpoints should handle errors gracefully

### Security
❌ **Don't expose sensitive data** in responses
❌ **Don't skip authentication** - use `security: [{ Bearer: [] }]` for protected routes
❌ **Don't store passwords in plain text** - use bcryptjs
❌ **Don't ignore input validation** - trust but verify

## Code Patterns & Examples

### Route Definition with OpenAPI

```typescript
// src/modules/contact/presentation/routes/create-contact.route.ts
import { createRoute } from "@hono/zod-openapi";
import { createContactBodySchema } from "../validators/create-contact-body.validator.ts";
import { contactResponseSchema } from "../schemas/contact-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createContactRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Contacts"],
  summary: "Create a new contact",
  security: [{ Bearer: [] }],
  request: { 
    body: { 
      content: { 
        "application/json": { 
          schema: createContactBodySchema 
        } 
      } 
    } 
  },
  responses: {
    201: { 
      content: { 
        "application/json": { 
          schema: contactResponseSchema 
        } 
      }, 
      description: "Contact created successfully" 
    },
    400: { 
      content: { 
        "application/json": { 
          schema: errorResponseSchema 
        } 
      }, 
      description: "Validation error" 
    },
  },
});

export { createContactRoute };
```

### Validator Schema Creation

```typescript
// src/modules/contact/presentation/validators/create-contact-body.validator.ts
import { z } from "@hono/zod-openapi";

const createContactBodySchema = z
  .object({
    name: z.string().min(1).openapi({ 
      example: "My Contact",
      description: "The contact's name" 
    }),
    status: z.enum(["active", "inactive"]).openapi({ 
      example: "active",
      description: "The contact's status" 
    }),
  })
  .openapi("CreateContactBody");

type CreateContactBody = z.infer<typeof createContactBodySchema>;

export { createContactBodySchema };
export type { CreateContactBody };
```

### Repository Implementation

```typescript
// src/modules/auth/infrastructure/auth.repository.ts
import type { AuthRepositoryInterface } from "../application/auth-repository.interface.ts";
import type { PersistenceType } from "@/shared/infrastructure/persistence/index.ts";
import type { UserEntity } from "../domain/user.entity.ts";
import { MapperError } from "@/shared/domain/errors/mapper.error.ts";

class AuthRepository implements AuthRepositoryInterface {
  constructor(
    private readonly db: PersistenceType,
    private readonly redis: Awaited<ReturnType<typeof import("@/shared/infrastructure/caching/index.ts").getRedis>>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | undefined> {
    try {
      const user = await this.db
        .selectFrom("users")
        .selectAll()
        .where("email", "=", email)
        .executeTakeFirst();

      return user;
    } catch (error) {
      throw new MapperError("Failed to find user by email");
    }
  }

  async create(user: Omit<UserEntity, "id" | "created_at" | "updated_at" | "deleted_at">): Promise<UserEntity> {
    const result = await this.db
      .insertInto("users")
      .values(user)
      .executeTakeFirstOrThrow();

    const createdUser = await this.db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", Number(result.insertId))
      .executeTakeFirstOrThrow();

    return createdUser;
  }
}

export { AuthRepository };
```

### Service Layer Pattern

```typescript
// src/modules/auth/application/auth.service.ts
import type { AuthRepositoryInterface } from "./auth-repository.interface.ts";
import type { AuthSecurityInterface } from "./auth-security.interface.ts";
import type { UserEntity } from "../domain/user.entity.ts";
import { bcrypt } from "@/shared/infrastructure/security/index.ts";

class AuthService {
  constructor(
    private readonly authRepo: AuthRepositoryInterface,
    private readonly authSecurity: AuthSecurityInterface,
  ) {}

  async signup(name: string, email: string, password: string): Promise<UserEntity> {
    // Check if user exists
    const existingUser = await this.authRepo.findByEmail(email);
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password);

    // Create user
    const user = await this.authRepo.create({
      name,
      email,
      password: hashedPassword,
      status: "active",
    });

    return user;
  }

  async signin(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Find user
    const user = await this.authRepo.findByEmail(email);
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Generate tokens
    const tokens = await this.authSecurity.generateTokens(user);

    return tokens;
  }
}

export { AuthService };
```

### Entity Definition

```typescript
// src/modules/auth/domain/user.entity.ts
import { BaseEntity } from "@/shared/domain/base.entity.ts";

interface UserEntity extends BaseEntity {
  name: string;
  email: string;
  password: string;
}

export type { UserEntity };
```

### Controller Pattern

```typescript
// src/modules/contact/presentation/contact.controller.ts
import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { createContactRoute } from "./routes/create-contact.route.ts";
import { deleteContactRoute } from "./routes/delete-contact.route.ts";
import { getManyContactsRoute } from "./routes/get-many-contacts.route.ts";
import { getOneContactRoute } from "./routes/get-one-contact.route.ts";
import { updateContactRoute } from "./routes/update-contact.route.ts";
import type { ContactService } from "../application/contact.service.ts";

function defineContactController(service: ContactService) {
  const app = new OpenAPIHono();

  app.openapi(createContactRoute, async (c) => {
    const body = c.req.valid("json");
    const contact = await service.create(body);
    return c.json(contact, 201);
  });

  app.openapi(getManyContactsRoute, async (c) => {
    const query = c.req.valid("query");
    const contacts = await service.getMany(query);
    return c.json(contacts);
  });

  app.openapi(getOneContactRoute, async (c) => {
    const { id } = c.req.valid("param");
    const contact = await service.getOne(id);
    return c.json(contact);
  });

  app.openapi(updateContactRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const contact = await service.update(id, body);
    return c.json(contact);
  });

  app.openapi(deleteContactRoute, async (c) => {
    const { id } = c.req.valid("param");
    await service.delete(id);
    return c.json({ message: "Contact deleted successfully" });
  });

  return app;
}

export { defineContactController };
```

## Common Tasks

### Creating a New Module

Use the provided script to scaffold a new module:

```bash
deno task create:module
```

This will create the complete module structure with all necessary files.

### Adding a New Endpoint

1. Create a route definition in `src/modules/{module}/presentation/routes/`:
   ```typescript
   import { createRoute } from "@hono/zod-openapi";
   import { responseSchema } from "../schemas/response.schema.ts";
   import { errorResponseSchema } from "../schemas/error-response.schema.ts";

   const customRoute = createRoute({
     method: "post",
     path: "/custom",
     tags: ["ModuleName"],
     summary: "Custom endpoint description",
     security: [{ Bearer: [] }],
     request: { 
       body: { 
         content: { 
           "application/json": { 
             schema: z.object({ /* fields */ }) 
           } 
         } 
       } 
     },
     responses: {
       200: { 
         content: { 
           "application/json": { 
             schema: responseSchema 
           } 
         }, 
         description: "Success" 
       },
       400: { 
         content: { 
           "application/json": { 
             schema: errorResponseSchema 
           } 
         }, 
         description: "Error" 
       },
     },
   });
   ```

2. Create a validator schema in `validators/` directory

3. Create a response schema in `schemas/` directory

4. Add the route handler in the controller

5. Run `deno task dev` to test

### Adding Validation

1. Create a Zod schema in the `validators/` directory
2. Add `.openapi()` decorator for documentation
3. Export both the schema and inferred type
4. Use `c.req.valid("json")` or `c.req.valid("query")` in route handlers

### Running Tests

```bash
# Run all tests
deno task test

# Run tests for a specific module
deno task test:item

# Run tests with coverage
deno task test:coverage
```

### Generating Database Types

After modifying the database schema:

```bash
deno task db:generate
```

This updates `src/shared/infrastructure/persistence/database.d.ts` with the latest schema types.

## Troubleshooting & Best Practices

### When to Use Context7 vs. Sequential Thinking

**Use Context7 when:**
- Working with external libraries (Hono, Kysely, Zod, etc.)
- Need specific API usage examples
- Writing new code that involves library-specific patterns
- Unsure about the correct API methods or parameters

**Use Sequential Thinking when:**
- Designing complex architectural solutions
- Debugging multi-layer issues
- Planning database schema changes
- Refactoring across multiple modules
- Performance optimization tasks
- When the problem scope isn't immediately clear

### Common Pitfalls

1. **Skipping Context7**: Leads to incorrect API usage and broken code
2. **Mixing layers**: Causes tight coupling and makes testing difficult
3. **Direct DB access in services**: Bypasses repository abstraction
4. **Forgetting to export types**: Makes code unusable by other modules
5. **Missing OpenAPI decorators**: Results in incomplete API documentation
6. **Not using transactions**: Causes data consistency issues
7. **Ignoring error handling**: Makes debugging difficult

### Debugging Workflow

1. **Use Sequential Thinking** to break down the problem
2. **Check Context7** for library-specific patterns
3. **Verify layer separation** - ensure each layer's responsibilities are respected
4. **Review similar implementations** in existing modules
5. **Check database types** - ensure they match your queries
6. **Test endpoints** using Swagger UI at `/swagger`
7. **Monitor logs** for detailed error information

### Performance Considerations

- Use Redis caching for frequently accessed data
- Implement proper indexing on database columns
- Use pagination for list endpoints
- Lazy load related data when appropriate
- Monitor query performance in development

### Security Best Practices

- Always validate input with Zod schemas
- Use Bearer authentication for protected routes
- Hash passwords with bcryptjs
- Never expose sensitive data in responses
- Use environment variables for configuration
- Implement proper CORS if needed
- Log security events appropriately

---

**Remember**: This codebase values clean architecture, type safety, and proper separation of concerns. When in doubt, consult existing modules for patterns, use Context7 for library specifics, and use Sequential Thinking for complex problems.