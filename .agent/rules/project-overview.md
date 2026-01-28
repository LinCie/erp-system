---
trigger: always_on
---

Project Overview

This is a modular ERP system built with Deno and TypeScript, following Clean
Architecture principles. The system manages resources like items, inventories,
spaces, trades, and contacts, with AI-powered features for natural language item
queries.

Tech Stack

Runtime: Deno with --allow-all and env-file support Web Framework: Hono with
OpenAPI support Database: MySQL with Kysely ORM Caching: Redis Storage: AWS S3
AI Integration: Google Gemini AI Monitoring: Sentry Validation: Zod Testing:
Built-in Deno test runner with fast-check

Key Commands

deno task start starts the production server deno task dev starts the
development server with watch mode deno task test runs all tests deno task
db:generate generates database types from the schema deno task create:module
scaffolds a new module

Architecture Pattern

The codebase follows Clean Architecture with Domain-Driven Design principles,
organized into four layers.

Presentation layer for the API Application layer for business logic
Infrastructure layer for implementations Domain layer for core business entities

Key Technologies and Libraries

Hono and OpenAPI are used as the web framework with automatic OpenAPI
documentation. Routes are defined using createRoute from @hono/zod-openapi.
Features include automatic schema validation, Swagger UI at /swagger, OpenAPI
spec at /doc, and bearer authentication support.

Kysely is used as a type-safe SQL query builder for MySQL. Database types are
generated via kysely-codegen into database.d.ts. Access is provided through a
singleton getDatabase function, and all database operations follow the
repository pattern. Kysely documentation must always be checked via Context7
before writing database queries.

Zod is used for runtime type validation and OpenAPI schema generation. Request
body validators are defined in the validators directory, response schemas in the
schemas directory, and the openapi decorator is used for documentation. Inferred
types are exported as TypeScript types.

Redis is used as a caching layer for session management and data caching. It is
accessed via a singleton getRedis function and integrated into authentication
repositories for token management.

AWS S3 is used for file storage for uploads. Presigned URLs are used for secure
uploads and downloads. The service is located in
src/shared/infrastructure/storage.

Google Gemini AI is used for natural language queries for item search. It
follows a function-calling pattern to query items. The implementation is
ItemAiService in the item module, using the gemini-2.5-flash-lite model.

Sentry is used for error tracking and monitoring and is initialized in
src/main.ts.

MCP Rules

Context7 MCP is mandatory. The AI must use Context7 before giving any answer or
writing any code. Context7 is used to load and follow the current project
structure and conventions, existing scripts and commands, and existing patterns
used in the Astro, React, and Tailwind setup. If Context7 cannot be used, the AI
must not guess and must clearly state what setup details are missing.

Sequential Thinking MCP must be used for complex, multi-step tasks or tasks with
multiple valid approaches, such as setup refactors, environment changes, build
or dev issues, or broad changes affecting many files. The AI should produce a
clear step-by-step plan after Context7 and before proposing impactful setup
changes.

Fetch MCP must be used whenever content is needed from a URL, such as
documentation, examples, references, or copied snippets. The AI must not rely on
memory for URL-based or version-sensitive details when Fetch can retrieve the
source.

Git MCP must be used only for git-related tasks such as diff reviews, change
summaries, commit guidance, or branch and PR context. The git command line must
not be used unless it is truly required and explicitly justified.

MCP invocation order is Context7 first, then Sequential Thinking for complex
setup work, Fetch for URL content, and Git for git tasks.

Hard enforcement reminders include no answers or code before Context7, no npm,
npx, yarn, or pnpm commands, and mandatory use of specialized MCPs whenever
their domain applies.
