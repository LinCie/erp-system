import { z } from "@hono/zod-openapi";

const createContactBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Contact" }),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
  })
  .openapi("CreateContactBody");

type CreateContactBody = z.infer<typeof createContactBodySchema>;

export { createContactBodySchema };
export type { CreateContactBody };
