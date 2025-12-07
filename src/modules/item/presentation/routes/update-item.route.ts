import { createRoute } from "@hono/zod-openapi";
import { itemIdParamSchema } from "../validators/itemIdParam.ts";
import { updateItemBodySchema } from "../validators/updateItemBody.ts";
import { itemResponseSchema } from "../schemas/item-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const updateItemRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Items"],
  summary: "Update an item",
  security: [{ Bearer: [] }],
  request: {
    params: itemIdParamSchema,
    body: {
      content: {
        "application/json": { schema: updateItemBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: itemResponseSchema } },
      description: "Item updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { updateItemRoute };
