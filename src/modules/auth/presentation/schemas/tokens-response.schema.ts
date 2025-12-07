import { z } from "@hono/zod-openapi";

const tokensResponseSchema = z
  .object({
    access: z.string().openapi({ example: "eyJhbGciOiJIUzI1..." }),
    refresh: z.string().openapi({ example: "eyJhbGciOiJIUzI1..." }),
  })
  .openapi("TokensResponse");

export { tokensResponseSchema };
