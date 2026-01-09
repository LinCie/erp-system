import { createRoute } from "@hono/zod-openapi";
import { getManyContactsQuerySchema } from "../validators/get-many-contacts-query.validator.ts";
import { getManyContactsResponseSchema } from "../schemas/contact-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getManyContactsRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Contacts"],
  summary: "Get many contacts",
  security: [{ Bearer: [] }],
  request: { query: getManyContactsQuerySchema },
  responses: {
    200: { content: { "application/json": { schema: getManyContactsResponseSchema } }, description: "List of contacts" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getManyContactsRoute };
