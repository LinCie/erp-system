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

const tradeAddressSchema = z
  .object({
    street: z.string().openapi({ example: "123 Main St" }),
    city: z.string().openapi({ example: "New York" }),
    state: z.string().openapi({ example: "NY" }),
    zip: z.string().openapi({ example: "10001" }),
    country: z.string().openapi({ example: "USA" }),
  })
  .openapi("TradeAddress");

const playersSchema = z
  .object({
    name: z.string().openapi({ example: "John Doe" }),
    phone: z.string().openapi({ example: "1234567890" }),
    email: z.string().openapi({ example: "example@email.com" }),
  })
  .openapi("TradePlayer");

const timestampsSchema = z
  .object({
    createdAt: z.coerce.date(),
    packagedAt: z.coerce.date().nullable().optional(),
    shippedAt: z.coerce.date().nullable().optional(),
    deliveredAt: z.coerce.date().nullable().optional(),
    cancelledAt: z.coerce.date().nullable().optional(),
    completedAt: z.coerce.date().nullable().optional(),
  })
  .openapi("TradeTimestamps");

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
    players: playersSchema.optional().openapi({
      example: {
        name: "John Doe",
        phone: "1234567890",
        email: "example@email.com",
      },
    }),
    timestamps: timestampsSchema.optional().openapi({
      example: {
        createdAt: "2024-01-15T10:00:00Z",
        packagedAt: "2024-01-15T10:30:00Z",
        shippedAt: "2024-01-15T11:00:00Z",
        deliveredAt: "2024-01-15T11:30:00Z",
        cancelledAt: "2024-01-15T12:00:00Z",
        completedAt: "2024-01-15T12:30:00Z",
      },
    }),
    addresses: tradeAddressSchema.optional().openapi({
      example: {
        street: "123 Main St",
        city: "New York",
        state: "NY",
        zip: "10001",
        country: "USA",
      },
    }),
    details: z.array(tradeDetailInputSchema).optional().openapi({
      example: [],
    }),
  })
  .openapi("UpdateTradeBody");

type UpdateTradeBody = z.infer<typeof updateTradeBodySchema>;

export { tradeDetailInputSchema, updateTradeBodySchema };
export type { UpdateTradeBody };
