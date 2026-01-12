---
trigger: always_on
---

### Dependency Rule

**Dependencies always point inward** - Presentation depends on Application,
Application depends on Domain, Infrastructure implements Domain interfaces. This
ensures the core business logic remains independent of external concerns.

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
