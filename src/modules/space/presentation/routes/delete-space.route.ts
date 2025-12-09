import { createRoute } from "@hono/zod-openapi";
import { spaceIdParamSchema } from "../validators/spaceIdParam.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const deleteSpaceRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Spaces"],
  summary: "Delete a space",
  security: [{ Bearer: [] }],
  request: {
    params: spaceIdParamSchema,
  },
  responses: {
    204: {
      description: "Space deleted successfully",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { deleteSpaceRoute };
