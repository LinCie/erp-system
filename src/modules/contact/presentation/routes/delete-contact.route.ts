import { createRoute } from "@hono/zod-openapi";
import { contactIdParamSchema } from "../validators/contact-id-param.validator.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const deleteContactRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Contacts"],
  summary: "Delete a contact",
  security: [{ Bearer: [] }],
  request: { params: contactIdParamSchema },
  responses: {
    204: { description: "Contact deleted successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { deleteContactRoute };
