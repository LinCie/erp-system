import { z } from "@hono/zod-openapi";

export const lookupBodyValidatorSchema = z
  .object({
    number: z.string().openapi({ example: "TX_123" }),
    lastFourDigits: z.string().length(4).openapi({ example: "7890" }),
  })
  .openapi("LookupBodyValidatorSchema");

export type LookupBodyValidatorSchema = z.infer<
  typeof lookupBodyValidatorSchema
>;
