import { z } from "@hono/zod-openapi";

const createTradeBodySchema = z
  .object({
    space_id: z.coerce.number().openapi({ example: 1 }),
    sender_id: z.coerce.number().openapi({ example: 1 }),
    sent_time: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    sender_notes: z.string().optional().openapi({
      example: "Initial trade notes",
    }),
    number: z.string().optional().openapi({ example: "TRD_001" }),
  })
  .openapi("CreateTradeBody");

type CreateTradeBody = z.infer<typeof createTradeBodySchema>;

export { createTradeBodySchema };
export type { CreateTradeBody };
