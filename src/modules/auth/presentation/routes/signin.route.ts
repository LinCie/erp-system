import { createRoute } from "@hono/zod-openapi";
import { signinBodySchema } from "../validators/signinBody.ts";
import { tokensResponseSchema } from "../schemas/tokens-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const signinRoute = createRoute({
  method: "post",
  path: "/signin",
  tags: ["Auth"],
  summary: "Sign in with email and password",
  request: {
    body: {
      content: {
        "application/json": { schema: signinBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: tokensResponseSchema } },
      description: "Sign in successful",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { signinRoute };
