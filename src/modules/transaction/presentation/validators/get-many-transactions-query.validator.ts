import { z } from "@hono/zod-openapi";

const getManyTransactionsQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({
      example: "active",
    }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
    model_type: z.string().optional().openapi({ example: "SO" }),
    sender_id: z.coerce.number().optional().openapi({ example: 1 }),
    receiver_id: z.coerce.number().optional().openapi({ example: 2 }),
    handler_id: z.coerce.number().optional().openapi({ example: 1 }),
    sent_time_from: z.coerce.date().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    sent_time_to: z.coerce.date().optional().openapi({
      example: "2024-12-31T23:59:59Z",
    }),
    received_time_from: z.coerce.date().optional().openapi({
      example: "2024-01-01T00:00:00Z",
    }),
    received_time_to: z.coerce.date().optional().openapi({
      example: "2024-12-31T23:59:59Z",
    }),
  })
  .openapi("GetManyTransactionsQuery");

type GetManyTransactionsQuery = z.infer<typeof getManyTransactionsQuerySchema>;

export { getManyTransactionsQuerySchema };
export type { GetManyTransactionsQuery };
