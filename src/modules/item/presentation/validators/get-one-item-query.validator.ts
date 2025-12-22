import { z } from "@hono/zod-openapi";

const getOneItemQuerySchema = z
  .object({
    withInventory: z.coerce.boolean().optional().default(false).openapi({
      param: { name: "withInventory", in: "query" },
      example: false,
    }),
    spaceId: z.coerce.number().optional().openapi({
      param: { name: "spaceId", in: "query" },
      example: 1,
      description:
        "Space ID to filter inventories by space and its children. If not provided, all inventories are returned.",
    }),
  })
  .openapi("GetOneItemQuery");

type GetOneItemQuery = z.infer<typeof getOneItemQuerySchema>;

export { getOneItemQuerySchema };
export type { GetOneItemQuery };
