import { z } from "@hono/zod-openapi";
import {
  tradeDetailResponseSchema,
  tradeResponseSchema,
} from "./trade-response.schema.ts";

const batchOperationResultSchema = z
  .object({
    created: z.array(tradeResponseSchema).openapi({ example: [] }),
    read: z.array(tradeResponseSchema).openapi({ example: [] }),
    updated: z.array(tradeResponseSchema).openapi({ example: [] }),
    deleted: z.array(z.number()).openapi({ example: [] }),
    createdDetails: z.array(tradeDetailResponseSchema).openapi({ example: [] }),
    updatedDetails: z.array(tradeDetailResponseSchema).openapi({ example: [] }),
    deletedDetails: z.array(z.number()).openapi({ example: [] }),
  })
  .openapi("BatchOperationResult");

export { batchOperationResultSchema };
