import { createRoute } from "@hono/zod-openapi";
import { createInventoryBodySchema } from "../validators/create-inventory-body.validator.ts";
import { inventoryResponseSchema } from "../schemas/inventory-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createInventoryRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Inventories"],
  summary: "Create a new inventory",
  security: [{ Bearer: [] }],
  request: { body: { content: { "application/json": { schema: createInventoryBodySchema } } } },
  responses: {
    201: { content: { "application/json": { schema: inventoryResponseSchema } }, description: "Inventory created successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { createInventoryRoute };
