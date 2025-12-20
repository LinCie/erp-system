import { createRoute } from "@hono/zod-openapi";
import { inventoryIdParamSchema } from "../validators/inventory-id-param.validator.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const deleteInventoryRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Inventories"],
  summary: "Delete a inventory",
  security: [{ Bearer: [] }],
  request: { params: inventoryIdParamSchema },
  responses: {
    204: { description: "Inventory deleted successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { deleteInventoryRoute };
