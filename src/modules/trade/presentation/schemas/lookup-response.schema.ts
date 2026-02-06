import { z } from "@hono/zod-openapi";

const successLookupResponseSchema = z.object({
  id: z.number().openapi({ example: 1 }),
  success: z.literal(true).openapi({ example: true }),
});

const failedLookupResponseSchema = z.object({
  success: z.literal(false).openapi({ example: false }),
});

export const lookupResponseSchema = z
  .discriminatedUnion("success", [
    successLookupResponseSchema,
    failedLookupResponseSchema,
  ])
  .openapi("LookupResponse");

export type LookupResponseSchema = z.infer<typeof lookupResponseSchema>;
