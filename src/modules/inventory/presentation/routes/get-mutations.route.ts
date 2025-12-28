import { createRoute } from "@hono/zod-openapi";
import { inventoryIdParamSchema } from "../validators/inventory-id-param.validator.ts";
import { getMutationsQuerySchema } from "../validators/get-mutations-query.validator.ts";
import { getMutationsResponseSchema } from "../schemas/mutation-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getMutationsRoute = createRoute({
  method: "get",
  path: "/{id}/mutations",
  tags: ["Inventories"],
  summary: "Get inventory mutations (transaction history)",
  security: [{ Bearer: [] }],
  request: {
    params: inventoryIdParamSchema,
    query: getMutationsQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: getMutationsResponseSchema } },
      description: "Inventory mutations retrieved successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getMutationsRoute };
