import { z } from "@hono/zod-openapi";

const createItemBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Item" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("CreateItemBody");

type CreateItemBody = z.infer<typeof createItemBodySchema>;

export { createItemBodySchema };
export type { CreateItemBody };
