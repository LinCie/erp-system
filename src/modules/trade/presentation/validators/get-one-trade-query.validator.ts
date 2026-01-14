import { z } from "@hono/zod-openapi";

const getOneTradeQuerySchema = z
  .object({
    withDetails: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    withPlayers: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    withChildren: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
  })
  .openapi("GetOneTradeQuery");

type GetOneTradeQuery = z.infer<typeof getOneTradeQuerySchema>;

export { getOneTradeQuerySchema };
export type { GetOneTradeQuery };
