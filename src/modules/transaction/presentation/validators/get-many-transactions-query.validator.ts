import { z } from "@hono/zod-openapi";

const getManyTransactionsQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({ example: "active" }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
  })
  .openapi("GetManyTransactionsQuery");

type GetManyTransactionsQuery = z.infer<typeof getManyTransactionsQuerySchema>;

export { getManyTransactionsQuerySchema };
export type { GetManyTransactionsQuery };
