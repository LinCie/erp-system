import { createRoute } from "@hono/zod-openapi";
import { getManySpacesQuerySchema } from "../validators/getManySpacesQuery.ts";
import { spaceListResponseSchema } from "../schemas/space-response.schema.ts";
import { errorResponseSchema } from "../schemas/error-response.schema.ts";

const getManySpacesRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Spaces"],
  summary: "Get many spaces",
  security: [{ Bearer: [] }],
  request: {
    query: getManySpacesQuerySchema,
  },
  responses: {
    200: {
      content: { "application/json": { schema: spaceListResponseSchema } },
      description: "List of spaces",
    },
    400: {
      content: { "application/json": { schema: errorResponseSchema } },
      description: "Validation error",
    },
  },
});

export { getManySpacesRoute };
