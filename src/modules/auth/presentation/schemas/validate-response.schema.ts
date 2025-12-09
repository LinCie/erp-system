import { z } from "@hono/zod-openapi";

const validateResponseSchema = z
  .object({
    valid: z.boolean().openapi({ example: true }),
  })
  .openapi("ValidateResponse");

export { validateResponseSchema };
