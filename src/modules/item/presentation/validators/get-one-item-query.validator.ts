import { z } from "@hono/zod-openapi";

const getOneItemQuerySchema = z
  .object({
    withInventory: z.coerce.boolean().optional().default(false).openapi({
      param: { name: "withInventory", in: "query" },
      example: false,
    }),
  })
  .openapi("GetOneItemQuery");

type GetOneItemQuery = z.infer<typeof getOneItemQuerySchema>;

export { getOneItemQuerySchema };
export type { GetOneItemQuery };
