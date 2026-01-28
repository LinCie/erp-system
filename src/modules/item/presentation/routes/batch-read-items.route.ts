import { createRoute, z } from "@hono/zod-openapi";
import { batchReadItemsBodySchema } from "../validators/batch-read-items-body.validator.ts";
import { itemResponseSchema } from "../schemas/item-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const batchReadItemsResponseSchema = z.object({
  data: z.array(itemResponseSchema),
}).openapi("BatchReadItemsResponse");

const batchReadItemsRoute = createRoute({
  method: "post",
  path: "/batch/read",
  tags: ["Items"],
  summary: "Get multiple items by IDs",
  description:
    "Retrieve multiple items in a single request. Returns 404 if any ID is not found (atomic behavior).",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: batchReadItemsBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: batchReadItemsResponseSchema } },
      description: "Items retrieved successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
    404: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "One or more items not found",
    },
  },
});

export { batchReadItemsRoute };
