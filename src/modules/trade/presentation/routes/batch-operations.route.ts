import { createRoute } from "@hono/zod-openapi";
import { batchOperationsBodySchema } from "../validators/batch-operations-body.validator.ts";
import { batchOperationResultSchema } from "../schemas/batch-operations-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const batchOperationsRoute = createRoute({
  method: "post",
  path: "/batch",
  tags: ["Trades"],
  summary: "Execute batch trade operations",
  description:
    "Execute multiple trade operations atomically. All operations succeed or fail together. Supports mixed operations (create, update, delete, etc.).",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: batchOperationsBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: batchOperationResultSchema } },
      description: "All operations completed successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error or operation failed",
    },
    404: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "One or more items not found",
    },
  },
});

export { batchOperationsRoute };
