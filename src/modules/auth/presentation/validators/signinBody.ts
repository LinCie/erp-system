import { z } from "@hono/zod-openapi";

const signinBodySchema = z
  .object({
    email: z.string().email().openapi({ example: "john@example.com" }),
    password: z.string().min(1).openapi({ example: "password123" }),
  })
  .openapi("SigninBody");

export { signinBodySchema };
