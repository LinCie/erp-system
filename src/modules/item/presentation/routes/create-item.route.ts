import { createRoute } from "@hono/zod-openapi";
import {
  createItemBodySchema,
  createItemFormSchema,
} from "../validators/create-item-body.validator.ts";
import { itemResponseSchema } from "../schemas/item-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createItemRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Items"],
  summary: "Create a new item",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createItemBodySchema },
        "multipart/form-data": { schema: createItemFormSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: itemResponseSchema } },
      description: "Item created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { createItemRoute };
