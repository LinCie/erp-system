import { createRoute } from "@hono/zod-openapi";
import { createSpaceBodySchema } from "../validators/createSpaceBody.ts";
import { spaceResponseSchema } from "../schemas/space-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const createSpaceRoute = createRoute({
  method: "post",
  path: "/",
  tags: ["Spaces"],
  summary: "Create a new space",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: createSpaceBodySchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: spaceResponseSchema } },
      description: "Space created successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { createSpaceRoute };
