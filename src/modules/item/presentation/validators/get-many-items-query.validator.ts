import { z } from "@hono/zod-openapi";

const getManyItemsQuerySchema = z
  .object({
    spaceId: z.coerce.number().openapi({ example: 1 }),
    type: z.enum(["full", "partial"]).openapi({ example: "full" }),
    search: z.string().optional().openapi({ example: "keyword" }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
  })
  .openapi("GetManyItemsQuery");

type GetManyItemsQuery = z.infer<typeof getManyItemsQuerySchema>;

export { getManyItemsQuerySchema };
export type { GetManyItemsQuery };
