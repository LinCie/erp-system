import { z } from "@hono/zod-openapi";

const createTransactionBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Transaction" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("CreateTransactionBody");

type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;

export { createTransactionBodySchema };
export type { CreateTransactionBody };
