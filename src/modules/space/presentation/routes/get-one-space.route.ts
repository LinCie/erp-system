import { createRoute } from "@hono/zod-openapi";
import { spaceIdParamSchema } from "../validators/spaceIdParam.ts";
import { spaceResponseSchema } from "../schemas/space-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getOneSpaceRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Spaces"],
  summary: "Get space by ID",
  security: [{ Bearer: [] }],
  request: {
    params: spaceIdParamSchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: spaceResponseSchema } },
      description: "Space details",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getOneSpaceRoute };
