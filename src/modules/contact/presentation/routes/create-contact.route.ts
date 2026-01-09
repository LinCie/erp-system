import { createRoute } from "@hono/zod-openapi";
import { createContactBodySchema } from "../validators/create-contact-body.validator.ts";
import { contactResponseSchema } from "../schemas/contact-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createContactRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Contacts"],
  summary: "Create a new contact",
  security: [{ Bearer: [] }],
  request: { body: { content: { "application/json": { schema: createContactBodySchema } } } },
  responses: {
    201: { content: { "application/json": { schema: contactResponseSchema } }, description: "Contact created successfully" },
    400: { content: { "application/json": { schema: errorResponseSchema } }, description: "Validation error" },
  },
});

export { createContactRoute };
