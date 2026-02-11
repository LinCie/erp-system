import { z } from "@hono/zod-openapi";
import { TRADE_STATUS } from "../../domain/types/trade-status.type.ts";

const getManyTradesQuerySchema = z
  .object({
    space_id: z.coerce.number().openapi({ example: 1 }),
    page: z.coerce.number().positive().optional().openapi({ example: 1 }),
    limit: z.coerce.number().positive().optional().openapi({ example: 10 }),
    status: z.enum(TRADE_STATUS).optional().openapi({
      example: "TX_DRAFT",
    }),
    model_type: z.string().optional().openapi({ example: "SO" }),
    search: z.string().optional().openapi({ example: "TRD_001" }),
    sort: z
      .enum(["id", "number", "total", "created_at", "sent_time"])
      .optional()
      .openapi({ example: "created_at" }),
    order: z.enum(["asc", "desc"]).optional().openapi({ example: "desc" }),
    with_details: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    with_players: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    with_children: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    with_parent: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
  })
  .openapi("GetManyTradesQuery");

type GetManyTradesQuery = z.infer<typeof getManyTradesQuerySchema>;

export { getManyTradesQuerySchema };
export type { GetManyTradesQuery };
