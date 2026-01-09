import { createRoute } from "@hono/zod-openapi";
import { contactIdParamSchema } from "../validators/contact-id-param.validator.ts";
import { contactResponseSchema } from "../schemas/contact-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOneContactRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Contacts"],
  summary: "Get contact by ID",
  security: [{ Bearer: [] }],
  request: { params: contactIdParamSchema },
  responses: {
    200: { content: { "application/json": { schema: contactResponseSchema } }, description: "Contact details" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { getOneContactRoute };
