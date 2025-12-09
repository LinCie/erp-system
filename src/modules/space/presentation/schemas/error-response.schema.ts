import { z } from "@hono/zod-openapi";

const errorResponseSchema = z
  .object({
    message: z.string().openapi({ example: "invalid body" }),
    issues: z
      .array(
        z.object({
          code: z.string(),
          message: z.string(),
          path: z.array(z.union([z.string(), z.number()])),
        }),
      )
      .optional(),
  })
  .openapi("SpaceErrorResponse");

export { errorResponseSchema };
