import { z } from "@hono/zod-openapi";

const getManyInventoriesQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({
      example: "active",
    }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
  })
  .openapi("GetManyInventoriesQuery");

type GetManyInventoriesQuery = z.infer<typeof getManyInventoriesQuerySchema>;

export { getManyInventoriesQuerySchema };
export type { GetManyInventoriesQuery };
