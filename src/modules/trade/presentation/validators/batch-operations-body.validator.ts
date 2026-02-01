import { z } from "@hono/zod-openapi";
import { createTradeBodySchema } from "./create-trade-body.validator.ts";
import { updateTradeBodySchema } from "./update-trade-body.validator.ts";
import { updateTradeTransactionBodySchema } from "./update-trade-transaction-body.validator.ts";
import { createTradeDetailBodySchema } from "./create-trade-detail-body.validator.ts";
import { updateTradeDetailBodySchema } from "./update-trade-detail-body.validator.ts";

const batchReadOperationSchema = z
  .object({
    type: z.literal("read"),
    ids: z
      .array(z.coerce.number().int().positive())
      .min(1)
      .max(1000)
      .openapi({ example: [1, 2, 3] }),
    withDetails: z.boolean().optional().default(false),
  })
  .openapi("BatchReadOperation");

const batchCreateOperationSchema = z
  .object({
    type: z.literal("create"),
    ref: z.string().optional().openapi({ example: "newTrade" }),
    data: createTradeBodySchema,
  })
  .openapi("BatchCreateOperation");

const batchUpdateOperationSchema = z
  .object({
    type: z.literal("update"),
    id: z.coerce.number().int().positive().optional(),
    idRef: z.string().optional().openapi({ example: "newTrade" }),
    data: updateTradeBodySchema,
  })
  .refine((data) => data.id !== undefined || data.idRef !== undefined, {
    message: "Either id or idRef must be provided",
  })
  .refine((data) => !(data.id !== undefined && data.idRef !== undefined), {
    message: "Cannot provide both id and idRef",
  })
  .openapi("BatchUpdateOperation");

const batchUpdateTransactionOperationSchema = z
  .object({
    type: z.literal("updateTransaction"),
    id: z.coerce.number().int().positive().optional(),
    idRef: z.string().optional().openapi({ example: "newTrade" }),
    data: updateTradeTransactionBodySchema,
  })
  .refine((data) => data.id !== undefined || data.idRef !== undefined, {
    message: "Either id or idRef must be provided",
  })
  .refine((data) => !(data.id !== undefined && data.idRef !== undefined), {
    message: "Cannot provide both id and idRef",
  })
  .openapi("BatchUpdateTransactionOperation");

const batchUpdateDetailOperationSchema = z
  .object({
    type: z.literal("updateDetail"),
    tradeId: z.coerce.number().int().positive().optional(),
    tradeIdRef: z.string().optional().openapi({ example: "newTrade" }),
    detailId: z.coerce.number().int().positive(),
    data: updateTradeDetailBodySchema,
  })
  .refine(
    (data) => data.tradeId !== undefined || data.tradeIdRef !== undefined,
    {
      message: "Either tradeId or tradeIdRef must be provided",
    },
  )
  .refine(
    (data) => !(data.tradeId !== undefined && data.tradeIdRef !== undefined),
    {
      message: "Cannot provide both tradeId and tradeIdRef",
    },
  )
  .openapi("BatchUpdateDetailOperation");

const batchCreateDetailOperationSchema = z
  .object({
    type: z.literal("createDetail"),
    tradeId: z.coerce.number().int().positive().optional(),
    tradeIdRef: z.string().optional().openapi({ example: "newTrade" }),
    data: createTradeDetailBodySchema,
  })
  .refine(
    (data) => data.tradeId !== undefined || data.tradeIdRef !== undefined,
    {
      message: "Either tradeId or tradeIdRef must be provided",
    },
  )
  .refine(
    (data) => !(data.tradeId !== undefined && data.tradeIdRef !== undefined),
    {
      message: "Cannot provide both tradeId and tradeIdRef",
    },
  )
  .openapi("BatchCreateDetailOperation");

const batchDeleteDetailOperationSchema = z
  .object({
    type: z.literal("deleteDetail"),
    tradeId: z.coerce.number().int().positive().optional(),
    tradeIdRef: z.string().optional().openapi({ example: "newTrade" }),
    detailId: z.coerce.number().int().positive(),
  })
  .refine(
    (data) => data.tradeId !== undefined || data.tradeIdRef !== undefined,
    {
      message: "Either tradeId or tradeIdRef must be provided",
    },
  )
  .refine(
    (data) => !(data.tradeId !== undefined && data.tradeIdRef !== undefined),
    {
      message: "Cannot provide both tradeId and tradeIdRef",
    },
  )
  .openapi("BatchDeleteDetailOperation");

const batchDeleteOperationSchema = z
  .object({
    type: z.literal("delete"),
    id: z.coerce.number().int().positive().optional(),
    idRef: z.string().optional().openapi({ example: "newTrade" }),
  })
  .refine((data) => data.id !== undefined || data.idRef !== undefined, {
    message: "Either id or idRef must be provided",
  })
  .refine((data) => !(data.id !== undefined && data.idRef !== undefined), {
    message: "Cannot provide both id and idRef",
  })
  .openapi("BatchDeleteOperation");

const batchOperationSchema = z.discriminatedUnion("type", [
  batchReadOperationSchema,
  batchCreateOperationSchema,
  batchUpdateOperationSchema,
  batchUpdateTransactionOperationSchema,
  batchUpdateDetailOperationSchema,
  batchCreateDetailOperationSchema,
  batchDeleteDetailOperationSchema,
  batchDeleteOperationSchema,
]);

const batchOperationsBodySchema = z
  .object({
    operations: z.array(batchOperationSchema).min(1).max(100),
  })
  .openapi("BatchTradeOperationsBody");

type BatchOperationsBody = z.infer<typeof batchOperationsBodySchema>;

export { batchOperationsBodySchema };
export type { BatchOperationsBody };
