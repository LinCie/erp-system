import { createRoute } from "@hono/zod-openapi";
import { lookupBodyValidatorSchema } from "../validators/lookup-body.validator.ts";
import { lookupResponseSchema } from "../schemas/lookup-response.schema.ts";

const lookupRoute = createRoute({
  method: "post",
  path: "/lookup",
  tags: ["Trade"],
  summary: "Lookup trade",
  description: "Lookup trade by number and phone",
  request: {
    body: {
      content: {
        "application/json": {
          schema: lookupBodyValidatorSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: lookupResponseSchema,
        },
      },
      description: "Trade looked up successfully",
    },
  },
});

export { lookupRoute };
