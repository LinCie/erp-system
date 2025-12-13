import { createRoute } from "@hono/zod-openapi";
import { itemIdParamSchema } from "../validators/item-id-param.validator.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const deleteItemRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Items"],
  summary: "Delete an item",
  security: [{ Bearer: [] }],
  request: {
    params: itemIdParamSchema,
  },
  responses: {
    204: {
      description: "Item deleted successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { deleteItemRoute };
