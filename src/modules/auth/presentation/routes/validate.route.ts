import { createRoute } from "@hono/zod-openapi";
import { validateResponseSchema } from "../schemas/validate-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const validateRoute = createRoute({
  method: "get",
  path: "/validate",
  tags: ["Auth"],
  summary: "Validate access token",
  security: [{ Bearer: [] }],
  responses: {
    200: {
      content: { "application/json": { schema: validateResponseSchema } },
      description: "Token is valid",
    },
    401: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Token is invalid or expired",
    },
  },
});

export { validateRoute };
