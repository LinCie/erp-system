import { createRoute } from "@hono/zod-openapi";
import { inventoryIdParamSchema } from "../validators/inventory-id-param.validator.ts";
import { inventoryResponseSchema } from "../schemas/inventory-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOneInventoryRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Inventories"],
  summary: "Get inventory by ID",
  security: [{ Bearer: [] }],
  request: { params: inventoryIdParamSchema },
  responses: {
    200: { content: { "application/json": { schema: inventoryResponseSchema } }, description: "Inventory details" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getOneInventoryRoute };
