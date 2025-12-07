import { createRoute } from "@hono/zod-openapi";
import { refreshBodySchema } from "../validators/refreshBody.ts";
import { tokensResponseSchema } from "../schemas/tokens-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const refreshRoute = createRoute({
  method: "post",
  path: "/refresh",
  tags: ["Auth"],
  summary: "Refresh access token",
  request: {
    body: {
      content: {
        "application/json": { schema: refreshBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: tokensResponseSchema } },
      description: "Tokens refreshed successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { refreshRoute };
