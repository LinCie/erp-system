import { createRoute } from "@hono/zod-openapi";
import { inventoryIdParamSchema } from "../validators/inventory-id-param.validator.ts";
import { updateInventoryBodySchema } from "../validators/update-inventory-body.validator.ts";
import { inventoryResponseSchema } from "../schemas/inventory-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const updateInventoryRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Inventories"],
  summary: "Update a inventory",
  security: [{ Bearer: [] }],
  request: {
    params: inventoryIdParamSchema,
    body: { content: { "application/json": { schema: updateInventoryBodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: inventoryResponseSchema } }, description: "Inventory updated successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { updateInventoryRoute };
