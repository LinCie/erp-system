---
description:
---

## MCP Tool Usage Guidelines

### Context7 Usage - MANDATORY for Code Generation

**ALWAYS** query Context7 for library documentation before generating any code
involving external libraries.

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
