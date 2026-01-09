import { createRoute } from "@hono/zod-openapi";
import { contactIdParamSchema } from "../validators/contact-id-param.validator.ts";
import { updateContactBodySchema } from "../validators/update-contact-body.validator.ts";
import { contactResponseSchema } from "../schemas/contact-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const updateContactRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Contacts"],
  summary: "Update a contact",
  security: [{ Bearer: [] }],
  request: {
    params: contactIdParamSchema,
    body: { content: { "application/json": { schema: updateContactBodySchema } } },
  },
  responses: {
    200: { content: { "application/json": { schema: contactResponseSchema } }, description: "Contact updated successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { updateContactRoute };
