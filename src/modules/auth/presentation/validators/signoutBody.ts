import { z } from "@hono/zod-openapi";

const signoutBodySchema = z
  .object({
    refreshToken: z.string().min(1).openapi({ example: "eyJhbGciOiJIUzI1..." }),
  })
  .openapi("SignoutBody");

export { signoutBodySchema };
