import { createRoute } from "@hono/zod-openapi";
import { spaceIdParamSchema } from "../validators/spaceIdParam.ts";
import { updateSpaceBodySchema } from "../validators/updateSpaceBody.ts";
import { spaceResponseSchema } from "../schemas/space-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const updateSpaceRoute = createRoute({
  method: "patch",
  path: "/{id}",
  tags: ["Spaces"],
  summary: "Update a space",
  security: [{ Bearer: [] }],
  request: {
    params: spaceIdParamSchema,
    body: {
      content: {
        "application/json": { schema: updateSpaceBodySchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: spaceResponseSchema } },
      description: "Space updated successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { updateSpaceRoute };
