import { z } from "@hono/zod-openapi";

export const lookupResponseSchema = z
  .object({
    success: z.boolean().openapi({ example: true }),
  })
  .openapi("LookupResponse");

export type LookupResponseSchema = z.infer<typeof lookupResponseSchema>;
