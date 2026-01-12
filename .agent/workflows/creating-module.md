---
description:
---

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
             schema: z.object({/* fields */}),
           },
         },
       },
     },
     responses: {
       200: {
         content: {
           "application/json": {
             schema: responseSchema,
           },
         },
         description: "Success",
       },
       400: {
         content: {
           "application/json": {
             schema: errorResponseSchema,
           },
         },
         description: "Error",
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

This updates `src/shared/infrastructure/persistence/database.d.ts` with the
latest schema types.
