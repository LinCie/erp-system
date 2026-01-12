---
trigger: always_on
---

## Do's

### Architecture & Structure

✅ **Follow the 4-layer architecture strictly** - never skip layers ✅ **Use
TypeScript interfaces and type exports** for all contracts ✅ **Create Zod
schemas with OpenAPI decorators** for all endpoints ✅ **Use repository
pattern** for all data access operations ✅ **Implement proper dependency
injection** in module initialization ✅ **Write tests** in `__tests__`
directories (see inventory module for examples) ✅ **Use the `create-module`
script** for scaffolding new modules: `deno task create:module`

### Code Quality

✅ **Always consult Context7** before generating code with external libraries ✅
**Use sequential thinking** for complex architectural decisions or debugging ✅
**Export all types** that might be used by other modules ✅ **Add OpenAPI
examples** to all Zod schemas ✅ **Use proper error handling** with custom error
types ✅ **Follow existing naming conventions** (kebab-case for files,
PascalCase for classes) ✅ **Add proper JSDoc comments** to complex functions

### Database Operations

✅ **Use Kysely query builder** - no raw SQL ✅ **Define database types** in
`database.d.ts` and keep them updated ✅ **Use transactions** for multi-step
operations ✅ **Implement proper mapping** between domain entities and database
rows

### API Design

✅ **Define routes in separate files** under `routes/` directory ✅ **Group
endpoints by resource** (e.g., `/items`, `/inventories`) ✅ **Use HTTP verbs
correctly** (GET, POST, PUT, DELETE) ✅ **Return proper status codes** (201 for
created, 200 for success, 400 for errors) ✅ **Include error response schemas**
for all endpoints that can fail

## Don'ts

### Architecture & Structure

❌ **Don't mix concerns across layers** - each layer has a single responsibility
❌ **Don't skip the repository abstraction** - never call `getDatabase()` from
controllers or services directly ❌ **Don't put business logic in
controllers** - delegates to services only ❌ **Don't use inline types** -
create proper type definitions and export them ❌ **Don't bypass the service
layer** - controllers shouldn't contain business rules ❌ **Don't use direct
database queries outside repositories** - all DB access goes through
repositories

### Code Quality

❌ **Don't generate code without checking Context7 documentation first** - this
is mandatory ❌ **Don't skip systematic thinking for complex problems** - use
sequential thinking tool ❌ **Don't forget to export types** - if a type is
defined, it should be exported ❌ **Don't use `any` type** - use proper
TypeScript types ❌ **Don't duplicate code** - extract common patterns to shared
utilities

### API Design

❌ **Don't create endpoints without OpenAPI documentation** - use
`createRoute()` and `.openapi()` ❌ **Don't skip request validation** - always
define Zod schemas for request bodies and parameters ❌ **Don't return
inconsistent response formats** - use proper response schemas ❌ **Don't forget
error handling** - all endpoints should handle errors gracefully

### Security

❌ **Don't expose sensitive data** in responses ❌ **Don't skip
authentication** - use `security: [{ Bearer: [] }]` for protected routes ❌
**Don't store passwords in plain text** - use bcryptjs ❌ **Don't ignore input
validation** - trust but verify
