import { z } from "@hono/zod-openapi";

const tradeIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
  })
  .openapi("TradeIdParam");

type TradeIdParams = z.infer<typeof tradeIdParamSchema>;

export { tradeIdParamSchema };
export type { TradeIdParams };
