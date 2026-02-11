import { z } from "@hono/zod-openapi";
import { TRADE_STATUS } from "../../domain/types/trade-status.type.ts";

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

const updateTradeBodySchema = z
  .object({
    handlerId: z.coerce.number().optional().openapi({ example: 1 }),
    sentTime: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    receivedTime: z.coerce.date().optional().openapi({
      example: "2024-01-16T14:00:00Z",
    }),
    receiverId: z.coerce.number().optional().openapi({ example: 2 }),
    receiverNotes: z.string().optional().openapi({
      example: "Receiver notes",
    }),
    handlerNotes: z.string().optional().openapi({ example: "Handler notes" }),
    description: z.string().optional().openapi({
      example: "Trade description",
    }),
    status: z.enum(TRADE_STATUS).optional().openapi({
      example: "TX_READY",
    }),
    parentId: z.coerce.number().optional().openapi({ example: 1 }),
    files: z.array(fileSchema).optional().openapi({ example: [] }),
    tags: z.array(z.string()).optional().openapi({
      example: ["urgent", "vip"],
    }),
    links: z.array(linkSchema).optional().openapi({ example: [] }),
    senderNotes: z.string().optional().openapi({
      example: "Sender notes",
    }),
    total: z.string().optional().openapi({ example: "15000.00" }),
    fee: z.string().optional().openapi({ example: "50.00" }),
  })
  .openapi("UpdateTradeBody");

type UpdateTradeBody = z.infer<typeof updateTradeBodySchema>;

export { updateTradeBodySchema };
export type { UpdateTradeBody };
