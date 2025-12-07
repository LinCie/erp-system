import { createRoute } from "@hono/zod-openapi";
import { signoutBodySchema } from "../validators/signoutBody.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const signoutRoute = createRoute({
  method: "post",
  path: "/signout",
  tags: ["Auth"],
  summary: "Sign out and invalidate refresh token",
  request: {
    body: {
      content: {
        "application/json": { schema: signoutBodySchema },
      },
    },
  },
  responses: {
    204: {
      description: "Sign out successful",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { signoutRoute };
