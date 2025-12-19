import { createRoute } from "@hono/zod-openapi";
import { requestUploadBodySchema } from "../validators/request-upload-body.validator.ts";
import { requestUploadResponseSchema } from "../schemas/item-response.schema.ts";

const requestUploadRoute = createRoute({
  method: "post",
  path: "/upload",
  tags: ["Upload", "Items"],
  summary: "Request item image upload",
  security: [{ Bearer: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: requestUploadBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Success",
      content: {
        "application/json": {
          schema: requestUploadResponseSchema,
        },
      },
    },
  },
});

export { requestUploadRoute };
