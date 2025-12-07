import { z } from "@hono/zod-openapi";

const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(1).openapi({ example: "eyJhbGciOiJIUzI1..." }),
  })
  .openapi("RefreshBody");

export { refreshBodySchema };
