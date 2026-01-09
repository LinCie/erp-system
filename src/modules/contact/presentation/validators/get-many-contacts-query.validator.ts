import { z } from "@hono/zod-openapi";

const getManyContactsQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({
      example: "active",
    }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
    space_id: z.coerce.number().positive().openapi({ example: 1 }),
    with_full_details: z.coerce.boolean().openapi({ example: true }),
  })
  .openapi("GetManyContactsQuery");

type GetManyContactsQuery = z.infer<typeof getManyContactsQuerySchema>;

export { getManyContactsQuerySchema };
export type { GetManyContactsQuery };
