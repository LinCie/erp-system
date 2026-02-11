import { z } from "@hono/zod-openapi";
import { createTradeDetailBodySchema } from "./create-trade-detail-body.validator.ts";

/**
 * Validator for updating a trade detail (line item)
 * Excludes itemId which is immutable after creation
 */
const updateTradeDetailBodySchema = createTradeDetailBodySchema
  .partial()
  .omit({ itemId: true })
  .openapi("UpdateTradeDetailBody");

type UpdateTradeDetailBody = z.infer<typeof updateTradeDetailBodySchema>;

export { updateTradeDetailBodySchema };
export type { UpdateTradeDetailBody };
