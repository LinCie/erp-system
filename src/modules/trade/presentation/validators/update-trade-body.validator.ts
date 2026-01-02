import { z } from "@hono/zod-openapi";
import { TRADE_STATUS } from "../../domain/trade-status.type.ts";

const fileSchema = z
  .object({
    name: z.string().openapi({ example: "document.pdf" }),
    path: z.string().openapi({ example: "/trades/document.pdf" }),
    size: z.number().openapi({ example: 1024 }),
  })
  .openapi("TradeFile");

const linkSchema = z
  .object({
    url: z.string().openapi({ example: "https://example.com" }),
    title: z.string().optional().openapi({ example: "Reference Link" }),
    description: z.string().optional().openapi({ example: "Link description" }),
  })
  .openapi("TradeLink");

const tradeDetailInputSchema = z
  .object({
    item_id: z.coerce.number().openapi({ example: 1 }),
    model_type: z.string().openapi({ example: "SO" }),
    quantity: z.number().openapi({ example: 10 }),
    price: z.number().openapi({ example: 15000 }),
    discount: z.number().optional().openapi({ example: 0 }),
    weight: z.number().optional().openapi({ example: 1.50 }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    name: z.string().optional().openapi({ example: "Product Name" }),
    notes: z.string().optional().openapi({ example: "Detail notes" }),
  })
  .openapi("TradeDetailInput");

const updateTradeBodySchema = z
  .object({
    handler_id: z.coerce.number().optional().openapi({ example: 1 }),
    sent_time: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    received_time: z.coerce.date().optional().openapi({
      example: "2024-01-16T14:00:00Z",
    }),
    receiver_id: z.coerce.number().optional().openapi({ example: 2 }),
    receiver_notes: z.string().optional().openapi({
      example: "Receiver notes",
    }),
    handler_notes: z.string().optional().openapi({ example: "Handler notes" }),
    description: z.string().optional().openapi({
      example: "Trade description",
    }),
    status: z.union([z.string(), z.enum(TRADE_STATUS)]).optional().openapi({
      example: "TX_READY",
    }),
    parent_id: z.coerce.number().optional().openapi({ example: 1 }),
    files: z.array(fileSchema).optional().openapi({ example: [] }),
    tags: z.array(z.string()).optional().openapi({
      example: ["urgent", "vip"],
    }),
    links: z.array(linkSchema).optional().openapi({ example: [] }),
    details: z.array(tradeDetailInputSchema).optional().openapi({
      example: [],
    }),
  })
  .openapi("UpdateTradeBody");

type UpdateTradeBody = z.infer<typeof updateTradeBodySchema>;

export { tradeDetailInputSchema, updateTradeBodySchema };
export type { UpdateTradeBody };
