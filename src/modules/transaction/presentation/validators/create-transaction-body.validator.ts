import { z } from "@hono/zod-openapi";

const createTransactionBodySchema = z
  .object({
    // Identification
    number: z.string().optional().openapi({ example: "TX_001" }),
    class: z.string().optional().openapi({ example: "sales" }),

    // Polymorphic Relationships
    space_type: z.string().optional().openapi({ example: "Space" }),
    space_id: z.number().optional().openapi({ example: 1 }),
    model_type: z.string().optional().openapi({ example: "SO" }),
    model_id: z.number().optional().openapi({ example: 1 }),
    type_type: z.string().optional().openapi({ example: "TRD" }),
    type_id: z.number().optional().openapi({ example: 1 }),

    // Transaction Parties
    sender_type: z.string().optional().openapi({ example: "Player" }),
    sender_id: z.number().optional().openapi({ example: 1 }),
    receiver_type: z.string().optional().openapi({ example: "Person" }),
    receiver_id: z.number().optional().openapi({ example: 2 }),
    handler_type: z.string().optional().openapi({ example: "Player" }),
    handler_id: z.number().optional().openapi({ example: 1 }),

    // Transaction Flow
    input_type: z.string().optional().openapi({ example: "Inventory" }),
    input_id: z.number().optional().openapi({ example: 1 }),
    output_type: z.string().optional().openapi({ example: "Inventory" }),
    output_id: z.number().optional().openapi({ example: 2 }),
    parent_type: z.string().optional().openapi({ example: "Transaction" }),
    parent_id: z.number().optional().openapi({ example: 1 }),
    relation_type: z.string().optional().openapi({ example: "Relation" }),
    relation_id: z.number().optional().openapi({ example: 1 }),

    // Addresses (JSON)
    input_address: z.record(z.string(), z.unknown()).optional().openapi({
      example: { street: "123 Main St", city: "City" },
    }),
    output_address: z.record(z.string(), z.unknown()).optional().openapi({
      example: { street: "456 Oak Ave", city: "Town" },
    }),

    // Timestamps
    request_time: z.coerce.date().optional().openapi({
      example: "2024-01-01T10:00:00Z",
    }),
    sent_time: z.coerce.date().optional().openapi({
      example: "2024-01-01T11:00:00Z",
    }),
    received_time: z.coerce.date().optional().openapi({
      example: "2024-01-01T12:00:00Z",
    }),

    // Financial
    total: z.string().openapi({ example: "1000.00" }),
    total_details: z.string().optional().openapi({ example: "950.00" }),
    fee: z.string().openapi({ example: "50.00" }),
    fee_rules: z.string().optional().openapi({ example: "standard" }),

    // Notes
    description: z.string().optional().openapi({
      example: "Transaction description",
    }),
    sender_notes: z.string().optional().openapi({ example: "Sender notes" }),
    receiver_notes: z.string().optional().openapi({
      example: "Receiver notes",
    }),
    handler_notes: z.string().optional().openapi({ example: "Handler notes" }),
    handler_number: z.string().optional().openapi({ example: "HDL-001" }),
    notes: z.string().optional().openapi({ example: "General notes" }),

    // Metadata (JSON)
    files: z.array(z.string()).optional().openapi({
      example: ["file1.pdf", "file2.jpg"],
    }),
    tags: z.array(z.string()).optional().openapi({
      example: ["urgent", "priority"],
    }),
    links: z.array(z.string()).optional().openapi({
      example: ["https://example.com"],
    }),

    // Status
    status: z.enum(["active", "inactive", "archived"]).optional().openapi({
      example: "active",
    }),
  })
  .openapi("CreateTransactionBody");

type CreateTransactionBody = z.infer<typeof createTransactionBodySchema>;

export { createTransactionBodySchema };
export type { CreateTransactionBody };
