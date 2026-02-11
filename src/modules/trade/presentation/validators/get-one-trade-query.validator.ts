import { z } from "@hono/zod-openapi";

const getOneTradeQuerySchema = z
  .object({
    with_details: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    with_players: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    with_children: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
    with_parent: z
      .string()
      .transform((v) => v === "true")
      .optional()
      .openapi({ example: "true" }),
  })
  .openapi("GetOneTradeQuery");

type GetOneTradeQuery = z.infer<typeof getOneTradeQuerySchema>;

export { getOneTradeQuerySchema };
export type { GetOneTradeQuery };
