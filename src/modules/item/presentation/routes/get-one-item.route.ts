import { createRoute } from "@hono/zod-openapi";
import { itemIdParamSchema } from "../validators/itemIdParam.ts";
import { itemResponseSchema } from "../schemas/item-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOneItemRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Items"],
  summary: "Get item by ID",
  security: [{ Bearer: [] }],
  request: {
    params: itemIdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: itemResponseSchema } },
      description: "Item details",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getOneItemRoute };
