import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";
import { TRADE_STATUS } from "../../domain/types/trade-status.type.ts";

/**
 * Schema for trade addresses in trade responses
 */
const tradeAddressSchema = z
  .object({
    street: z.string().openapi({ example: "123 Main St" }),
    city: z.string().openapi({ example: "New York" }),
    state: z.string().openapi({ example: "NY" }),
    zip: z.string().openapi({ example: "10001" }),
    country: z.string().openapi({ example: "USA" }),
  })
  .openapi("TradeAddress");

const playersSchema = z.object({
  name: z.string().openapi({ example: "John Doe" }),
  phone: z.string().openapi({ example: "1234567890" }),
  email: z.string().openapi({ example: "example@email.com" }),
}).openapi("TradePlayer");

const timestampsSchema = z.object({
  createdAt: z.coerce.date(),
  packagedAt: z.coerce.date().nullable().optional(),
  shippedAt: z.coerce.date().nullable().optional(),
  deliveredAt: z.coerce.date().nullable().optional(),
  cancelledAt: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
}).openapi("TradeTimestamps");

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
    price: z.number().openapi({ example: 1500 }),
  })
  .openapi("ItemInfo");

/**
 * Schema for trade detail (line item) responses
 * Represents individual items within a trade transaction
 */
const tradeDetailResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
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
    spaceId: z.number().openapi({ example: 1 }),
    status: z.enum(TRADE_STATUS).openapi({
      example: "TX_DRAFT",
    }),
    total: z.string().openapi({ example: "13500.00" }),
    sentTime: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    receivedTime: z.coerce.date().optional().openapi({
      example: "2024-01-16T14:00:00Z",
    }),
    senderNotes: z.string().optional().openapi({
      example: "Please handle with care",
    }),
    receiverNotes: z.string().optional().openapi({
      example: "Received in good condition",
    }),
    handlerNotes: z.string().optional().openapi({
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
    children: z.array(z.any()).optional().openapi({
      example: [
        {
          id: 5,
          number: "TRD_5_CHILD",
          status: "TX_DRAFT",
          total: "500.00",
          spaceId: 1,
        },
      ],
    }),
    details: z.array(tradeDetailResponseSchema).optional().openapi({
      example: [
        {
          id: 1,
          sku: "SKU-001",
          name: "Product Name",
          quantity: 10,
          price: 1500,
          discount: 0.10,
          weight: 2.50,
          debit: 10,
          credit: 0,
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
    createdAt: z.coerce.date().optional().openapi({
      example: "2024-01-15T10:00:00Z",
    }),
    updatedAt: z.coerce.date().optional().openapi({
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
