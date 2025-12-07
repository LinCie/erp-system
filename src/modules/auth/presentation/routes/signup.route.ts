import { createRoute } from "@hono/zod-openapi";
import { signupBodySchema } from "../validators/signupBody.ts";
import { tokensResponseSchema } from "../schemas/tokens-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const signupRoute = createRoute({
  method: "post",
  path: "/signup",
  tags: ["Auth"],
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": { schema: signupBodySchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: tokensResponseSchema } },
      description: "User created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { signupRoute };
