import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const mutationItemSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    transaction_id: z.number().openapi({ example: 100 }),
    sent_time: z.string().optional().openapi({
      example: "2024-01-15T10:30:00Z",
    }),
    number: z.string().optional().openapi({ example: "INV-001" }),
    sender_notes: z.string().optional().openapi({ example: "Purchase order" }),
    handler_notes: z.string().optional().openapi({ example: "Received" }),
    notes: z.string().optional().openapi({ example: "Item notes" }),
    model_type: z.string().optional().openapi({ example: "JS" }),
    cost_per_unit: z.string().openapi({ example: "10000.00" }),
    debit: z.string().openapi({ example: "5.00" }),
    credit: z.string().openapi({ example: "0.00" }),
  })
  .openapi("MutationItem");

const mutationSummarySchema = z
  .object({
    initialBalance: z.number().openapi({ example: 50 }),
    initialDebit: z.number().openapi({ example: 100 }),
    initialCredit: z.number().openapi({ example: 50 }),
    pageDebit: z.number().openapi({ example: 20 }),
    pageCredit: z.number().openapi({ example: 10 }),
  })
  .openapi("MutationSummary");

const getMutationsResponseSchema = z
  .object({
    data: z.array(mutationItemSchema),
    metadata: getManyMetadataSchema,
    summary: mutationSummarySchema,
  })
  .openapi("GetMutationsResponse");

export {
  getMutationsResponseSchema,
  mutationItemSchema,
  mutationSummarySchema,
};
