import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";
import { TRADE_STATUS } from "../../domain/trade-status.type.ts";

/**
 * Schema for file attachments in trade responses
 */
const tradeFileSchema = z
  .object({
    name: z.string().openapi({ example: "invoice.pdf" }),
    path: z.string().openapi({ example: "trades/1234567890-invoice.pdf" }),
    size: z.number().openapi({ example: 102400 }),
  })
  .openapi("TradeFile");

/**
 * Schema for link references in trade responses
 */
const tradeLinkSchema = z
  .object({
    url: z.string().openapi({ example: "https://example.com/order/123" }),
    title: z.string().optional().openapi({ example: "Order Reference" }),
    description: z.string().optional().openapi({
      example: "Link to original order",
    }),
  })
  .openapi("TradeLink");

/**
 * Schema for player info in trade responses (sender, receiver, handler)
 */
const playerInfoSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    code: z.string().optional().openapi({ example: "CUST-001" }),
    name: z.string().openapi({ example: "John Doe" }),
  })
  .openapi("PlayerInfo");

/**
 * Schema for item info in trade detail responses
 * Only populated when detail_type is 'ITM'
 */
const itemInfoSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "Product Name" }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    cost: z.string().openapi({ example: "1000.00" }),
    price: z.string().openapi({ example: "1500.00" }),
  })
  .openapi("ItemInfo");

/**
 * Schema for trade detail (line item) responses
 * Represents individual items within a trade transaction
 */
const tradeDetailResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    model_type: z.string().openapi({ example: "SO" }),
    sku: z.string().optional().openapi({ example: "SKU-001" }),
    name: z.string().optional().openapi({ example: "Product Name" }),
    quantity: z.number().openapi({ example: 10 }),
    price: z.number().openapi({ example: 1500 }),
    discount: z.number().openapi({ example: 0.10 }),
    weight: z.number().openapi({ example: 2.50 }),
    debit: z.number().openapi({ example: 10 }),
    credit: z.number().openapi({ example: 0 }),
    notes: z.string().optional().openapi({
      example: "Special handling required",
    }),
    item: itemInfoSchema.optional().openapi({
      example: {
        id: 1,
        name: "Product Name",
        sku: "SKU-001",
        cost: "1000.00",
        price: "1500.00",
      },
    }),
  })
  .openapi("TradeDetailResponse");

/**
 * Schema for single trade response
 * Includes all trade fields and optional details array
 */
const tradeResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    number: z.string().openapi({ example: "TRD_1" }),
    space_id: z.number().openapi({ example: 1 }),
    status: z.union([z.string(), z.enum(TRADE_STATUS)]).openapi({
      example: "TX_DRAFT",
    }),
    total: z.string().openapi({ example: "13500.00" }),
    sent_time: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    received_time: z.coerce.date().optional().openapi({
      example: "2024-01-16T14:00:00Z",
    }),
    sender_id: z.number().optional().openapi({ example: 10 }),
    receiver_id: z.number().optional().openapi({ example: 20 }),
    handler_id: z.number().optional().openapi({ example: 30 }),
    parent_id: z.number().optional().openapi({ example: 5 }),
    sender_notes: z.string().optional().openapi({
      example: "Please handle with care",
    }),
    receiver_notes: z.string().optional().openapi({
      example: "Received in good condition",
    }),
    handler_notes: z.string().optional().openapi({
      example: "Processed on schedule",
    }),
    description: z.string().optional().openapi({
      example: "Monthly supply order",
    }),
    fee: z.string().optional().openapi({ example: "50.00" }),
    files: z.array(tradeFileSchema).optional().openapi({
      example: [
        {
          name: "invoice.pdf",
          path: "trades/1234567890-invoice.pdf",
          size: 102400,
        },
      ],
    }),
    tags: z.array(z.string()).optional().openapi({
      example: ["urgent", "wholesale"],
    }),
    links: z.array(tradeLinkSchema).optional().openapi({
      example: [
        {
          url: "https://example.com/order/123",
          title: "Order Reference",
          description: "Link to original order",
        },
      ],
    }),
    children: z.array(z.any()).optional().openapi({
      example: [
        {
          id: 5,
          number: "TRD_5_CHILD",
          status: "TX_DRAFT",
          total: "500.00",
          space_id: 1,
        },
      ],
    }),
    details: z.array(tradeDetailResponseSchema).optional().openapi({
      example: [
        {
          id: 1,
          item_id: 100,
          model_type: "SO",
          sku: "SKU-001",
          name: "Product Name",
          quantity: "10.00",
          price: "1500.00",
          discount: "0.10",
          weight: "2.50",
          debit: "10.00",
          credit: "0.00",
          notes: "Special handling required",
        },
      ],
    }),
    sender: playerInfoSchema.optional().openapi({
      example: { id: 10, code: "TEAM-001", name: "Sales Team" },
    }),
    receiver: playerInfoSchema.optional().openapi({
      example: { id: 20, code: "CUST-001", name: "Customer Name" },
    }),
    handler: playerInfoSchema.optional().openapi({
      example: { id: 30, code: "TEAM-002", name: "Handler Team" },
    }),
    all_notes: z.string().optional().openapi({
      example: "Sender notes - Handler notes",
    }),
    created_at: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:00:00Z",
    }),
    updated_at: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
  })
  .openapi("TradeResponse");

/**
 * Schema for getMany trades response with data array and pagination metadata
 */
const getManyTradesResponseSchema = z
  .object({
    data: z.array(tradeResponseSchema),
    metadata: getManyMetadataSchema,
  })
  .openapi("GetManyTradesResponse");

export {
  getManyTradesResponseSchema,
  itemInfoSchema,
  playerInfoSchema,
  tradeDetailResponseSchema,
  tradeFileSchema,
  tradeLinkSchema,
  tradeResponseSchema,
};
