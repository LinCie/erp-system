import { z } from "@hono/zod-openapi";
import { getManyMetadataSchema } from "@/shared/presentation/schemas/get-many-metadata.schema.ts";

const transactionResponseSchema = z
  .object({
    id: z.number().openapi({ example: 1 }),
    name: z.string().openapi({ example: "My Transaction" }),
    status: z.string().openapi({ example: "active" }),
  })
  .openapi("TransactionResponse");

const getManyTransactionsResponseSchema = z.object({
  data: z.array(transactionResponseSchema),
  metadata: getManyMetadataSchema,
}).openapi("GetManyTransactionsResponse");

export { transactionResponseSchema, getManyTransactionsResponseSchema };
