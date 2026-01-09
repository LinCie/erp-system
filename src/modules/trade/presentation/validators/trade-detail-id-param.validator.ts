import { z } from "@hono/zod-openapi";

/**
 * Validator for trade detail ID path parameter
 */
const tradeDetailIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
    detailId: z.coerce.number().openapi({
      param: { name: "detailId", in: "path" },
      example: 1,
    }),
  })
  .openapi("TradeDetailIdParam");

type TradeDetailIdParam = z.infer<typeof tradeDetailIdParamSchema>;

export { tradeDetailIdParamSchema };
export type { TradeDetailIdParam };
