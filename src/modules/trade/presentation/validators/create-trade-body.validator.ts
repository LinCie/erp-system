import { z } from "@hono/zod-openapi";
import { TRADE_STATUS } from "../../domain/types/trade-status.type.ts";

const createTradeBodySchema = z
  .object({
    spaceId: z.coerce.number().openapi({ example: 1 }),
    sentTime: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    senderNotes: z.string().optional().openapi({
      example: "Initial trade notes",
    }),
    number: z.string().optional().openapi({ example: "TRD_001" }),
    status: z.enum(TRADE_STATUS).optional().openapi({
      example: "TX_DRAFT",
    }),
  })
  .openapi("CreateTradeBody");

type CreateTradeBody = z.infer<typeof createTradeBodySchema>;

export { createTradeBodySchema };
export type { CreateTradeBody };
