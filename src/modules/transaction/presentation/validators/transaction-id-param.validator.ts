import { z } from "@hono/zod-openapi";

const transactionIdParamSchema = z
  .object({
    id: z.coerce.number().openapi({
      param: { name: "id", in: "path" },
      example: 1,
    }),
  })
  .openapi("TransactionIdParam");

type TransactionIdParams = z.infer<typeof transactionIdParamSchema>;

export { transactionIdParamSchema };
export type { TransactionIdParams };
