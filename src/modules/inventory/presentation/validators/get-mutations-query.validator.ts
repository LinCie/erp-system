import { z } from "@hono/zod-openapi";

const getMutationsQuerySchema = z
  .object({
    start_date: z.string().optional().openapi({ example: "2024-01-01" }),
    end_date: z.string().optional().openapi({ example: "2024-12-31" }),
    search: z.string().optional().openapi({ example: "INV" }),
    page: z.coerce.number().optional().openapi({ example: 1 }),
    limit: z.coerce.number().optional().openapi({ example: 10 }),
  })
  .openapi("GetMutationsQuery");

type GetMutationsQuery = z.infer<typeof getMutationsQuerySchema>;

export { getMutationsQuerySchema };
export type { GetMutationsQuery };
