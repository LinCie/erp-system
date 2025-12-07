import { z } from "@hono/zod-openapi";

const signupBodySchema = z
  .object({
    name: z.string().min(1).openapi({ example: "John Doe" }),
    email: z.string().email().openapi({ example: "john@example.com" }),
    password: z.string().min(6).openapi({ example: "password123" }),
  })
  .openapi("SignupBody");

export { signupBodySchema };
