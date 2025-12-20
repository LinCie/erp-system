import { z } from "@hono/zod-openapi";

const createInventoryBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Inventory" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("CreateInventoryBody");

type CreateInventoryBody = z.infer<typeof createInventoryBodySchema>;

export { createInventoryBodySchema };
export type { CreateInventoryBody };
