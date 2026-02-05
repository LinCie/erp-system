import { z } from "@hono/zod-openapi";

export const lookupBodyValidatorSchema = z
  .object({
    number: z.string().openapi({ example: "1234567890" }),
    phone: z.string().openapi({ example: "1234567890" }),
  })
  .openapi("LookupBodyValidatorSchema");

export type LookupBodyValidatorSchema = z.infer<
  typeof lookupBodyValidatorSchema
>;
