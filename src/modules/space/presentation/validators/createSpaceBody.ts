import { z } from "@hono/zod-openapi";

const createSpaceBodySchema = z
  .object({
    name: z.string().openapi({ example: "My Space" }),
    code: z.string().openapi({ example: "my-space" }),
    address: z.object({
      detail: z.string().nullable().openapi({ example: "My Address" }),
    }).nullable().openapi("Address JSON Body"),
    status: z.enum(["active", "inactive"]).openapi({ example: "active" }),
    notes: z.string().nullable().openapi({ example: "My Notes" }),
  })
  .openapi("CreateSpaceBody");

type CreateSpaceBody = z.infer<typeof createSpaceBodySchema>;

export { createSpaceBodySchema };
export type { CreateSpaceBody };
